import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

export async function generatePredictionsAndAnalysis(match: Partial<FootballMatch>, language: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const isMajorLeague = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League'].some(l => match.league?.includes(l));

  const prompt = `
    TON RÔLE : Analyste expert en Data Football.
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    
    INSTRUCTIONS :
    1. Analyse les news via Google Search (compositions, absents, forme).
    2. Marchés : 1X2, Over/Under 2.5, BTTS (Probabilités en %).
    3. ${isMajorLeague ? 'INCLURE STATISTIQUES DÉTAILLÉES : corners, cartons jaunes, hors-jeu, fautes, tirs, tirs cadrés (soit match total soit par équipe).' : ''}
    4. ${isMajorLeague ? 'INCLURE BUTEURS PROBABLES avec leur % de probabilité.' : ''}
    5. Propose 2 scores exacts VIP.
    
    RÉPONDS STRICTEMENT AU FORMAT JSON SUIVANT :
    {
      "predictions": [{"type": "1X2", "recommendation": "1", "probability": 75, "confidence": "HIGH", "odds": 1.65}],
      "analysis": "Verdict tactique détaillé en ${language}...",
      "vipInsight": {
        "exactScores": ["2-1", "3-1"],
        "keyFact": "Détail clé du match...",
        "detailedStats": {
          "corners": "Ex: Over 8.5",
          "yellowCards": "Ex: 4-5 total",
          "offsides": "Ex: Low frequency",
          "fouls": "Ex: High intensity",
          "shots": "Ex: 12-15 shots",
          "shotsOnTarget": "Ex: 5-6 target",
          "scorers": [{"name": "Nom Joueur", "probability": 45}]
        }
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 15000 },
        responseMimeType: "application/json",
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
                },
                required: ["type", "recommendation", "probability", "confidence", "odds"]
              }
            },
            analysis: { type: Type.STRING },
            vipInsight: {
              type: Type.OBJECT,
              properties: {
                exactScores: { type: Type.ARRAY, items: { type: Type.STRING } },
                keyFact: { type: Type.STRING },
                detailedStats: {
                  type: Type.OBJECT,
                  properties: {
                    corners: { type: Type.STRING },
                    yellowCards: { type: Type.STRING },
                    offsides: { type: Type.STRING },
                    fouls: { type: Type.STRING },
                    shots: { type: Type.STRING },
                    shotsOnTarget: { type: Type.STRING },
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
              required: ["exactScores", "keyFact"]
            }
          },
          required: ["predictions", "analysis", "vipInsight"]
        }
      }
    });

    const jsonStr = response.text.trim();
    const data = JSON.parse(jsonStr);
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Source IA",
        uri: chunk.web?.uri || ""
      })).filter((s: any) => s.uri) || [];
    
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence as string).toUpperCase() as Confidence,
        type: p.type as BetType
      })),
      analysis: data.analysis,
      vipInsight: {
        ...data.vipInsight,
        strategy: { safe: "Safe", value: "Value", aggressive: "High" }
      },
      sources
    };
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    throw error;
  }
}