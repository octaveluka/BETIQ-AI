
import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "./types";

export async function generatePredictionsAndAnalysis(match: Partial<FootballMatch>, language: string): Promise<{ predictions: Prediction[], analysis: string, vipInsight: VipInsight }> {
  // Utilisation systématique d'une nouvelle instance pour éviter les fuites de contexte
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    
    ANALYSE CE MATCH DE FOOTBALL :
    1. PRÉDICTIONS : 1X2, Over/Under 2.5, Les deux équipes marquent (BTTS).
    2. VIP : Fournis 2 scores exacts précis et réalistes.
    3. TACTIQUE : Un paragraphe d'analyse tactique en ${language === 'FR' ? 'Français' : 'Anglais'}.
    
    FORMAT : Réponds uniquement en JSON.
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
                keyFact: { type: Type.STRING }
              },
              required: ["exactScores", "keyFact"]
            }
          },
          required: ["predictions", "analysis", "vipInsight"]
        }
      }
    });

    const data = JSON.parse(response.text);
    
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence as string).toUpperCase() as Confidence,
        type: p.type as BetType
      })),
      analysis: data.analysis || "Analyse tactique non disponible.",
      vipInsight: {
        ...data.vipInsight,
        strategy: { safe: "Miser avec prudence", value: "Belle opportunité", aggressive: "Cote élevée" }
      }
    };
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    // Fallback data si l'API échoue
    return {
      predictions: [
        { type: BetType.W1X2, recommendation: "À définir", probability: 50, confidence: Confidence.MEDIUM, odds: 1.80 }
      ],
      analysis: "Les serveurs d'analyse sont surchargés. Veuillez patienter.",
      vipInsight: {
        exactScores: ["1-1", "0-0"],
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" },
        keyFact: "Analyse en attente"
      }
    };
  }
}
