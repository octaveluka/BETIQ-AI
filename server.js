
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const port = process.env.PORT || 10000;
const distPath = path.join(__dirname, 'dist');

/**
 * Prompt standard utilisé pour les moteurs d'IA
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

    TU DOIS RÉPONDRE UNIQUEMENT PAR UN OBJET JSON VALIDE AU FORMAT SUIVANT :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Ex: Victoire ${match.homeTeam}", "probability": 75, "confidence": "HIGH", "odds": 1.45},
        {"type": "OVER/UNDER 2.5", "recommendation": "+2.5 buts", "probability": 65, "confidence": "MEDIUM", "odds": 1.8},
        {"type": "BTTS", "recommendation": "Oui", "probability": 60, "confidence": "HIGH", "odds": 1.9},
        {"type": "CORNERS", "recommendation": "+8.5 corners", "probability": 70, "confidence": "MEDIUM", "odds": 1.6},
        {"type": "CARTONS", "recommendation": "+3.5 cartons", "probability": 65, "confidence": "HIGH", "odds": 1.75},
        {"type": "TIRS CADRÉS", "recommendation": "+9.5 tirs cadrés", "probability": 60, "confidence": "MEDIUM", "odds": 1.85},
        {"type": "HORS-JEU", "recommendation": "+3.5 hors-jeu", "probability": 55, "confidence": "LOW", "odds": 2.1},
        {"type": "FAUTES", "recommendation": "+22.5 fautes", "probability": 70, "confidence": "HIGH", "odds": 1.65},
        {"type": "TOUCHES", "recommendation": "+35.5 touches", "probability": 65, "confidence": "MEDIUM", "odds": 1.7}
      ],
      "analysis": "Analyse tactique neutre et détaillée de 3-4 lignes.",
      "vipInsight": {
        "exactScores": ["1-0", "2-1"],
        "strategy": {"safe": "Libellé", "value": "Libellé", "aggressive": "Libellé"},
        "keyFact": "Le fait majeur du match.",
        "detailedStats": {
          "corners": "8-10", "yellowCards": "3-5", "offsides": "2-4", "fouls": "20-25", "shots": "12-15", "shotsOnTarget": "4-6", "throwIns": "38-42",
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

app.post('/api/analyze', async (req, res) => {
  const { match, language } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const prompt = getDetailedPrompt(match, language, today);

  // 1. TENTATIVE : API COPILOT
  try {
    const response = await fetch("https://delfaapiai.vercel.app/ai/copilot", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, model: "default" })
    });
    if (response.ok) {
      const data = await response.json();
      const jsonData = extractJson(data?.answer || "");
      if (jsonData) return res.json({ ...jsonData, sources: [] });
    }
  } catch (e) { console.warn("[API] Copilot a échoué"); }

  // 2. TENTATIVE : API VENICE (Nouveau Fallback)
  try {
    const response = await fetch("https://delfaapiai.vercel.app/ai/venice", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: prompt, systemPrompt: "You are a football prediction expert. Return ONLY JSON." })
    });
    if (response.ok) {
      const data = await response.json();
      const jsonData = extractJson(data?.answer || JSON.stringify(data));
      if (jsonData) return res.json({ ...jsonData, sources: [] });
    }
  } catch (e) { console.warn("[API] Venice a échoué"); }

  // 3. TENTATIVE : GEMINI
  try {
    if (!process.env.API_KEY) throw new Error("Missing Gemini Key");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json", tools: [{ googleSearch: {} }], thinkingConfig: { thinkingBudget: 4000 } }
    });
    const data = JSON.parse(result.text || '{}');
    const sources = (result.candidates?.[0]?.groundingMetadata?.groundingChunks || []).filter(c => c.web).map(c => ({ title: c.web.title, uri: c.web.uri }));
    return res.json({ ...data, sources });
  } catch (e) {
    console.error("[API] Échec total");
    return res.status(500).json({ error: "Analyse indisponible." });
  }
});

app.use(express.static(distPath));
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`✅ BETIQ sur port ${port}`));
