const API_KEY = '8fc116983517a0adaa7e23c8c688e56e3bce4429d6d87511d759b9ebfd53f564';
const BASE_URL = 'https://apiv3.apifootball.com/';

export interface ApiMatch {
  match_id: string;
  country_name: string;
  league_name: string;
  match_date: string;
  match_status: string;
  match_time: string;
  match_hometeam_id: string;
  match_hometeam_name: string;
  match_hometeam_score: string;
  match_awayteam_name: string;
  match_awayteam_id: string;
  match_awayteam_score: string;
  team_home_badge: string;
  team_away_badge: string;
  league_logo: string;
  league_id: string;
}

export async function fetchMatchesByDate(date: string): Promise<ApiMatch[]> {
  // Construction robuste de l'URL
  const params = new URLSearchParams({
    action: 'get_events',
    from: date,
    to: date,
    APIkey: API_KEY
  });
  
  const url = `${BASE_URL}?${params.toString()}`;
  
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`FootballAPI Response not OK: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    // Si l'API renvoie un objet d'erreur au lieu d'une liste
    if (data.error || !Array.isArray(data)) {
      console.warn("API Return Info:", data.error || "No data array");
      return [];
    }
    
    // Ligues prioritaires + Support pour les petites ligues demandées
    const relevantLeagues = [
      'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 
      'Champions League', 'Europa League', 'Eredivisie', 'Primeira Liga',
      'Championship', 'Segunda Division', 'Serie B', 'Ligue 2', 'Bundesliga 2',
      'Jupiler Pro League', 'Super Lig', 'A-League', 'Super League'
    ];

    // On garde un maximum de 80 matchs pour ne pas surcharger l'IA
    return data.filter(m => 
      relevantLeagues.some(l => m.league_name.includes(l)) || 
      ['England', 'Spain', 'France', 'Italy', 'Germany', 'Netherlands', 'Portugal'].includes(m.country_name)
    ).slice(0, 80);

  } catch (error) {
    console.error("FootballAPI Critical Network Error:", error);
    return [];
  }
}

export async function fetchStandings(leagueId: string) {
  const url = `${BASE_URL}?action=get_standings&league_id=${leagueId}&APIkey=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Standings Error:", error);
    return null;
  }
}