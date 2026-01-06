
import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generatePredictionsAndAnalysis(match: Partial<FootballMatch>, language: string): Promise<{ predictions: Prediction[], analysis: string, vipInsight: VipInsight }> {
  const prompt = `
    Analyze this football match for professional betting.
    Match: ${match.homeTeam} vs ${match.awayTeam} (${match.league})
    
    1. Generate 2-3 standard predictions (1X2, O/U 2.5, BTTS).
    2. VIP Features:
       - 2 most likely "Exact Scores" (e.g. "2-1", "1-0").
       - Strategy: "Safe" (low risk), "Value" (best odds/prob ratio), "Aggressive" (high risk).
       - One key tactical fact.
    
    Return the result in JSON format with the following structure:
    {
      "predictions": [
        { "type": "1X2", "recommendation": "1", "probability": 75, "confidence": "HIGH", "odds": 1.50 }
      ],
      "analysis": "2-sentence data reasoning in ${language === 'FR' ? 'French' : 'English'}.",
      "vipInsight": {
        "exactScores": ["2-1", "1-0"],
        "strategy": {
          "safe": "Prediction string in ${language === 'FR' ? 'French' : 'English'}",
          "value": "Prediction string in ${language === 'FR' ? 'French' : 'English'}",
          "aggressive": "Prediction string in ${language === 'FR' ? 'French' : 'English'}"
        },
        "keyFact": "Tactical fact in ${language === 'FR' ? 'French' : 'English'}"
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
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
                strategy: {
                  type: Type.OBJECT,
                  properties: {
                    safe: { type: Type.STRING },
                    value: { type: Type.STRING },
                    aggressive: { type: Type.STRING }
                  }
                },
                keyFact: { type: Type.STRING }
              }
            }
          },
          required: ["predictions", "analysis", "vipInsight"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      predictions: data.predictions.map((p: any) => ({
        ...p,
        confidence: p.confidence as Confidence,
        type: p.type as BetType
      })),
      analysis: data.analysis,
      vipInsight: data.vipInsight
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      predictions: [{ type: BetType.W1X2, recommendation: "TBD", probability: 50, confidence: Confidence.MEDIUM, odds: 2.0 }],
      analysis: language === 'FR' ? "Erreur d'analyse." : "Analysis error.",
      vipInsight: {
        exactScores: ["1-1", "0-0"],
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" },
        keyFact: "N/A"
      }
    };
  }
}
