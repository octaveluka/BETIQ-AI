import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Préparation des données statistiques injectées pour l'IA
  const homeStanding = match.homeTeamStats ? `${match.homeTeam} est ${match.homeTeamStats.standing}e avec ${match.homeTeamStats.points} pts` : 'N/A';
  const awayStanding = match.awayTeamStats ? `${match.awayTeam} est ${match.awayTeamStats.standing}e avec ${match.awayTeamStats.points} pts` : 'N/A';
  const homeForm = match.homeTeamStats?.recentForm?.join(', ') || 'N/A';
  const awayForm = match.awayTeamStats?.recentForm?.join(', ') || 'N/A';

  const prompt = `
    RÔLE : Expert Analyste Data Football.
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language}.

    DONNÉES :
    - Classement : ${homeStanding} / ${awayStanding}
    - Forme : ${match.homeTeam} (${homeForm}) vs ${match.awayTeam} (${awayForm})

    TACHE : Génère une analyse fondamentale et des probabilités.
    RÉPONDS EXCLUSIVEMENT EN JSON (SANS MARKDOWN) :
    {
      "predictions": [{"type": "1X2", "recommendation": "1", "probability": 70, "confidence": "HIGH", "odds": 1.70}],
      "analysis": "Analyse tactique condensée...",
      "vipInsight": {
        "exactScores": ["2-0", "2-1"],
        "keyFact": "Détail clé...",
        "detailedStats": {
          "corners": "Over 8.5",
          "yellowCards": "3-4 total",
          "offsides": "2-3",
          "fouls": "20-25",
          "shots": "12-15",
          "shotsOnTarget": "5-6",
          "scorers": [{"name": "Nom Joueur", "probability": 40}]
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
        temperature: 0.7
      }
    });

    const rawText = response.text;
    // Nettoyage au cas où le modèle renverrait du Markdown
    const jsonText = rawText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonText);
    
    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence as string).toUpperCase() as Confidence,
        type: p.type as BetType
      })),
      analysis: data.analysis || "Analyse en cours de traitement...",
      vipInsight: {
        ...data.vipInsight,
        strategy: { safe: "Sécure", value: "Value", aggressive: "Risqué" }
      },
      sources: []
    };
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    // Retour d'un objet par défaut pour éviter le crash UI
    return {
      predictions: [{ type: BetType.W1X2, recommendation: "1X", probability: 50, confidence: Confidence.MEDIUM, odds: 0 }],
      analysis: "L'IA n'a pas pu finaliser l'analyse. Veuillez réessayer dans quelques instants.",
      vipInsight: {
        exactScores: ["?-?"],
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" },
        keyFact: "Données indisponibles."
      },
      sources: []
    };
  }
}