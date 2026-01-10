
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
 * Utilise un prompt compact pour rester dans les limites de longueur d'URL GET
 */
async function callCustomApi(match: FootballMatch, language: string): Promise<any> {
  const compactPrompt = `Pronos foot ${language}: ${match.homeTeam} vs ${match.awayTeam}. JSON {predictions:[{type,recommendation,probability,confidence,odds}],analysis,vipInsight:{exactScores,strategy:{safe,value,aggressive},keyFact,detailedStats:{corners,yellowCards,offsides,fouls,shots,shotsOnTarget,scorers:[{name,probability}]}}}`;
  
  const url = `https://delfaapiai.vercel.app/ai/copilot?message=${encodeURIComponent(compactPrompt)}&model=default`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Custom API status: ${response.status}`);
  
  const text = await response.text();
  
  // Extraction robuste du JSON dans le texte de réponse
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Format JSON non détecté dans la réponse");
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.warn("Échec du parsing JSON de l'API Custom. Réponse brute:", text);
    throw new Error("Réponse API Custom invalide");
  }
}

/**
 * Fallback vers Gemini 3 Flash Preview (Recherche Google activée)
 */
async function callGeminiFallback(match: FootballMatch, language: string): Promise<{ data: any, sources: any[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0];
  
  const prompt = `
    DÉBOGAGE ANALYSE : MATCH ${match.homeTeam} VS ${match.awayTeam} (${match.league}).
    DATE : ${match.time} (Consultation le ${today}).
    INTERDICTION D'HALLUCINER : Utilise Google Search pour confirmer les entraîneurs et les joueurs blessés ou absents (CAN, etc.).
    LANGUE : ${language}.
    
    RÉPONDS UNIQUEMENT EN JSON :
    {
      "predictions": [{"type":"1X2","recommendation":"...","probability":70,"confidence":"HIGH","odds":1.70}, ...],
      "analysis": "Analyse tactique réelle de 3-4 lignes.",
      "vipInsight": {
        "exactScores": ["1-0", "2-1"],
        "strategy": {"safe": "...", "value": "...", "aggressive": "..."},
        "keyFact": "Le fait vérifié déterminant.",
        "detailedStats": {
          "corners": "8-10", "yellowCards": "3-5", "offsides": "2-4", "fouls": "20-25", "shots": "12-15", "shotsOnTarget": "4-6",
          "scorers": [{"name": "Nom Joueur Réel", "probability": 45}]
        }
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  const data = JSON.parse(response.text || '{}');
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
    // 1. TENTATIVE PRIORITAIRE : API CUSTOM
    const data = await callCustomApi(match, language);
    
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse tactique synchronisée.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "Données limitées",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  } catch (error) {
    console.error("L'API Custom a échoué. Passage à Gemini 3 Flash Preview.", error);
    
    // 2. TENTATIVE SECONDAIRE : GEMINI 3 FLASH PREVIEW
    try {
      const { data, sources } = await callGeminiFallback(match, language);
      return {
        predictions: (data.predictions || []).map((p: any) => ({
          ...p,
          confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
        })),
        analysis: data.analysis || "Analyse de secours via intelligence artificielle.",
        vipInsight: data.vipInsight || { 
          exactScores: ["?-?"], 
          keyFact: "Vérifié via recherche",
          strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
        },
        sources: sources
      };
    } catch (fallbackError) {
      console.error("Échec critique des deux sources de données.", fallbackError);
      return {
        predictions: [{ type: "1X2", recommendation: "Service Temporairement Indisponible", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }],
        analysis: "Nous rencontrons des difficultés pour récupérer les données en temps réel. Merci de patienter.",
        vipInsight: { exactScores: [], keyFact: "Erreur technique", strategy: { safe: "", value: "", aggressive: "" } },
        sources: []
      };
    }
  }
}
