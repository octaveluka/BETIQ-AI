import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  // Toujours utiliser gemini-3-flash-preview pour les tâches de texte/données complexes
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    RÔLE : Expert en Analyse de Données Footballistiques.
    OBJET : Analyse fondamentale du match ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    LANGUE : ${language === 'FR' ? 'Français' : 'English'}.

    TACHE : Tu dois générer un rapport d'analyse complet incluant :
    1. Prédictions principales (1X2, Over/Under 2.5, BTTS).
    2. Analyse fondamentale tactique détaillée.
    3. Statistiques de jeu précises (OBLIGATOIRE) :
       - Nombre de Corners (match ou équipes)
       - Cartons jaunes (match ou équipes)
       - Hors-jeu (match ou équipes)
       - Fautes (match ou équipes)
       - Tirs totaux (match ou équipes)
       - Tirs cadrés (match ou équipes)
       - Buteurs probables avec pourcentages
    
    IMPORTANT : Répondre UNIQUEMENT avec un JSON valide respectant strictement la structure suivante. Ne pas ajouter de texte avant ou après.

    {
      "predictions": [
        {"type": "1X2", "recommendation": "Equipe ou Nul", "probability": 75, "confidence": "HIGH", "odds": 1.5},
        {"type": "O/U 2.5", "recommendation": "Over 2.5", "probability": 70, "confidence": "HIGH", "odds": 1.8},
        {"type": "BTTS", "recommendation": "Yes", "probability": 62, "confidence": "MEDIUM", "odds": 1.9}
      ],
      "analysis": "Texte d'analyse tactique et fondamentale ici...",
      "vipInsight": {
        "exactScores": ["2-1", "1-0"],
        "strategy": {"safe": "Mise modérée", "value": "Cote intéressante", "aggressive": "Grosse cote"},
        "keyFact": "Détail clé de la rencontre",
        "detailedStats": {
          "corners": "9-11 corners (Probabilité 78%)",
          "yellowCards": "3-5 cartons (Probabilité 65%)",
          "offsides": "2-4 hors-jeu (Probabilité 60%)",
          "fouls": "22-26 fautes (Probabilité 72%)",
          "shots": "24-28 tirs (Probabilité 80%)",
          "shotsOnTarget": "8-10 tirs cadrés (Probabilité 75%)",
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
        temperature: 0.2
      }
    });

    const data = JSON.parse(response.text || '{}');

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse tactique non disponible actuellement.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "Analyse en cours",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  } catch (error) {
    console.error("Critical Gemini API Error:", error);
    return {
      predictions: [
        { type: "1X2", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 },
        { type: "O/U 2.5", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 },
        { type: "BTTS", recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 }
      ],
      analysis: "L'IA est momentanément indisponible pour ce match. Réessayez plus tard.",
      vipInsight: { 
        exactScores: ["?-?"], 
        keyFact: "Erreur IA",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: []
    };
  }
}