import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

const BIG_LEAGUES_IDS = ['152', '302', '207', '175', '168', '3', '28'];

export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isBigLeague = match.league_id && BIG_LEAGUES_IDS.includes(match.league_id);
  
  const prompt = `
    RÔLE : Expert Analyste Data Football (Style Professionnel).
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language}.

    TACHE : Génère une analyse fondamentale et des probabilités en JSON.
    RÈGLES : 
    1. Predictions : Toujours inclure 1X2, O/U 2.5, et BTTS.
    2. Statistiques détaillées (OBLIGATOIRE si match majeur) : Corners, Cartons jaunes, Hors-jeu, Fautes, Tirs totaux, Tirs cadrés.
    3. Buteurs : Liste les joueurs avec probabilité.
    4. Format : Répondre UNIQUEMENT avec le JSON, pas de texte autour.

    STRUCTURE JSON ATTENDUE :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Manchester City", "probability": 75, "confidence": "HIGH", "odds": 1.5},
        {"type": "O/U 2.5", "recommendation": "Over 2.5", "probability": 70, "confidence": "HIGH", "odds": 1.8},
        {"type": "BTTS", "recommendation": "Yes", "probability": 62, "confidence": "MEDIUM", "odds": 1.9}
      ],
      "analysis": "Analyse tactique fondamentale...",
      "vipInsight": {
        "exactScores": ["2-1", "3-1"],
        "strategy": {"safe": "Mise 1", "value": "Mise 2", "aggressive": "Mise 3"},
        "keyFact": "Détail clé du match",
        "detailedStats": {
          "corners": "Over 9.5 (Probabilité 78%)",
          "yellowCards": "Under 4.5 (Probabilité 65%)",
          "offsides": "Over 3.5 (Probabilité 60%)",
          "fouls": "22-25 total (Probabilité 72%)",
          "shots": "28+ au total (Probabilité 80%)",
          "shotsOnTarget": "10+ au total (Probabilité 75%)",
          "scorers": [{"name": "Erling Haaland", "probability": 68}]
        }
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const rawText = response.text || '{}';
    const data = JSON.parse(rawText.replace(/```json|```/g, "").trim());

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse tactique disponible pour les membres Elite.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "N/A",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    return {
      predictions: [
        { type: "1X2", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 },
        { type: "O/U 2.5", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 },
        { type: "BTTS", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 }
      ],
      analysis: "Erreur lors de la génération de l'analyse IA.",
      vipInsight: { 
        exactScores: ["?-?"], 
        keyFact: "Erreur serveur",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  }
}
