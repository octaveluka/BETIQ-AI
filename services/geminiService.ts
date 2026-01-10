
import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

/**
 * Prompt d'expertise partagé pour une cohérence totale entre les modèles.
 */
const getSystemPrompt = (match: FootballMatch, language: string, today: string) => `
    TU ES L'IA DE PRONOSTICS BETIQ. ANALYSE EXPERTE REQUISE.
    MATCH : ${match.homeTeam} VS ${match.awayTeam}
    LIGUE : ${match.league}
    DATE : ${match.time} (Aujourd'hui : ${today})
    LANGUE : ${language === 'EN' ? 'English' : 'Français'}

    CONSIGNES :
    - Analyse tactique basée sur les 5 derniers matchs et les confrontations directes.
    - Vérifie impérativement les absences (blessés, suspendus, sélections nationales).
    - Fournis des prédictions (1X2, O/U 2.5, BTTS) avec probabilités et cotes estimées.
    - Ajoute des insights VIP : scores exacts probables et buteurs.

    RÉPONDS EXCLUSIVEMENT AU FORMAT JSON SUIVANT :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Gagnant 1", "probability": 70, "confidence": "HIGH", "odds": 1.75},
        {"type": "OVER/UNDER 2.5", "recommendation": "+2.5 buts", "probability": 65, "confidence": "MEDIUM", "odds": 1.80},
        {"type": "BTTS", "recommendation": "Oui", "probability": 60, "confidence": "HIGH", "odds": 1.90}
      ],
      "analysis": "Analyse tactique détaillée de 4 lignes maximum.",
      "vipInsight": {
        "exactScores": ["2-1", "1-0"],
        "strategy": {"safe": "Libellé", "value": "Libellé", "aggressive": "Libellé"},
        "keyFact": "Le fait déterminant du match.",
        "detailedStats": {
          "corners": "8-10", "yellowCards": "3-5", "offsides": "2-4", "fouls": "20-25", "shots": "12-15", "shotsOnTarget": "4-6",
          "scorers": [{"name": "Nom Joueur", "probability": 45}]
        }
      }
    }
`;

/**
 * Extrait le JSON de n'importe quel texte brut renvoyé par l'API.
 */
function robustParse(text: string) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Format JSON introuvable");
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Erreur de parsing critique:", e, "Texte reçu:", text);
    throw e;
  }
}

/**
 * Appel prioritaire à l'API personnalisée Delfaapiai
 */
async function callCustomApi(match: FootballMatch, language: string): Promise<any> {
  const today = new Date().toISOString().split('T')[0];
  const prompt = getSystemPrompt(match, language, today);

  const response = await fetch("https://delfaapiai.vercel.app/ai/copilot", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: prompt,
      model: "default"
    })
  });

  if (!response.ok) throw new Error(`API Custom indisponible: ${response.status}`);
  const text = await response.text();
  return robustParse(text);
}

/**
 * Appel de secours à Gemini 3 Flash Preview avec recherche Web
 */
async function callGeminiFallback(match: FootballMatch, language: string): Promise<{ data: any, sources: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0];
  const prompt = getSystemPrompt(match, language, today);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Gemini a renvoyé une réponse vide");
  
  const data = JSON.parse(text);
  const sources: any[] = [];
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  
  if (groundingMetadata?.groundingChunks) {
    groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web) sources.push({ title: chunk.web.title || "Source", uri: chunk.web.uri });
    });
  }
  return { data, sources };
}

export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  try {
    // 1. PRIORITÉ : API PERSONNALISÉE
    const data = await callCustomApi(match, language);
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse technique effectuée par BETIQ AI.",
      vipInsight: data.vipInsight || { 
        exactScores: [], 
        keyFact: "N/A",
        strategy: { safe: "", value: "", aggressive: "" }
      },
      sources: []
    };
  } catch (error) {
    console.warn("Échec de l'API personnalisée, tentative avec Gemini...", error);
    
    // 2. SECOURS : GEMINI
    try {
      const { data, sources } = await callGeminiFallback(match, language);
      return {
        predictions: (data.predictions || []).map((p: any) => ({
          ...p,
          confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
        })),
        analysis: data.analysis || "Analyse de secours via intelligence artificielle.",
        vipInsight: data.vipInsight || { 
          exactScores: [], 
          keyFact: "Vérifié par recherche web.",
          strategy: { safe: "", value: "", aggressive: "" }
        },
        sources: sources
      };
    } catch (fallbackError) {
      console.error("Échec critique des deux sources d'IA.", fallbackError);
      return {
        predictions: [{ type: "1X2", recommendation: "Service indisponible", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }],
        analysis: "Désolé, nos moteurs d'analyse sont actuellement surchargés. Réessayez dans un instant.",
        vipInsight: { exactScores: [], keyFact: "Erreur technique", strategy: { safe: "", value: "", aggressive: "" } },
        sources: []
      };
    }
  }
}
