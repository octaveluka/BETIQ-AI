
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
    RÔLE : Analyste Expert Pronostics.
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language}.

    TACHE : Génère une analyse de probabilité en JSON.
    RÈGLES : 
    - predictions : Liste 1X2, O/U 2.5, et BTTS.
    - vipInsight : 2 scores exacts max, et une stratégie de mise (safe, value, aggressive).
    
    JSON attendu :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Victoire...", "probability": 75, "confidence": "HIGH", "odds": 1.5},
        {"type": "O/U 2.5", "recommendation": "Over 2.5", "probability": 70, "confidence": "HIGH", "odds": 1.8},
        {"type": "BTTS", "recommendation": "Yes", "probability": 62, "confidence": "MEDIUM", "odds": 1.9}
      ],
      "analysis": "Texte court d'analyse...",
      "vipInsight": {
        "exactScores": ["3-1", "2-1"],
        "strategy": {
          "safe": "Mise modérée sur...",
          "value": "Cote intéressante sur...",
          "aggressive": "Option risquée..."
        },
        "keyFact": "Facteur clé",
        "detailedStats": {
          "corners": "8-10",
          "yellowCards": "3-4",
          "shotsOnTarget": "5-6",
          "fouls": "20+",
          "scorers": [{"name": "Buteur", "probability": 45}]
        }
      }
    }
  `;

  try {
    // Calling Gemini with both model and prompt in a single call as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Using responseSchema for better structure validation
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                  probability: { type: Type.NUMBER },
                  confidence: { type: Type.STRING },
                  odds: { type: Type.NUMBER }
                }
              }
            },
            analysis: { type: Type.STRING },
            vipInsight: {
              type: Type.OBJECT,
              properties: {
                exactScores: { type: Type.ARRAY, items: { type: Type.STRING } },
                strategy: {
                  type: Type.OBJECT,
                  properties: {
                    safe: { type: Type.STRING },
                    value: { type: Type.STRING },
                    aggressive: { type: Type.STRING }
                  },
                  required: ["safe", "value", "aggressive"]
                },
                keyFact: { type: Type.STRING },
                detailedStats: {
                  type: Type.OBJECT,
                  properties: {
                    corners: { type: Type.STRING },
                    yellowCards: { type: Type.STRING },
                    shotsOnTarget: { type: Type.STRING },
                    fouls: { type: Type.STRING },
                    scorers: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          probability: { type: Type.NUMBER }
                        }
                      }
                    }
                  }
                }
              },
              required: ["exactScores", "strategy", "keyFact"]
            }
          },
          required: ["predictions", "analysis", "vipInsight"]
        },
        temperature: 0.2
      }
    });

    const data = JSON.parse(response.text || '{}');

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse tactique en cours de finalisation...",
      // Added missing strategy property to satisfy VipInsight type definition
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "N/A",
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
      analysis: "L'IA est temporairement indisponible pour ce match.",
      // Added missing strategy property to satisfy VipInsight type definition in error fallback
      vipInsight: { 
        exactScores: ["?-?"], 
        keyFact: "Erreur de connexion",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  }
}
