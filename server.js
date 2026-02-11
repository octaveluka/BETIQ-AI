
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const port = process.env.PORT || 10000;
const distPath = path.join(__dirname, 'dist');
const CACHE_FILE = path.join(__dirname, 'predictions_cache.json');
const VIP_STORAGE_FILE = path.join(__dirname, 'vip_daily_storage.json');

let predictionsCache = new Map();
let vipDailyStorage = {}; 

const loadData = () => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      predictionsCache = new Map(Object.entries(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))));
    }
    if (fs.existsSync(VIP_STORAGE_FILE)) {
      vipDailyStorage = JSON.parse(fs.readFileSync(VIP_STORAGE_FILE, 'utf8'));
    }
  } catch (e) { console.error("Load error", e); }
};

const saveData = () => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(predictionsCache)), 'utf8');
    fs.writeFileSync(VIP_STORAGE_FILE, JSON.stringify(vipDailyStorage), 'utf8');
  } catch (e) { console.error("Save error", e); }
};

loadData();

function extractJsonFromText(text) {
  if (!text) return null;
  try {
    // Nettoyage agressif du markdown
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const start = cleanedText.indexOf('{');
    const end = cleanedText.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const jsonStr = cleanedText.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }
    return JSON.parse(cleanedText);
  } catch (e) { return null; }
}

async function callCopilotAI(prompt) {
  // API Spécifiée par l'utilisateur
  const url = `https://delfaapiai.vercel.app/ai/copilot?message=${encodeURIComponent(prompt)}&model=default`;
  
  try {
    console.log(`[AI] Analyse en cours via Copilot...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout pour analyse approfondie
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    
    const text = await response.text();
    const data = extractJsonFromText(text);
    
    if (data && (data.predictions || data.prediction)) {
        return data;
    }
    throw new Error("Structure JSON invalide reçue de l'IA");
    
  } catch (e) {
    console.error(`[AI] Erreur: ${e.message}`);
    // Structure de repli en cas d'erreur API
    return {
        predictions: [{ type: "1X2", recommendation: "N/A", probability: 0, confidence: "LOW" }],
        analysis: "Analyse IA indisponible pour le moment. Veuillez réessayer plus tard.",
        vipInsight: { exactScores: [], strategy: { safe: "-", value: "-", aggressive: "-" }, keyFact: "-" }
    };
  }
}

const getPrompt = (match) => {
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `Role: Expert Analyste Football.
Contexte: Nous sommes le ${today}. Tu dois impérativement prendre en compte la date du jour, les dernières actualités (blessures, transferts, rumeurs) et la forme très récente des équipes.
Match: ${match.homeTeam} vs ${match.awayTeam} (${match.league}).

Tâche: Analyse ce match et retourne UNIQUEMENT un objet JSON valide.
Règles:
1. Pas de markdown (pas de \`\`\`json).
2. JSON valide uniquement.
3. Si les données sont incertaines, fais une estimation conservatrice basée sur les stats historiques.

Structure JSON attendue:
{
  "predictions": [
    {"type": "1X2", "recommendation": "Victoire Domicile / Nul / Victoire Extérieur", "probability": 85, "confidence": "HIGH", "odds": 1.55},
    {"type": "O/U 2.5", "recommendation": "+2.5 Buts / -2.5 Buts", "probability": 65, "confidence": "MEDIUM", "odds": 1.75},
    {"type": "BTTS", "recommendation": "Oui / Non", "probability": 60, "confidence": "LOW", "odds": 1.90}
  ],
  "analysis": "Une analyse tactique professionnelle et concise (max 3 phrases). Mentionne les joueurs clés.",
  "vipInsight": { 
    "exactScores": ["2-1", "3-1"], 
    "keyFact": "Fait marquant (ex: Joueur clé blessé, Équipe invaincue à domicile)", 
    "strategy": {"safe": "Double Chance 1X", "value": "Victoire & +1.5 Buts", "aggressive": "Victoire -1 Handicap"} 
  }
}`;
};

app.post('/api/analyze', async (req, res) => {
  const { match } = req.body;
  if (!match) return res.status(400).json({ error: "Match missing" });
  
  // Clé de cache incluant la date pour forcer une nouvelle analyse chaque jour
  const todayKey = new Date().toISOString().split('T')[0];
  const cacheKey = `${match.id}_${todayKey}`;
  
  if (predictionsCache.has(cacheKey)) {
    return res.json(predictionsCache.get(cacheKey));
  }

  try {
    const data = await callCopilotAI(getPrompt(match));
    predictionsCache.set(cacheKey, data);
    saveData();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Service d'analyse indisponible" });
  }
});

app.post('/api/vip-sync', (req, res) => {
  const { date, matches } = req.body;
  
  if (!vipDailyStorage[date] && matches && matches.length >= 3) {
    const shuffled = [...matches].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    // Ajout d'une prédiction par défaut pour l'affichage dans l'historique
    const selectedWithPreds = selected.map(m => ({
       ...m,
       storedPrediction: {
          type: "1X2",
          selection: "Home", 
          label: `Victoire ${m.homeTeam}`
       }
    }));

    vipDailyStorage[date] = selectedWithPreds;
    saveData();
  }
  
  res.json({ today: vipDailyStorage[date] || [] });
});

app.get('/api/history', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const history = Object.entries(vipDailyStorage)
    .filter(([date]) => date < today)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);
  res.json(Object.fromEntries(history));
});

app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`🚀 BETIQ PRO Server Active on ${port}`));
