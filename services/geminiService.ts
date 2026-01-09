import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

export async function generatePredictionsAndAnalysis(match: Partial<FootballMatch>, language: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Championnats majeurs pour stats détaillées
  const majorLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'Europa League'];
  const isMajor = majorLeagues.some(l => match.league?.includes(l));

  const prompt = `
    TON RÔLE : Expert Analyste Data Football (Tipster Professionnel).
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language}.

    INSTRUCTIONS CRITIQUES :
    1. Analyse les dernières infos via Google Search (blessures, compositions, météo).
    2. Marchés : 1X2, Over/Under 2.5, Les deux équipes marquent (BTTS).
    3. ${isMajor ? 'STATS DÉTAILLÉES REQUISES : Corners, Cartons Jaunes, Hors-jeu, Fautes, Tirs totaux, Tirs cadrés (soit match, soit par équipe).' : ''}
    4. ${isMajor ? 'BUTEURS : Liste des buteurs probables avec pourcentage de chance.' : ''}
    5. Propose deux scores exacts probables.

    TU DOIS RÉPONDRE EXCLUSIVEMENT AU FORMAT JSON SUIVANT (SANS MARKDOWN) :
    {
      "predictions": [{"type": "1X2", "recommendation": "1", "probability": 70, "confidence": "HIGH", "odds": 1.55}],
      "analysis": "Texte d'analyse tactique complet ici...",
      "vipInsight": {
        "exactScores": ["2-0", "2-1"],
        "keyFact": "Le fait majeur du match...",
        "detailedStats": {
          "corners": "Ex: Plus de 9.5 corners",
          "yellowCards": "Ex: 3-4 cartons au total",
          "offsides": "Ex: Environ 4 hors-jeu",
          "fouls": "Ex: Match physique, +25 fautes",
          "shots": "Ex: 22 tirs au total",
          "shotsOnTarget": "Ex: 8 tirs cadrés attendus",
          "scorers": [{"name": "Joueur X", "probability": 48}]
        }
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 10000 },
        responseMimeType: "application/json"
      }
    });

    const text = response.text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(text);
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Analyse Web",
        uri: chunk.web?.uri || ""
      })).filter((s: any) => s.uri) || [];
    
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence as string).toUpperCase() as Confidence,
        type: p.type as BetType
      })),
      analysis: data.analysis,
      vipInsight: {
        ...data.vipInsight,
        strategy: { safe: "Safe", value: "Value", aggressive: "Aggressive" }
      },
      sources
    };
  } catch (error) {
    console.error("Gemini Failure:", error);
    // Retour de secours pour ne pas bloquer l'UI
    return {
      predictions: [{ type: BetType.W1X2, recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 }],
      analysis: "Erreur de génération de l'analyse IA. Veuillez réessayer.",
      vipInsight: {
        exactScores: ["?-?"],
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" },
        keyFact: "Impossible de charger l'analyse pour le moment."
      },
      sources: []
    };
  }
}