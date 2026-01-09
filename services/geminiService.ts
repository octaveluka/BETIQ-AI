import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    RÔLE : Expert Analyste de Données Football (Style Signal IA).
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language === 'FR' ? 'Français' : 'English'}.

    TACHE : Génère une analyse fondamentale et des probabilités précises.
    IMPORTANT : Tu DOIS inclure ces statistiques détaillées avec leurs pourcentages :
    - Corners
    - Cartons Jaunes
    - Hors-jeu
    - Fautes
    - Tirs totaux
    - Tirs cadrés
    - Buteurs probables

    FORMAT : Répondre UNIQUEMENT avec un JSON valide. Pas de texte explicatif autour.

    {
      "predictions": [
        {"type": "1X2", "recommendation": "Nom de l'équipe ou Nul", "probability": 75, "confidence": "HIGH", "odds": 1.5},
        {"type": "O/U 2.5", "recommendation": "Over 2.5", "probability": 70, "confidence": "HIGH", "odds": 1.8},
        {"type": "BTTS", "recommendation": "Yes", "probability": 62, "confidence": "MEDIUM", "odds": 1.9}
      ],
      "analysis": "Ton analyse fondamentale détaillée ici (tactique, forme, enjeux)...",
      "vipInsight": {
        "exactScores": ["2-1", "1-0"],
        "strategy": {"safe": "Mise sûre", "value": "Value bet", "aggressive": "Prise de risque"},
        "keyFact": "Le fait majeur du match",
        "detailedStats": {
          "corners": "9-11 (Probabilité 78%)",
          "yellowCards": "3-5 (Probabilité 65%)",
          "offsides": "2-4 (Probabilité 60%)",
          "fouls": "22-25 (Probabilité 72%)",
          "shots": "24-28 (Probabilité 80%)",
          "shotsOnTarget": "8-10 (Probabilité 75%)",
          "scorers": [{"name": "Joueur clé", "probability": 68}]
        }
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const data = JSON.parse(response.text || '{}');

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse fondamentale temporairement indisponible.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "En attente",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      predictions: [
        { type: "1X2", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 },
        { type: "O/U 2.5", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 },
        { type: "BTTS", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 }
      ],
      analysis: "L'IA n'a pas pu traiter la demande. Vérifiez votre connexion.",
      vipInsight: { 
        exactScores: ["?-?"], 
        keyFact: "Erreur",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  }
}