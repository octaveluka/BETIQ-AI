
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
  PLAYER_PROPS = 'BUTEUR',
  CORNERS = 'CORNERS',
  CARDS = 'CARTONS'
}

export interface TeamStats {
  standing: number;
  points: number;
  recentForm: string[]; // Ex: ['W', 'D', 'L', 'W', 'W']
}

export interface MatchStats {
  homeForm: string[]; 
  awayForm: string[];
  homeRank: number;
  awayRank: number;
  h2h: string; 
}

export interface Prediction {
  type: BetType | string;
  recommendation: string;
  probability: number;
  confidence: Confidence;
  odds: number;
}

export interface DetailedStats {
  corners: string;
  yellowCards: string;
  offsides: string;
  fouls: string;
  shots: string;
  shotsOnTarget: string;
  throwIns?: string;
  scorers: { name: string; probability: number }[];
}

export interface VipInsight {
  exactScores: string[];
  strategy: {
    safe: string;
    value: string;
    aggressive: string;
  };
  keyFact: string;
  detailedStats?: DetailedStats;
}

export interface FootballMatch {
  id: string;
  league: string;
  league_id?: string;
  country_name?: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  time: string;
  status: string;
  predictions: Prediction[];
  stats: MatchStats;
  homeTeamStats?: TeamStats;
  awayTeamStats?: TeamStats;
  vipInsight?: VipInsight;
  analysis?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  isVip: boolean;
}

export type RiskLevel = 'Safe' | 'Moderate' | 'High Risk';
export type Language = 'FR' | 'EN';
