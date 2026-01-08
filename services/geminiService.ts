import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "../types";

export async function generatePredictionsAndAnalysis(match: Partial<FootballMatch>, language: string): Promise<{ predictions: Prediction[], analysis: string, vipInsight: VipInsight }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyse le match de football : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    Recherche les actus récentes (compos, blessés, forme).
    
    TU DOIS FOURNIR :
    1. Prédiction 1X2 (Victoire 1, Nul ou Victoire 2).
    2. Prédiction Over/Under 2.5 buts (Plus ou Moins de 2.5).
    3. Prédiction BTTS (Les deux équipes marquent : OUI ou NON).
    4. VIP : 2 scores exacts probables.
    5. Stratégies de pari : une sûre, une value, une agressive.
    6. Un paragraphe d'analyse tactique en ${language === 'FR' ? 'Français' : 'Anglais'}.

    FORMAT : JSON uniquement.
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
                  type: { type: Type.STRING, description: "1X2, O/U 2.5, or BTTS" },
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
                keyFact: { type: Type.STRING }
              },
              required: ["exactScores", "strategy", "keyFact"]
            }
          },
          required: ["predictions", "analysis", "vipInsight"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence as Confidence) || Confidence.MEDIUM,
        type: p.type as BetType
      })),
      analysis: data.analysis || "Analyse indisponible.",
      vipInsight: data.vipInsight
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    // Added missing 'strategy' property to satisfy VipInsight interface requirement
    return {
      predictions: [
        { type: BetType.W1X2, recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 },
        { type: BetType.OVER_UNDER, recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 },
        { type: BetType.BTTS, recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 }
      ],
      analysis: "Erreur de connexion aux données.",
      vipInsight: {
        exactScores: ["1-1", "2-1"],
        strategy: {
          safe: "N/A",
          value: "N/A",
          aggressive: "N/A"
        },
        keyFact: "Indisponible"
      }
    };
  }
}