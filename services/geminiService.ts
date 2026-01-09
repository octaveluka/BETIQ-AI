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
    RÈGLES STRICTES :
    1. Donne EXACTEMENT 2 suggestions de scores exacts.
    2. Format de réponse EXCLUSIVEMENT JSON.

    STRUCTURE JSON :
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
        temperature: 0, // Zéro pour une constance maximale
        seed: 42 // Graine fixe pour des résultats identiques
      }
    });

    const rawText = response.text;
    const jsonText = rawText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonText);
    
    // S'assurer qu'il n'y a que 2 scores
    if (data.vipInsight && data.vipInsight.exactScores) {
      data.vipInsight.exactScores = data.vipInsight.exactScores.slice(0, 2);
    }

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence as string).toUpperCase() as Confidence,
        type: p.type as BetType
      })),
      analysis: data.analysis || "Analyse indisponible.",
      vipInsight: {
        ...data.vipInsight,
        strategy: { safe: "Sécure", value: "Value", aggressive: "Risqué" }
      },
      sources: []
    };
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    return {
      predictions: [{ type: BetType.W1X2, recommendation: "1X", probability: 50, confidence: Confidence.MEDIUM, odds: 0 }],
      analysis: "Erreur lors de l'analyse IA. Les serveurs sont peut-être surchargés.",
      vipInsight: {
        exactScores: ["?-?"],
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" },
        keyFact: "Indisponible."
      },
      sources: []
    };
  }
}