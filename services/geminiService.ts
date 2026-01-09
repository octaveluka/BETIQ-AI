
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
  
  const prompt = `
    RÔLE : Expert Analyste Sportif et Data Scientist Football.
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language === 'EN' ? 'English' : 'Français'}.

    OBJECTIF : Fournir un signal de pari haute précision basé sur la tactique et les data historiques.
    
    TU DOIS GÉNÉRER DES PRÉDICTIONS POUR :
    1. 1X2 (Vainqueur)
    2. Over/Under 2.5 (Buts)
    3. BTTS (Les deux équipes marquent)

    AINSI QUE DES STATISTIQUES DÉTAILLÉES :
    - Corners (format: "Nombre min-max")
    - Cartons Jaunes (format: "Nombre min-max")
    - Hors-jeu, Fautes, Tirs totaux, Tirs cadrés.
    - Buteurs probables avec probabilité en %.

    REPONDS UNIQUEMENT AU FORMAT JSON SUIVANT :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Equipe A", "probability": 75, "confidence": "HIGH", "odds": 1.65},
        {"type": "OVER/UNDER 2.5", "recommendation": "Over 2.5", "probability": 80, "confidence": "HIGH", "odds": 1.80},
        {"type": "BTTS", "recommendation": "Oui", "probability": 60, "confidence": "MEDIUM", "odds": 1.95}
      ],
      "analysis": "Texte d'analyse tactique de 3-4 lignes.",
      "vipInsight": {
        "exactScores": ["2-1", "3-1", "1-0"],
        "strategy": {"safe": "Mise modérée sur 1X2", "value": "Over 2.5", "aggressive": "Score exact 2-1"},
        "keyFact": "Fait majeur du match.",
        "detailedStats": {
          "corners": "8-11",
          "yellowCards": "3-5",
          "offsides": "2-4",
          "fouls": "22-26",
          "shots": "12-16",
          "shotsOnTarget": "4-7",
          "scorers": [{"name": "Nom Joueur", "probability": 65}]
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
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    
    const data = JSON.parse(text);

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse indisponible.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "N/A",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      predictions: [
        { type: "1X2", recommendation: "Indisponible", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }
      ],
      analysis: "Erreur de génération IA. Veuillez réessayer.",
      vipInsight: { 
        exactScores: ["?-?"], 
        keyFact: "Erreur technique",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  }
}
