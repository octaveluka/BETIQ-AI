import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "../types";

export async function generatePredictionsAndAnalysis(match: Partial<FootballMatch>, language: string): Promise<{ predictions: Prediction[], analysis: string, vipInsight: VipInsight }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const seed = parseInt(match.id?.toString().replace(/\D/g, '').slice(-8) || '0', 10);

  const prompt = `
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    
    TÂCHE : Fournis une analyse footballistique pointue et des prédictions basées sur les données actuelles.
    
    INSTRUCTIONS :
    1. PRÉDICTIONS : 1X2, Over/Under 2.5, BTTS.
    2. VIP : 2 scores exacts les plus probables.
    3. STATS TECHNIQUES : Corners, Cartons, Tirs, Buteurs.
    4. ANALYSE : Un paragraphe tactique en ${language === 'FR' ? 'Français' : 'Anglais'}.

    FORMAT : Retourne UNIQUEMENT un objet JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
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
                    shots: { type: Type.STRING },
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
        },
        seed: seed
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: p.confidence as Confidence,
        type: p.type as BetType
      })),
      analysis: data.analysis || "Analyse tactique en cours de génération...",
      vipInsight: {
        ...data.vipInsight,
        strategy: data.vipInsight.strategy || { safe: "N/A", value: "N/A", aggressive: "N/A" }
      }
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      predictions: [{ type: BetType.W1X2, recommendation: "Analyse en attente", probability: 50, confidence: Confidence.MEDIUM, odds: 1.80 }],
      analysis: "Impossible de joindre l'algorithme pour le moment. Réessayez dans quelques instants.",
      vipInsight: {
        exactScores: ["1-1", "2-1"],
        strategy: { safe: "Moins de 3.5 buts", value: "Victoire domicile", aggressive: "Score exact 2-1" },
        keyFact: "Données indisponibles",
        detailedStats: {
          corners: "8-10", yellowCards: "2-4", offsides: "2", fouls: "20",
          shots: "12", shotsOnTarget: "5", scorers: []
        }
      }
    };
  }
}