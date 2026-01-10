
import { GoogleGenAI, Type } from "@google/genai";
import { FootballMatch, Confidence, Prediction, VipInsight } from "../types";

export interface AnalysisResult {
  predictions: Prediction[];
  analysis: string;
  vipInsight: VipInsight;
  sources: { title: string; uri: string }[];
}

export async function generatePredictionsAndAnalysis(match: FootballMatch, language: string): Promise<AnalysisResult> {
  // On utilise une nouvelle instance pour s'assurer que la clé API la plus récente est utilisée
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const today = new Date().toISOString().split('T')[0];

  const prompt = `
    SYSTÈME DE VÉRIFICATION FACTUELLE CRITIQUE - ANALYSTE TACTIQUE BETIQ.
    MATCH : ${match.homeTeam} vs ${match.awayTeam}.
    COMPÉTITION : ${match.league}.
    DATE DU MATCH : ${match.time} (Aujourd'hui est le ${today}).
    LANGUE : ${language === 'EN' ? 'English' : 'Français'}.

    PROTOCOLE DE VÉRIFICAION STRICT (GROUNDING) :
    1. TU DOIS utiliser Google Search pour obtenir les faits RÉELS du jour.
    2. VÉRIFICATION DE L'ENTRAÎNEUR : Identifie le coach actuel. Ne cite pas un ancien coach (ex: pas de Xavi au Barça, pas de Klopp à Liverpool).
    3. ÉTAT DES EFFECTIFS : Vérifie les blessures, suspensions, et joueurs à la CAN/Asian Cup pour CE match précis.
    4. TRANSFERTS : Assure-toi que les joueurs mentionnés jouent toujours dans le club cité.
    5. INTERDICTION DE L'IMAGINAIRE : Ne mentionne AUCUN nom de joueur ou de coach si la recherche Google ne confirme pas sa présence aujourd'hui. C'est une mission de PRÉCISION ABSOLUE.
    
    L'ANALYSE DOIT :
    - Expliquer l'impact tactique des absences confirmées par le web.
    - Déduire les probabilités (1X2, O/U, BTTS) à partir de ces réalités.

    RÉPONDS UNIQUEMENT AU FORMAT JSON STRICT :
    {
      "predictions": [
        {"type": "1X2", "recommendation": "...", "probability": 70, "confidence": "HIGH", "odds": 1.7},
        {"type": "OVER/UNDER 2.5", "recommendation": "...", "probability": 65, "confidence": "MEDIUM", "odds": 1.8},
        {"type": "BTTS", "recommendation": "...", "probability": 60, "confidence": "HIGH", "odds": 1.9}
      ],
      "analysis": "Basé sur les faits vérifiés du ${today} : [Nom Entraîneur], [Joueurs absents/présents]. [Analyse tactique].",
      "vipInsight": {
        "exactScores": ["1-0", "2-0"],
        "strategy": {"safe": "...", "value": "...", "aggressive": "..."},
        "keyFact": "Le point crucial vérifié sur le web qui définit ce match.",
        "detailedStats": {
          "corners": "9-11",
          "yellowCards": "3-4",
          "offsides": "2-3",
          "fouls": "20-25",
          "shots": "10-14",
          "shotsOnTarget": "4-5",
          "scorers": [{"name": "[JOUEUR RÉEL VÉRIFIÉ]", "probability": 40}]
        }
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        // Budget de réflexion pour s'assurer qu'il analyse soigneusement les résultats de recherche avant de répondre
        thinkingConfig: { thinkingBudget: 8000 },
        maxOutputTokens: 12000
      }
    });

    const text = response.text;
    if (!text) throw new Error("Réponse IA vide");

    const data = JSON.parse(text);
    
    // Extraction des sources pour prouver la vérification
    const sources: { title: string; uri: string }[] = [];
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title || "Vérification Source", uri: chunk.web.uri });
        }
      });
    }

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        ...p,
        confidence: (p.confidence || 'MEDIUM').toUpperCase() as Confidence,
      })),
      analysis: data.analysis || "Analyse tactique vérifiée.",
      vipInsight: data.vipInsight || { 
        exactScores: ["?-?"], 
        keyFact: "Données non disponibles",
        strategy: { safe: "N/A", value: "N/A", aggressive: "N/A" }
      },
      sources: sources
    };
  } catch (error) {
    console.error("Gemini Protocol Error:", error);
    return {
      predictions: [{ type: "1X2", recommendation: "Analyse impossible", probability: 50, confidence: Confidence.MEDIUM, odds: 1.0 }],
      analysis: "Erreur lors de la validation des faits en temps réel. Veuillez recharger la page.",
      vipInsight: { exactScores: [], keyFact: "Erreur technique", strategy: { safe: "", value: "", aggressive: "" } },
      sources: []
    };
  }
}
