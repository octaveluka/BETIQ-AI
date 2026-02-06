
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const port = process.env.PORT || 10000;
const distPath = path.join(__dirname, 'dist');
const CACHE_FILE = path.join(__dirname, 'predictions_cache.json');
const VIP_HISTORY_FILE = path.join(__dirname, 'vip_history.json');

let predictionsCache = new Map();
let vipHistory = {}; // Format: { "YYYY-MM-DD": [Match1, Match2, Match3] }

const loadData = () => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      predictionsCache = new Map(Object.entries(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))));
    }
    if (fs.existsSync(VIP_HISTORY_FILE)) {
      vipHistory = JSON.parse(fs.readFileSync(VIP_HISTORY_FILE, 'utf8'));
    }
  } catch (e) { console.error("Load error", e); }
};

const saveData = () => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(predictionsCache)), 'utf8');
    fs.writeFileSync(VIP_HISTORY_FILE, JSON.stringify(vipHistory), 'utf8');
  } catch (e) {}
};

loadData();

/**
 * LOGIQUE DE LA CHAÎNE IA
 */
async function callAIChain(prompt) {
  const urls = [
    `https://delfaapiai.vercel.app/ai/copilot?message=${encodeURIComponent(prompt)}&model=default`,
    `https://delfaapiai.vercel.app/ai/webcopilot?question=${encodeURIComponent(prompt)}`,
    `https://delfaapiai.vercel.app/ai/chatgptfree?prompt=${encodeURIComponent(prompt)}&model=chatgpt4`
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        const json = extractJson(text);
        if (json && json.predictions) return json;
      }
    } catch (e) { console.error(`API Chain Error for ${url}:`, e); }
  }

  // Fallback Gemini
  if (!process.env.API_KEY) throw new Error("Missing Gemini Key");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(result.text || '{}');
}

function extractJson(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (e) { return null; }
}

const getAnalysisPrompt = (match) => `
    ANALYSE EXPERTE FOOTBALL : ${match.homeTeam} VS ${match.awayTeam} (${match.league}).
    FORMAT JSON UNIQUEMENT:
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Victoire...", "probability": 85, "confidence": "HIGH", "odds": 1.5},
        {"type": "O/U 2.5", "recommendation": "+2.5 buts", "probability": 70, "confidence": "MEDIUM", "odds": 1.8},
        {"type": "BTTS", "recommendation": "Oui", "probability": 65, "confidence": "HIGH", "odds": 1.9}
      ],
      "analysis": "Explication tactique courte.",
      "vipInsight": { "exactScores": ["2-1", "1-0"], "strategy": {"safe": "...", "value": "...", "aggressive": "..."}, "keyFact": "..." }
    }
`;

app.post('/api/analyze', async (req, res) => {
  const { match, language } = req.body;
  const cacheKey = `${match.id}_${language}`;

  if (predictionsCache.has(cacheKey)) {
    return res.json(predictionsCache.get(cacheKey).data);
  }

  try {
    const data = await callAIChain(getAnalysisPrompt(match));
    predictionsCache.set(cacheKey, { data, timestamp: Date.now() });
    saveData();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Analysis failed" });
  }
});

/**
 * ENDPOINT : VIP DAILY & HISTORY
 */
app.post('/api/vip-sync', (req, res) => {
  const { date, matches } = req.body; // matches sont les matchs du jour envoyés par le client
  
  if (!vipHistory[date] && matches && matches.length >= 3) {
    // On sélectionne 3 matchs au hasard mais on les fixe pour la date
    const selected = matches.sort(() => 0.5 - Math.random()).slice(0, 3);
    vipHistory[date] = selected;
    saveData();
  }
  
  res.json({ today: vipHistory[date] || [] });
});

app.get('/api/history', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const history = Object.entries(vipHistory)
    .filter(([date]) => date < today)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);
  
  res.json(Object.fromEntries(history));
});

app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`✅ BETIQ Server running on ${port}`));
