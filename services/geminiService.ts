
import { GoogleGenAI } from "@google/genai";
import { FootballMatch, Confidence, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

/**
 * Prompt optimisé : Court, précis et force le format JSON.
 */
const getStrictPrompt = (match: FootballMatch, language: string, today: string) => `
Tu es l'expert BETIQ. Analyse ce match de football : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
Date: ${match.time} (Aujourd'hui: ${today}).
Langue: ${language === 'EN' ? 'English' : 'Français'}.

Réponds UNIQUEMENT en JSON pur (pas de texte avant ou après) avec cette structure exacte :
{
  "predictions": [
    {"type": "1X2", "recommendation": "...", "probability": 70, "confidence": "HIGH", "odds": 1.8},
    {"type": "O/U 2.5", "recommendation": "...", "probability": 65, "confidence": "MEDIUM", "odds": 1.7},
    {"type": "BTTS", "recommendation": "...", "probability": 60, "confidence": "HIGH", "odds": 1.9}
  ],
  "analysis": "3 lignes d'analyse tactique basée sur la forme et les effectifs.",
  "vipInsight": {
    "exactScores": ["1-0", "2-1"],
    "strategy": {"safe": "...", "value": "...", "aggressive": "..."},
    "keyFact": "Le point clé du match.",
    "detailedStats": {
      "corners": "8-10", "yellowCards": "3-5", "offsides": "2-4", "fouls": "20-25", "shots": "12-15", "shotsOnTarget": "4-6",
      "scorers": [{"name": "...", "probability": 45}]
    }
  }
}`;

/**
 * Extrait proprement le JSON même si l'API renvoie du texte parasite (comme "Voici le résultat : { ... }")
 */
function extractJsonSafely(input: string) {
  try {
    const start = input.indexOf('{');
    const end = input.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("JSON non trouvé");
    const jsonStr = input.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Erreur fatale lors du parsing JSON de l'API :", e);
    throw e;
  }
}

/**
 * Tentative d'appel à votre API Delfaapiai (PRIORITÉ ABSOLUE)
 */
async function callYourCustomApi(match: FootballMatch, language: string): Promise<any> {
  const today = new Date().toISOString().split('T')[0];
  const prompt = getStrictPrompt(match, language, today);

  console.log("BETIQ: Appel API Custom en cours...");
  const response = await fetch("https://delfaapiai.vercel.app/ai/copilot", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: prompt,
      model: "default"
    })
  });

  if (!response.ok) throw new Error(`Status ${response.status}`);
  
  const text = await response.text();
  return extractJsonSafely(text);
}

/**
 * Secours via Gemini 3 Flash Preview
 */
async function callGeminiFallback(match: FootballMatch, language: string): Promise<{ data: any, sources: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0];
  const prompt = getStrictPrompt(match, language, today);

  console.log("BETIQ: Appel Gemini Fallback...");
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }]
    }
  });

  if (!response.text) throw new Error("Réponse vide");
  
  const data = JSON.parse(response.text);
  const sources: any[] = [];
  const grounding = response.candidates?.[0]?.groundingMetadata;
  if (grounding?.groundingChunks) {
    grounding.groundingChunks.forEach((c: any) => {
      if (c.web) sources.push({ title: c.web.title || "Vérification", uri: c.web.uri });
    });
  }
  return { data, sources };
}

export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  // 1. On essaie votre API
  try {
    const data = await callYourCustomApi(match, language);
    console.log("BETIQ: Succès API Custom");
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse BETIQ générée.",
      vipInsight: data.vipInsight || { exactScores: [], keyFact: "N/A", strategy: { safe: "", value: "", aggressive: "" } },
      sources: []
    };
  } catch (err) {
    console.warn("BETIQ: Votre API a échoué (CORS ou Format), passage à Gemini Fallback...", err);
    
    // 2. Si votre API échoue, on passe à Gemini
    try {
      const { data, sources } = await callGeminiFallback(match, language);
      return {
        predictions: (data.predictions || []).map((p: any) => ({
          ...p,
          confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
        })),
        analysis: data.analysis || "Analyse de secours via intelligence artificielle.",
        vipInsight: data.vipInsight || { exactScores: [], keyFact: "Vérification effectuée.", strategy: { safe: "", value: "", aggressive: "" } },
        sources: sources
      };
    } catch (fallbackErr) {
      console.error("BETIQ: Échec total des services d'IA.", fallbackErr);
      return {
        predictions: [{ type: "1X2", recommendation: "Indisponible (Erreur)", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }],
        analysis: "Erreur technique : Impossible de contacter les serveurs d'analyse IA. Veuillez vérifier votre connexion ou réessayer.",
        vipInsight: { exactScores: [], keyFact: "Erreur technique", strategy: { safe: "", value: "", aggressive: "" } },
        sources: []
      };
    }
  }
}
