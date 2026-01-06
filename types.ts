
export enum Confidence {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum BetType {
  W1X2 = '1X2',
  OVER_UNDER = 'O/U 2.5',
  BTTS = 'BTTS',
  EXACT_SCORE = 'SCORE EXACT',
  PLAYER_PROPS = 'BUTEUR'
}

export interface MatchStats {
  homeForm: string[]; 
  awayForm: string[];
  homeRank: number;
  awayRank: number;
  h2h: string; 
}

export interface Prediction {
  type: BetType;
  recommendation: string;
  probability: number;
  confidence: Confidence;
  odds: number;
}

export interface VipInsight {
  exactScores: string[];
  strategy: {
    safe: string;
    value: string;
    aggressive: string;
  };
  keyFact: string;
}

export interface FootballMatch {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  time: string;
  status: string;
  predictions: Prediction[];
  stats: MatchStats;
  vipInsight?: VipInsight;
}

export interface Standing {
  overall_league_position: string;
  team_name: string;
  team_badge: string;
  overall_league_payed: string;
  overall_league_W: string;
  overall_league_D: string;
  overall_league_L: string;
  overall_league_PTS: string;
  overall_league_GF: string;
  overall_league_GA: string;
}

export type RiskLevel = 'Safe' | 'Moderate' | 'High Risk';
export type Language = 'FR' | 'EN';

export interface UserProfile {
  name: string;
  email: string;
  riskLevel: RiskLevel;
  language: Language;
}
