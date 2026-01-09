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
  
  const homeStanding = match.homeTeamStats ? `${match.homeTeam} est ${match.homeTeamStats.standing}e avec ${match.homeTeamStats.points} pts` : 'N/A';
  const awayStanding = match.awayTeamStats ? `${match.awayTeam} est ${match.awayTeamStats.standing}e avec ${match.awayTeamStats.points} pts` : 'N/A';
  const homeForm = match.homeTeamStats?.recentForm?.join(', ') || 'N/A';
  const awayForm = match.awayTeamStats?.recentForm?.join(', ') || 'N/A';

  const prompt = `
    RÔLE : Expert Analyste Data Football.
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language}.

    DONNÉES :
    - Classement : ${homeStanding} / ${awayStanding}
    - Forme : ${match.homeTeam} (${homeForm}) vs ${match.awayTeam} (${awayForm})

    TACHE : Génère une analyse fondamentale et des probabilités.
    RÈGLES STRICTES :
    1. Donne EXACTEMENT 2 suggestions de scores exacts.
    2. Format de réponse EXCLUSIVEMENT JSON.

    STRUCTURE JSON ATTENDUE :
    {
      "predictions": [{"type": "1X2", "recommendation": "1", "probability": 70, "confidence": "HIGH", "odds": 1.70}],
      "analysis": "Analyse tactique condensée...",
      "vipInsight": {
        "exactScores": ["2-0", "2-1"],
        "keyFact": "Détail clé...",
        "detailedStats": {
          "corners": "Over 8.5",
          "yellowCards": "3-4 total",
          "offsides": "2-3",
          "fouls": "20-25",
          "shots": "12-15",
          "shotsOnTarget": "5-6",
          "scorers": [{"name": "Nom Joueur", "probability": 40}]
        }
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
        },
        temperature: 0,
        seed: 42
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    if (data.vipInsight && data.vipInsight.exactScores) {
      data.vipInsight.exactScores = data.vipInsight.exactScores.slice(0, 2);
    }

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence as string).toUpperCase() as Confidence,
        type: p.type as BetType
      })),
      analysis: data.analysis || "Analyse indisponible.",
      vipInsight: {
        ...data.vipInsight,
        strategy: { safe: "Sécure", value: "Value", aggressive: "Risqué" }
      },
      sources: []
    };
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    return {
      predictions: [{ type: BetType.W1X2, recommendation: "1X", probability: 50, confidence: Confidence.MEDIUM, odds: 0 }],
      analysis: "Erreur lors de l'analyse IA. Les serveurs sont peut-être surchargés.",
      vipInsight: {
        exactScores: ["?-?"],
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" },
        keyFact: "Indisponible."
      },
      sources: []
    };
  }
}