import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, BetType, Prediction, VipInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generatePredictionsAndAnalysis(match: Partial<FootballMatch>, language: string): Promise<{ predictions: Prediction[], analysis: string, vipInsight: VipInsight }> {
  // Graine déterministe basée sur l'ID du match pour avoir toujours le même résultat
  const seed = parseInt(match.id?.toString().replace(/\D/g, '').slice(-8) || '0', 10);

  const prompt = `
    Analyse footballistique experte pour le match : ${match.homeTeam} vs ${match.awayTeam} (${match.league}).
    
    INSTRUCTIONS :
    - Prédictions : 1X2, Over/Under 2.5, BTTS.
    - VIP DATA : 2 scores exacts les plus probables.
    - Analyse : Un paragraphe expert expliquant la dynamique du match en ${language === 'FR' ? 'Français' : 'Anglais'}.

    IMPORTANT : Tes résultats doivent être stables et cohérents avec les forces en présence.
    FORMAT : JSON uniquement.
    Structure :
    {
      "predictions": [
        { "type": "1X2", "recommendation": "1", "probability": 72, "confidence": "HIGH", "odds": 1.65 }
      ],
      "analysis": "...",
      "vipInsight": {
        "exactScores": ["2-1", "2-0"],
        "strategy": { "safe": "...", "value": "...", "aggressive": "..." },
        "keyFact": "..."
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        seed: seed // Utilisation de la graine pour la cohérence
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      predictions: data.predictions.map((p: any) => ({
        ...p,
        confidence: p.confidence as Confidence,
        type: p.type as BetType
      })),
      analysis: data.analysis,
      vipInsight: data.vipInsight
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      predictions: [{ type: BetType.W1X2, recommendation: "N/A", probability: 50, confidence: Confidence.MEDIUM, odds: 0 }],
      analysis: "L'analyse IA est temporairement indisponible.",
      vipInsight: {
        exactScores: ["1-1", "2-1"],
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" },
        keyFact: "Données indisponibles"
      }
    };
  }
}