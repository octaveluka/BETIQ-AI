
import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

/**
 * Appelle l'API personnalisée Delfaapiai
 */
async function callCustomApi(prompt: string): Promise<any> {
  const url = `https://delfaapiai.vercel.app/ai/copilot?message=${encodeURIComponent(prompt)}&model=default`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Custom API Error");
  
  const text = await response.text();
  // L'API peut renvoyer du texte brut contenant du JSON ou juste le JSON.
  // On tente d'extraire le JSON si besoin.
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    throw new Error("Invalid JSON from Custom API");
  }
}

/**
 * Appelle Gemini 3 Flash Preview avec Google Search comme fallback
 */
async function callGeminiFallback(prompt: string): Promise<{ data: any, sources: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 8000 },
    }
  });

  const text = response.text;
  if (!text) throw new Error("Gemini Fallback Empty");
  
  const data = JSON.parse(text);
  const sources: any[] = [];
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  if (groundingMetadata?.groundingChunks) {
    groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web) sources.push({ title: chunk.web.title || "Vérification Web", uri: chunk.web.uri });
    });
  }
  return { data, sources };
}

export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `
    SYSTÈME EXPERT BETIQ - PRONOSTICS FOOTBALL.
    MATCH : ${match.homeTeam} vs ${match.awayTeam}.
    LIGUE : ${match.league}.
    DATE : ${match.time} (Aujourd'hui: ${today}).
    LANGUE : ${language === 'EN' ? 'English' : 'Français'}.

    MISSION : Produire une analyse tactique et des prédictions (1X2, O/U 2.5, BTTS) basées sur l'état réel des effectifs (entraîneurs, blessés, transferts).

    FORMAT JSON STRICT :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "...", "probability": 70, "confidence": "HIGH", "odds": 1.7},
        {"type": "OVER/UNDER 2.5", "recommendation": "...", "probability": 65, "confidence": "MEDIUM", "odds": 1.8},
        {"type": "BTTS", "recommendation": "...", "probability": 60, "confidence": "HIGH", "odds": 1.9}
      ],
      "analysis": "...",
      "vipInsight": {
        "exactScores": ["1-0", "2-1"],
        "strategy": {"safe": "...", "value": "...", "aggressive": "..."},
        "keyFact": "...",
        "detailedStats": {
          "corners": "...", "yellowCards": "...", "offsides": "...", "fouls": "...", "shots": "...", "shotsOnTarget": "...",
          "scorers": [{"name": "...", "probability": 40}]
        }
      }
    }
  `;

  try {
    // 1. Priorité à l'API Custom
    console.log("Calling Custom API...");
    const data = await callCustomApi(prompt);
    
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse fournie par l'API principale.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "N/A",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: [] // L'API custom est supposée déjà vérifiée
    };
  } catch (error) {
    console.error("Custom API failed, falling back to Gemini 3 Flash Preview:", error);
    
    // 2. Fallback vers Gemini 3 Flash Preview avec Google Search
    try {
      const { data, sources } = await callGeminiFallback(prompt);
      return {
        predictions: (data.predictions || []).map((p: any) => ({
          ...p,
          confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
        })),
        analysis: data.analysis || "Analyse de secours via Gemini.",
        vipInsight: data.vipInsight || { 
          exactScores: ["?-?"], 
          keyFact: "N/A",
          strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
        },
        sources: sources
      };
    } catch (fallbackError) {
      console.error("Both APIs failed:", fallbackError);
      return {
        predictions: [{ type: "1X2", recommendation: "Service indisponible", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }],
        analysis: "Erreur de connexion aux serveurs d'analyse. Réessayez plus tard.",
        vipInsight: { exactScores: [], keyFact: "N/A", strategy: { safe: "", value: "", aggressive: "" } },
        sources: []
      };
    }
  }
}
