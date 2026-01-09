
import { GoogleGenAI } from "@google/genai";
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
    RÔLE : Expert Analyste Sportif et Data Scientist Football.
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : Français.

    OBJECTIF : Fournir un signal de pari haute précision basé sur la tactique et les data.
    IMPORTANT : Tu DOIS obligatoirement générer des valeurs numériques réalistes pour :
    - Corners (format min-max)
    - Cartons Jaunes (format min-max)
    - Hors-jeu
    - Fautes
    - Tirs totaux
    - Tirs cadrés
    - Buteurs probables avec % de probabilité

    FORMAT JSON STRICT UNIQUEMENT :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Equipe Gagnante", "probability": 80, "confidence": "HIGH", "odds": 1.6},
        {"type": "OVER/UNDER 2.5", "recommendation": "Over 2.5", "probability": 75, "confidence": "HIGH", "odds": 1.8},
        {"type": "BTTS", "recommendation": "Oui", "probability": 65, "confidence": "MEDIUM", "odds": 1.9}
      ],
      "analysis": "Analyse tactique approfondie de 3-4 phrases sur la forme et les enjeux du match.",
      "vipInsight": {
        "exactScores": ["2-1", "1-0", "2-0"],
        "strategy": {"safe": "Signal Safe", "value": "Value Bet", "aggressive": "Signal Risqué"},
        "keyFact": "L'élément déterminant du match.",
        "detailedStats": {
          "corners": "8-10 (Probabilité 85%)",
          "yellowCards": "3-5 (Probabilité 70%)",
          "offsides": "2-4 (Probabilité 65%)",
          "fouls": "20-25 (Probabilité 80%)",
          "shots": "22-26 (Probabilité 88%)",
          "shotsOnTarget": "7-9 (Probabilité 75%)",
          "scorers": [{"name": "Nom du joueur", "probability": 72}]
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
        { type: "1X2", recommendation: "Signal Indisponible", probability: 50, confidence: Confidence.MEDIUM, odds: 0 }
      ],
      analysis: "L'IA n'a pas pu traiter la demande de signal.",
      vipInsight: { 
        exactScores: ["?-?"], 
        keyFact: "Erreur de connexion",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  }
}
