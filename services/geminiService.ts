import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  // Utilisation de gemini-3-flash-preview pour une génération JSON plus stable et rapide
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    RÔLE : Analyste Expert Data Football (Style Signal IA Professionnel).
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language}.

    TACHE : Génère une analyse fondamentale et des probabilités précises.
    IMPORTANT : Tu dois fournir des statistiques détaillées (Corners, Cartons, Hors-jeu, Fautes, Tirs, Tirs cadrés) avec des probabilités en pourcentage.
    
    FORMAT : Répondre UNIQUEMENT avec un objet JSON valide.

    STRUCTURE JSON :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "Nom de l'équipe", "probability": 75, "confidence": "HIGH", "odds": 1.5},
        {"type": "O/U 2.5", "recommendation": "Over 2.5", "probability": 70, "confidence": "HIGH", "odds": 1.8},
        {"type": "BTTS", "recommendation": "Yes/No", "probability": 62, "confidence": "MEDIUM", "odds": 1.9}
      ],
      "analysis": "Analyse tactique fondamentale très détaillée ici...",
      "vipInsight": {
        "exactScores": ["2-1", "3-1"],
        "strategy": {"safe": "...", "value": "...", "aggressive": "..."},
        "keyFact": "Le détail clé du match",
        "detailedStats": {
          "corners": "9-11 au total (Probabilité 78%)",
          "yellowCards": "3-4 cartons (Probabilité 65%)",
          "offsides": "2-3 hors-jeu (Probabilité 60%)",
          "fouls": "20-25 fautes (Probabilité 72%)",
          "shots": "12-15 tirs (Probabilité 80%)",
          "shotsOnTarget": "5-6 tirs cadrés (Probabilité 75%)",
          "scorers": [{"name": "Nom Joueur", "probability": 68}]
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
        temperature: 0.1
      }
    });

    const data = JSON.parse(response.text || '{}');

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse fondamentale non disponible.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "Indisponible",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      predictions: [
        { type: "1X2", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 },
        { type: "O/U 2.5", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 },
        { type: "BTTS", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 }
      ],
      analysis: "Erreur de connexion avec l'IA.",
      vipInsight: { 
        exactScores: ["?-?"], 
        keyFact: "Erreur",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  }
}