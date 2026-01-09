
import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  // Initialisation dynamique à chaque appel pour garantir la récupération de la clé API la plus récente
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Détection de la CAN ou des compétitions majeures pour le grounding Google Search
  const isCanMatch = match.league.toLowerCase().includes('can') || 
                    match.league.toLowerCase().includes('nations cup') ||
                    match.league.toLowerCase().includes('afrique') ||
                    match.country_name?.toLowerCase().includes('africa');
  
  const isMajorLeague = ['Champions League', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'].some(l => match.league.includes(l));

  // Activation de Google Search uniquement si nécessaire pour optimiser la latence, 
  // mais obligatoire pour la CAN et les ligues majeures pour éviter les erreurs d'effectifs.
  const useSearch = isCanMatch || isMajorLeague;

  const prompt = `
    TU ES UN ANALYSTE TACTIQUE DE FOOTBALL PROFESSIONNEL.
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language === 'EN' ? 'English' : 'Français'}.

    MISSION CRITIQUE :
    ${useSearch ? "1. UTILISE l'outil Google Search pour vérifier les EFFECTIFS ACTUELS, les blessures de DERNIÈRE MINUTE et l'ENTRAÎNEUR en poste aujourd'hui." : ""}
    2. INTERDICTION D'HALLUCINER : Ne cite aucun joueur qui a quitté le club ou un ancien entraîneur. Si tu as un doute, ne mentionne pas de nom spécifique.
    3. ANALYSE : Fournis une analyse tactique de 3-4 lignes basée sur des faits réels (forme, enjeux, absents).
    4. PRÉDICTIONS : Génère des probabilités précises pour 1X2, Over/Under 2.5 et BTTS.
    5. STATS VIP : Estime les corners, cartons et buteurs probables (uniquement joueurs présents).

    RÉPONDS UNIQUEMENT AU FORMAT JSON STRICT :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "...", "probability": 70, "confidence": "HIGH", "odds": 1.75},
        {"type": "OVER/UNDER 2.5", "recommendation": "...", "probability": 65, "confidence": "MEDIUM", "odds": 1.80},
        {"type": "BTTS", "recommendation": "...", "probability": 55, "confidence": "LOW", "odds": 1.95}
      ],
      "analysis": "...",
      "vipInsight": {
        "exactScores": ["1-0", "2-1"],
        "strategy": {"safe": "...", "value": "...", "aggressive": "..."},
        "keyFact": "...",
        "detailedStats": {
          "corners": "8-11",
          "yellowCards": "3-5",
          "offsides": "2-4",
          "fouls": "22-26",
          "shots": "12-15",
          "shotsOnTarget": "4-6",
          "scorers": [{"name": "...", "probability": 45}]
        }
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Utilisation de googleSearch comme seul outil autorisé si activé
        tools: useSearch ? [{ googleSearch: {} }] : undefined,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");

    const data = JSON.parse(text);

    // Extraction des sources de recherche Google si disponibles
    const sources: { title: string; uri: string }[] = [];
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || "Lien de vérification",
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
      analysis: data.analysis || "Analyse technique en cours de mise à jour.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "N/A",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: sources
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Retour d'un objet par défaut cohérent en cas d'erreur
    return {
      predictions: [
        { type: "1X2", recommendation: "Signal Indisponible", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }
      ],
      analysis: language === 'EN' ? "AI analysis is currently unavailable. Please try again later." : "L'analyse IA est temporairement indisponible. Veuillez réessayer plus tard.",
      vipInsight: { 
        exactScores: ["?-?"], 
        keyFact: "Erreur technique",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  }
}
