
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
    
    // On s'assure que les enums sont bien castés
    return {
      ...data,
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      }))
    };
  } catch (error) {
    console.error("Analysis Request Failed:", error);
    return {
      predictions: [
        { type: "1X2", recommendation: "Service Indisponible", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }
      ],
      analysis: "Désolé, nous ne parvenons pas à contacter nos services d'analyse. Vérifiez votre connexion.",
      vipInsight: { 
        exactScores: [], 
        keyFact: "Erreur de communication serveur.", 
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" } 
      },
      sources: []
    };
  }
}
