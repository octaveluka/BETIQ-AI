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
  const url = `${BASE_URL}?action=get_events&from=${date}&to=${date}&APIkey=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("API Error:", data.error);
      return [];
    }
    
    const majorLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'Europa League', 'Eredivisie', 'Primeira Liga'];
    return Array.isArray(data) ? data.filter(m => majorLeagues.some(l => m.league_name.includes(l))).slice(0, 30) : [];
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}

export async function fetchStandings(leagueId: string) {
  const url = `${BASE_URL}?action=get_standings&league_id=${leagueId}&APIkey=${API_KEY}`;
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Standings Error:", error);
    return null;
  }
}