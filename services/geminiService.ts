
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
  
  const majorLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'Europa League'];
  const isMajor = majorLeagues.some(l => match.league?.includes(l));

  // Préparation des données statistiques injectées
  const homeStanding = match.homeTeamStats ? `${match.homeTeam} est ${match.homeTeamStats.standing}e avec ${match.homeTeamStats.points} pts` : 'N/A';
  const awayStanding = match.awayTeamStats ? `${match.awayTeam} est ${match.awayTeamStats.standing}e avec ${match.awayTeamStats.points} pts` : 'N/A';
  const homeForm = match.homeTeamStats?.recentForm?.join(', ') || 'N/A';
  const awayForm = match.awayTeamStats?.recentForm?.join(', ') || 'N/A';

  const prompt = `
    TON RÔLE : Analyste expert en Data Football et Probabilités.
    MATCH : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language}.

    DONNÉES STATISTIQUES FOURNIES :
    - Classement : 
      * ${homeStanding}
      * ${awayStanding}
    - Forme Récente (5 derniers matchs) :
      * ${match.homeTeam} : ${homeForm}
      * ${match.awayTeam} : ${awayForm}

    OBJECTIF : Réaliser une analyse fondamentale basée sur ces données.
    
    STATISTIQUES DÉTAILLÉES REQUISES (OBLIGATOIRE POUR GRANDS CHAMPIONNATS) :
    - Corners (Total match ou par équipe)
    - Cartons Jaunes (Total match ou par équipe)
    - Hors-jeu (Total match ou par équipe)
    - Fautes (Total match ou par équipe)
    - Tirs totaux et Tirs cadrés (Total match ou par équipe)
    - Buteurs probables avec probabilité en %

    RÉPONDS EXCLUSIVEMENT AU FORMAT JSON SUIVANT :
    {
      "predictions": [{"type": "1X2", "recommendation": "1", "probability": 70, "confidence": "HIGH", "odds": 1.70}],
      "analysis": "Analyse tactique fondamentale basée sur le classement et la forme...",
      "vipInsight": {
        "exactScores": ["2-0", "2-1"],
        "keyFact": "Facteur décisif du match...",
        "detailedStats": {
          "corners": "Ex: Over 8.5",
          "yellowCards": "Ex: 4-5 total",
          "offsides": "Ex: 3-4",
          "fouls": "Ex: +20 fautes",
          "shots": "Ex: 25 tirs",
          "shotsOnTarget": "Ex: 9 cadrés",
          "scorers": [{"name": "Nom Joueur", "probability": 45}]
        }
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(text);
    
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
      sources: []
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
