
import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

/**
 * Prompt standard partagé entre l'API Custom et Gemini
 */
const getDetailedPrompt = (match: FootballMatch, language: string, today: string) => `
    TU ES UN ANALYSTE TACTIQUE ET EXPERT EN PRONOSTICS FOOTBALL.
    ANALYSE CE MATCH : ${match.homeTeam} VS ${match.awayTeam} (${match.league}).
    DATE DU MATCH : ${match.time} (Nous sommes le ${today}).
    LANGUE : ${language === 'EN' ? 'English' : 'Français'}.

    INSTRUCTIONS CRITIQUES :
    1. VÉRIFIE LES ENTRAÎNEURS ACTUELS (Ex: Ne cite pas Xavi au Barça ou Klopp à Liverpool).
    2. VÉRIFIE LES ABSENTS RÉELS (Blessures, suspensions, sélections nationales comme la CAN ou Asian Cup).
    3. ANALYSE TACTIQUE : Explique comment les forces en présence impactent le jeu.
    4. INTERDICTION D'HALLUCINER : Si une information n'est pas vérifiable, reste prudent.

    TU DOIS RÉPONDRE UNIQUEMENT PAR UN OBJET JSON VALIDE AU FORMAT SUIVANT :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Gagnant ou Nul", "probability": 70, "confidence": "HIGH", "odds": 1.7},
        {"type": "OVER/UNDER 2.5", "recommendation": "+2.5 buts", "probability": 65, "confidence": "MEDIUM", "odds": 1.8},
        {"type": "BTTS", "recommendation": "Oui", "probability": 60, "confidence": "HIGH", "odds": 1.9}
      ],
      "analysis": "Basé sur les faits : [Analyse de 4 lignes maximum].",
      "vipInsight": {
        "exactScores": ["1-0", "2-1"],
        "strategy": {"safe": "DNB", "value": "BTTS", "aggressive": "Score Exact 2-1"},
        "keyFact": "Le fait vérifié déterminant du match.",
        "detailedStats": {
          "corners": "8-10", "yellowCards": "3-5", "offsides": "2-4", "fouls": "22-26", "shots": "12-15", "shotsOnTarget": "4-6",
          "scorers": [{"name": "[NOM DU JOUEUR]", "probability": 45}]
        }
      }
    }
`;

/**
 * Tente d'extraire et parser le JSON d'une chaîne de texte
 */
function extractAndParseJson(text: string) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Aucun bloc JSON trouvé");
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error("Erreur de parsing JSON dans la réponse");
  }
}

/**
 * Appelle l'API personnalisée Delfaapiai via POST
 */
async function callCustomApi(match: FootballMatch, language: string): Promise<any> {
  const today = new Date().toISOString().split('T')[0];
  const prompt = getDetailedPrompt(match, language, today);
  
  const response = await fetch("https://delfaapiai.vercel.app/ai/copilot", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: prompt,
      model: "default"
    })
  });

  if (!response.ok) throw new Error(`Custom API failed: ${response.status}`);
  
  const text = await response.text();
  return extractAndParseJson(text);
}

/**
 * Fallback vers Gemini 3 Flash Preview avec Google Search
 */
async function callGeminiFallback(match: FootballMatch, language: string): Promise<{ data: any, sources: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0];
  const prompt = getDetailedPrompt(match, language, today);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 8000 }
    }
  });

  if (!response.text) throw new Error("Réponse Gemini vide");
  
  const data = JSON.parse(response.text);
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
  try {
    // 1. TENTATIVE PRIORITAIRE : API CUSTOM (POST)
    console.log("Tentative d'analyse via API Custom...");
    const data = await callCustomApi(match, language);
    
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse technique effectuée.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "N/A",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: [] 
    };
  } catch (error) {
    console.warn("Échec de l'API Custom, passage à Gemini 3 Flash Preview :", error);
    
    // 2. TENTATIVE DE SECOURS : GEMINI 3 FLASH PREVIEW
    try {
      const { data, sources } = await callGeminiFallback(match, language);
      return {
        predictions: (data.predictions || []).map((p: any) => ({
          ...p,
          confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
        })),
        analysis: data.analysis || "Analyse IA de secours.",
        vipInsight: data.vipInsight || { 
          exactScores: ["?-?"], 
          keyFact: "Vérification par recherche effectuée.",
          strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
        },
        sources: sources
      };
    } catch (fallbackError) {
      console.error("Échec critique : aucune IA ne répond.", fallbackError);
      return {
        predictions: [{ type: "1X2", recommendation: "Service Indisponible", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }],
        analysis: "Nous ne parvenons pas à analyser ce match pour le moment. Réessayez dans quelques minutes.",
        vipInsight: { exactScores: [], keyFact: "Erreur technique", strategy: { safe: "", value: "", aggressive: "" } },
        sources: []
      };
    }
  }
}
