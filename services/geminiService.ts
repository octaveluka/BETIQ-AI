
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
  
  // Strict prompt to prevent hallucinations and ensure real-time data usage via Google Search
  const prompt = `
    RÔLE : Expert Analyste Sportif et Data Scientist Football de classe mondiale.
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language === 'EN' ? 'English' : 'Français'}.

    MISSION CRITIQUE : 
    1. Utilise l'outil Google Search pour vérifier les compositions d'équipe RÉELLES à cette date précise.
    2. NE PAS HALLUCINER : Vérifie qui est l'entraîneur actuel et quels joueurs sont réellement dans le club AUJOURD'HUI. 
    3. Ne mentionne aucun joueur transféré ou ancien entraîneur.
    4. Analyse les blessures récentes, les suspensions et la forme tactique des 3 derniers matchs.

    PRÉDICTIONS REQUISES :
    - 1X2, Over/Under 2.5, BTTS (Les deux équipes marquent).
    - Statistiques : Corners, Cartons, Tirs, Fautes.
    - Buteurs : Identifie les buteurs probables basés sur les derniers lineups.

    RÉPONDS UNIQUEMENT AU FORMAT JSON SUIVANT :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Equipe Gagnante", "probability": 70, "confidence": "HIGH", "odds": 1.7},
        {"type": "OVER/UNDER 2.5", "recommendation": "Plus de 2.5", "probability": 65, "confidence": "MEDIUM", "odds": 1.85},
        {"type": "BTTS", "recommendation": "Oui", "probability": 55, "confidence": "LOW", "odds": 2.1}
      ],
      "analysis": "Analyse tactique basée sur les faits réels vérifiés (lineups, tactique).",
      "vipInsight": {
        "exactScores": ["1-0", "2-1"],
        "strategy": {"safe": "Signal 1X", "value": "Over 1.5", "aggressive": "Buteur spécifique"},
        "keyFact": "Le fait marquant vérifié par Google Search.",
        "detailedStats": {
          "corners": "8-10",
          "yellowCards": "3-4",
          "offsides": "2-3",
          "fouls": "20-24",
          "shots": "12-15",
          "shotsOnTarget": "4-6",
          "scorers": [{"name": "Nom Joueur Réel", "probability": 60}]
        }
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // High accuracy model
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Enable Google Search for ALL matches to avoid hallucinations
        tools: [{ googleSearch: {} }],
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
                  }
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
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Extract real web sources from grounding metadata
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((c: any) => {
        if (c.web) sources.push({ title: c.web.title, uri: c.web.uri });
      });
    }

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analysis unavailable.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "N/A",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: sources
    };
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return {
      predictions: [{ type: "1X2", recommendation: "Signal Error", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }],
      analysis: "Impossible de générer l'analyse pour le moment.",
      vipInsight: { exactScores: [], keyFact: "Error", strategy: { safe: "", value: "", aggressive: "" } },
      sources: []
    };
  }
}
