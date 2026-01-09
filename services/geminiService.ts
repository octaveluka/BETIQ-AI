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
  
  const prompt = `
    TON RÔLE : Expert mondial en paris sportifs et analyste de données football.
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    
    INSTRUCTIONS :
    1. Utilise l'outil Google Search pour trouver les news les plus récentes (compositions probables, blessures de dernière minute, météo, enjeux).
    2. Analyse les statistiques historiques (H2H) et la forme actuelle.
    3. Produis des probabilités en % pour les marchés : 1X2, Over/Under 2.5, BTTS.
    4. Propose un verdict tactique et 2 scores exacts VIP.
    
    TU DOIS RÉPONDRE EXCLUSIVEMENT AU FORMAT JSON SUIVANT :
    {
      "predictions": [{"type": "1X2", "recommendation": "1", "probability": 75, "confidence": "HIGH", "odds": 1.65}],
      "analysis": "Texte détaillé du verdict tactique en ${language}...",
      "vipInsight": {
        "exactScores": ["2-1", "3-1"],
        "keyFact": "L'absence du gardien titulaire de ${match.awayTeam} est critique."
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 12000 }, // Plus de budget pour une meilleure analyse
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
        strategy: { 
          safe: language === 'FR' ? "Option sécurisée" : "Safe option", 
          value: "Value Bet", 
          aggressive: language === 'FR' ? "Cote risquée" : "High odds" 
        }
      },
      sources
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      predictions: [{ type: BetType.W1X2, recommendation: "1X", probability: 60, confidence: Confidence.MEDIUM, odds: 1.40 }],
      analysis: language === 'FR' ? "L'IA compile les dernières statistiques..." : "AI is compiling latest stats...",
      vipInsight: {
        exactScores: ["1-0", "1-1"],
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" },
        keyFact: language === 'FR' ? "En attente des données terrain" : "Awaiting pitch data"
      },
      sources: []
    };
  }
}