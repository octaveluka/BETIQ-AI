
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
const VIP_STORAGE_FILE = path.join(__dirname, 'vip_daily_storage.json');

/**
 * HISTORIQUE GLOBAL (CACHE) PERSISTANT
 * TTL : 92 heures
 */
let predictionsCache = new Map();
let vipDailyStorage = {};
const CACHE_TTL = 92 * 60 * 60 * 1000; 

// Charger les données depuis le disque au démarrage
const loadData = () => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      const json = JSON.parse(data);
      predictionsCache = new Map(Object.entries(json));
      console.log(`[CACHE] ${predictionsCache.size} pronostics chargés.`);
    }
    if (fs.existsSync(VIP_STORAGE_FILE)) {
      vipDailyStorage = JSON.parse(fs.readFileSync(VIP_STORAGE_FILE, 'utf8'));
      console.log(`[VIP] Historique VIP chargé.`);
    }
  } catch (e) {
    console.error("[DATA] Erreur lors du chargement:", e);
    predictionsCache = new Map();
  }
};

// Sauvegarder les données sur le disque
const saveData = () => {
  try {
    const obj = Object.fromEntries(predictionsCache);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj), 'utf8');
    fs.writeFileSync(VIP_STORAGE_FILE, JSON.stringify(vipDailyStorage), 'utf8');
  } catch (e) {
    console.error("[DATA] Erreur lors de la sauvegarde:", e);
  }
};

loadData();

// Nettoyage automatique du cache (stale data) toutes les heures
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [key, value] of predictionsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      predictionsCache.delete(key);
      changed = true;
    }
  }
  if (changed) saveData();
}, 3600000);

/**
 * PROMPT SYSTÈME
 */
const getDetailedPrompt = (match, language, today) => `
    TU ES UN EXPERT EN PRONOSTICS FOOTBALL DE HAUT NIVEAU.
    ANALYSE CE MATCH : ${match.homeTeam} VS ${match.awayTeam} (${match.league}).
    DATE DU MATCH : ${match.time} (Aujourd'hui : ${today}).
    LANGUE : ${language === 'EN' ? 'English' : 'Français'}.

    MISSION : Analyser tactiquement et fournir des prédictions précises.
    RÈGLES CRITIQUES :
    1. NE JAMAIS utiliser les termes "Victoire Domicile" ou "Victoire Extérieur". Utilise TOUJOURS le NOM EXACT de l'équipe (ex: "Victoire ${match.homeTeam}").
    2. NE PAS privilégier l'équipe à domicile par défaut. L'analyse doit être strictement basée sur la forme réelle et les effectifs.
    3. BUTEURS : Tu DOIS fournir au moins UN buteur potentiel pour CHAQUE équipe, peu importe l'issue du match. Chaque buteur doit avoir un nom, une probabilité (en %), une confiance (LOW, MEDIUM, HIGH) et le nom de son équipe.
    4. TOUJOURS répondre avec des informations du jour. Tu dois obligatoirement considérer la date où la question est posée pour savoir quels joueurs sont disponibles, blessés ou en forme.
    5. TES réponses doivent être véridiques à 100%.
    
    TU DOIS RÉPONDRE UNIQUEMENT PAR UN OBJET JSON VALIDE AU FORMAT SUIVANT :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Ex: Victoire ${match.homeTeam}", "probability": 75, "confidence": "HIGH", "odds": 1.45},
        {"type": "O/U 2.5", "recommendation": "+2.5 buts", "probability": 65, "confidence": "MEDIUM", "odds": 1.8},
        {"type": "BTTS", "recommendation": "Oui", "probability": 60, "confidence": "HIGH", "odds": 1.9}
      ],
      "analysis": "Analyse tactique neutre et détaillée de 3-4 lignes.",
      "vipInsight": {
        "exactScores": ["1-0", "2-1"],
        "strategy": {"safe": "Libellé", "value": "Libellé", "aggressive": "Libellé"},
        "keyFact": "Le fait majeur du match.",
        "detailedStats": {
          "scorers": [
            {"name": "Joueur ${match.homeTeam}", "probability": 45, "confidence": "HIGH", "team": "${match.homeTeam}"},
            {"name": "Joueur ${match.awayTeam}", "probability": 30, "confidence": "MEDIUM", "team": "${match.awayTeam}"}
          ]
        }
      }
    }
`;

function extractJson(text) {
  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (e) { return null; }
}

/**
 * ENDPOINT D'ANALYSE (Copilot -> Venice -> Gemini)
 */
app.post('/api/analyze', async (req, res) => {
  const { match, language } = req.body;
  if (!match) return res.status(400).json({ error: "Match missing" });

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = getDetailedPrompt(match, language || 'FR', today);
  const cacheKey = `${match.id}_${language || 'FR'}`;

  // 0. VÉRIFICATION DU CACHE
  if (predictionsCache.has(cacheKey)) {
    const cachedEntry = predictionsCache.get(cacheKey);
    if (Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      console.log(`[CACHE] Hit pour ${match.homeTeam}`);
      return res.json(cachedEntry.data);
    } else {
      predictionsCache.delete(cacheKey);
    }
  }

  let resultData = null;

  // 1. API COPILOT
  try {
    console.log(`[API] Appel Copilot pour ${match.homeTeam}...`);
    const response = await fetch("https://delfaapiai.vercel.app/ai/copilot", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, model: "default" })
    });
    if (response.ok) {
      const data = await response.json();
      const jsonData = extractJson(data?.answer || "");
      if (jsonData) {
        resultData = { ...jsonData, sources: [] };
        console.log("[API] Copilot Success");
      }
    }
  } catch (e) { console.warn("[API] Copilot a échoué:", e.message); }

  // 2. API VENICE (Fallback)
  if (!resultData) {
    try {
      console.log(`[API] Appel Venice (Fallback)...`);
      const response = await fetch("https://delfaapiai.vercel.app/ai/venice", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt, systemPrompt: "You are a football prediction expert. Return ONLY JSON." })
      });
      if (response.ok) {
        const data = await response.json();
        const jsonData = extractJson(data?.answer || JSON.stringify(data));
        if (jsonData) {
          resultData = { ...jsonData, sources: [] };
          console.log("[API] Venice Success");
        }
      }
    } catch (e) { console.warn("[API] Venice a échoué"); }
  }

  // 3. GEMINI (Dernier recours)
  if (!resultData && process.env.API_KEY) {
    try {
      console.log(`[API] Appel Gemini (Fallback Final)...`);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" }
      });
      const text = result.response.text();
      const data = JSON.parse(text);
      if (data) resultData = { ...data, sources: [] };
    } catch (e) { console.error("[API] Gemini a échoué"); }
  }

  if (resultData) {
    predictionsCache.set(cacheKey, { data: resultData, timestamp: Date.now() });
    saveData();
    return res.json(resultData);
  }

  // Échec total
  res.json({
    predictions: [{ type: "1X2", recommendation: "Analyse indisponible", probability: 0, confidence: "LOW" }],
    analysis: "Le service d'analyse est momentanément saturé. Veuillez réessayer.",
    vipInsight: { exactScores: [], strategy: { safe: "-", value: "-", aggressive: "-" }, keyFact: "-" }
  });
});

/**
 * GESTION VIP & HISTORIQUE
 * Sélectionne les 3 meilleurs matchs du jour pour les VIP
 */
app.post('/api/vip-sync', (req, res) => {
  const { date, matches } = req.body;
  
  // Si on a déjà généré la sélection pour aujourd'hui, on la renvoie
  if (vipDailyStorage[date]) {
    return res.json({ today: vipDailyStorage[date] });
  }

  if (matches && matches.length > 0) {
    // 1. Filtrer les ligues majeures pour la qualité VIP
    const majorLeagues = ['Champions League', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];
    let candidates = matches.filter(m => majorLeagues.some(l => m.league.includes(l)));
    
    // Si pas assez de matchs majeurs, on prend tout
    if (candidates.length < 3) candidates = matches;

    // 2. Mélanger et prendre 3 matchs
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    // 3. Ajouter une structure de prédiction par défaut pour l'affichage (Carte VIP)
    // Note: L'analyse réelle se fera quand l'utilisateur cliquera, mais ici on prépare l'affichage "Safe"
    const selectedWithPreds = selected.map(m => ({
       ...m,
       storedPrediction: {
          type: "1X2",
          selection: "Home", // Placeholder pour l'historique visuel
          label: `Analyse ${m.homeTeam}`
       }
    }));

    vipDailyStorage[date] = selectedWithPreds;
    saveData();
    return res.json({ today: vipDailyStorage[date] });
  }
  
  res.json({ today: [] });
});

app.get('/api/history', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const history = Object.entries(vipDailyStorage)
    .filter(([date]) => date < today) // Uniquement les jours passés
    .sort(([a], [b]) => b.localeCompare(a)) // Du plus récent au plus vieux
    .slice(0, 7); // 7 derniers jours
  
  res.json(Object.fromEntries(history));
});

app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`🚀 BETIQ PRO Server Active on ${port}`));
