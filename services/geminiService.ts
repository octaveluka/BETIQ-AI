
import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

/**
 * Prompt standard partagé entre l'API Custom et Gemini pour une cohérence maximale.
 * Ce prompt demande explicitement un JSON pur pour faciliter le parsing.
 */
const getDetailedPrompt = (match: FootballMatch, language: string, today: string) => `
    TU ES UN EXPERT EN PRONOSTICS FOOTBALL DE HAUT NIVEAU.
    MATCH : ${match.homeTeam} VS ${match.awayTeam}.
    LIGUE : ${match.league}.
    DATE DU MATCH : ${match.time} (Aujourd'hui : ${today}).
    LANGUE : ${language === 'EN' ? 'English' : 'Français'}.

    MISSION : Analyser le match et fournir des prédictions précises.
    IMPORTANT : Vérifie les entraîneurs actuels et les effectifs réels (blessés, suspendus, CAN).

    RÉPONDS UNIQUEMENT PAR UN OBJET JSON VALIDE SANS AUCUN AUTRE TEXTE.
    STRUCTURE DU JSON :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Ex: Victoire Domicile", "probability": 70, "confidence": "HIGH", "odds": 1.7},
        {"type": "OVER/UNDER 2.5", "recommendation": "Ex: +2.5 buts", "probability": 65, "confidence": "MEDIUM", "odds": 1.8},
        {"type": "BTTS", "recommendation": "Ex: Oui", "probability": 60, "confidence": "HIGH", "odds": 1.9}
      ],
      "analysis": "Texte d'analyse tactique de 3-4 lignes.",
      "vipInsight": {
        "exactScores": ["1-0", "2-1"],
        "strategy": {"safe": "Libellé", "value": "Libellé", "aggressive": "Libellé"},
        "keyFact": "Le fait majeur du match.",
        "detailedStats": {
          "corners": "8-10",
          "yellowCards": "3-5",
          "offsides": "2-4",
          "fouls": "22-26",
          "shots": "12-15",
          "shotsOnTarget": "4-6",
          "scorers": [{"name": "Nom du joueur", "probability": 45}]
        }
      }
    }
`;

/**
 * Nettoie et extrait le JSON d'une chaîne de texte potentiellement polluée par du Markdown.
 */
function extractAndParseJson(text: string) {
  try {
    // Supprime les balises Markdown ```json et ```
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Aucun bloc JSON trouvé dans la réponse");
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Erreur de parsing JSON. Texte reçu :", text);
    throw new Error("Format de réponse invalide");
  }
}

/**
 * Appelle l'API personnalisée Delfaapiai via POST (Priorité 1)
 */
async function callCustomApi(match: FootballMatch, language: string): Promise<any> {
  const today = new Date().toISOString().split('T')[0];
  const prompt = getDetailedPrompt(match, language, today);
  
  const response = await fetch("https://delfaapiai.vercel.app/ai/copilot", {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      message: prompt,
      model: "default"
    })
  });

  if (!response.ok) throw new Error(`Custom API HTTP Error: ${response.status}`);
  
  const text = await response.text();
  return extractAndParseJson(text);
}

/**
 * Fallback vers Gemini 3 Flash Preview avec recherche Google (Priorité 2)
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

  const text = response.text;
  if (!text) throw new Error("Gemini Fallback a renvoyé une réponse vide");
  
  const data = JSON.parse(text);
  const sources: any[] = [];
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  
  if (groundingMetadata?.groundingChunks) {
    groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({ 
          title: chunk.web.title || "Vérification Source", 
          uri: chunk.web.uri 
        });
      }
    });
  }
  return { data, sources };
}

/**
 * Fonction principale d'orchestration de l'analyse
 */
export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  try {
    // TENTATIVE 1 : API PERSONNALISÉE (Delfaapiai)
    console.log("BETIQ: Appel de l'API personnalisée...");
    const data = await callCustomApi(match, language);
    console.log("BETIQ: Réponse API personnalisée reçue avec succès.");
    
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse technique générée.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "Données basées sur les statistiques récentes.",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: [] 
    };
  } catch (error) {
    console.warn("BETIQ: L'API personnalisée a échoué. Tentative de secours avec Gemini 3 Flash Preview.", error);
    
    // TENTATIVE 2 : GEMINI 3 FLASH PREVIEW (Fallback)
    try {
      const { data, sources } = await callGeminiFallback(match, language);
      console.log("BETIQ: Réponse Gemini reçue avec succès.");
      
      return {
        predictions: (data.predictions || []).map((p: any) => ({
          ...p,
          confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
        })),
        analysis: data.analysis || "Analyse de secours via IA.",
        vipInsight: data.vipInsight || { 
          exactScores: ["?-?"], 
          keyFact: "Vérification des faits via recherche Google effectuée.",
          strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
        },
        sources: sources
      };
    } catch (fallbackError) {
      console.error("BETIQ: Échec total des services d'analyse.", fallbackError);
      return {
        predictions: [
          { type: "1X2", recommendation: "Service indisponible", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }
        ],
        analysis: "Désolé, nos serveurs d'intelligence artificielle ne répondent pas. Veuillez réessayer dans un instant.",
        vipInsight: { 
          exactScores: [], 
          keyFact: "Problème technique temporaire.", 
          strategy: { safe: "", value: "", aggressive: "" } 
        },
        sources: []
      };
    }
  }
}
