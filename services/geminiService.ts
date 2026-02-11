
import { FootballMatch, Confidence, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

/**
 * Appelle le backend local (/api/analyze) qui gère la logique sécurisée
 * (Priorité API Custom -> Fallback Gemini).
 */
export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match, language }),
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Sanitisation robuste des données pour éviter les crashes React
    const safePredictions = Array.isArray(data.predictions) ? data.predictions : [];
    const safeVipInsight = data.vipInsight || {};
    const safeDetailedStats = safeVipInsight.detailedStats || {};
    
    return {
      ...data,
      predictions: safePredictions.map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      vipInsight: {
          ...safeVipInsight,
          detailedStats: {
              ...safeDetailedStats,
              scorers: Array.isArray(safeDetailedStats.scorers) ? safeDetailedStats.scorers : []
          }
      }
    };
  } catch (error) {
    console.error("Analysis Request Failed:", error);
    return {
      predictions: [
        { type: "1X2", recommendation: "Service Indisponible", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }
      ],
      analysis: "Désolé, nous ne parvenons pas à contacter nos services d'analyse. Vérifiez votre connexion.",
      vipInsight: { 
        keyFact: "Erreur de communication serveur.", 
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" },
        detailedStats: {
            corners: "N/A",
            shotsOnTarget: "N/A",
            yellowCards: "N/A",
            fouls: "N/A",
            throwIns: "N/A",
            scorers: []
        }
      },
      sources: []
    };
  }
}
