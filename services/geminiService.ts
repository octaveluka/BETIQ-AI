
import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const isCanMatch = match.league.toLowerCase().includes('can') || 
                    match.league.toLowerCase().includes('nations cup') ||
                    match.league.toLowerCase().includes('afrique') ||
                    match.country_name?.toLowerCase().includes('africa');

  const prompt = `
    RÔLE : Expert Analyste Sportif et Data Scientist Football.
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language === 'EN' ? 'English' : 'Français'}.
    ${isCanMatch ? "C'est un match de la Coupe d'Afrique des Nations (CAN). Utilise Google Search pour obtenir les dernières informations sur les effectifs, les blessures et la forme actuelle." : ""}

    OBJECTIF : Fournir un signal de pari haute précision (1X2, O/U 2.5, BTTS) et des statistiques détaillées.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: isCanMatch ? [{ googleSearch: {} }] : undefined,
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
                  },
                  required: ["safe", "value", "aggressive"]
                },
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
                        },
                        required: ["name", "probability"]
                      }
                    }
                  }
                }
              },
              required: ["exactScores", "strategy", "keyFact"]
            }
          },
          required: ["predictions", "analysis", "vipInsight"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Extraction des sources Google Search
    const sources: { title: string; uri: string }[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || "Source Google Search",
            uri: chunk.web.uri
          });
        }
      });
    }

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse indisponible.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "N/A",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: sources
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      predictions: [
        { type: "1X2", recommendation: "Indisponible", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }
      ],
      analysis: "Erreur de génération IA. Vérifiez votre connexion ou réessayez.",
      vipInsight: { 
        exactScores: ["?-?"], 
        keyFact: "Erreur technique",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  }
}
