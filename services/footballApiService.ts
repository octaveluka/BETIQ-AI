
const API_KEY = '320dff0977443a6e3cb7f5ab498bde0dad1217e75818da14cf714876be940678';
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
  const params = new URLSearchParams({
    action: 'get_events',
    from: date,
    to: date,
    APIkey: API_KEY
  });
  
  const url = `${BASE_URL}?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (data.error || !Array.isArray(data)) return [];
    
    const Keywords = [
      'Champions League', 'Europa League', 'Conference League', 'Libertadores', 
      'CAF Champions', 'CONCACAF', 'FIFA Club World Cup', 'Premier League',
      'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Brasileirão', 'Liga MX',
      'Major League Soccer', 'MLS', 'Primeira Liga', 'Eredivisie', 'World Cup', 'Euro',
      'Copa América', 'CAN', 'Cup of Nations', 'Asian Cup', 'Gold Cup', 
      'Nations League', 'Copa del Rey', 'Coupe du Roi', 'King\'s Cup', 'African Nations'
    ];

    const africanKeywords = ['Africa', 'CAN', 'CAF', 'Afrique', 'Nations Cup'];

    return data.filter(m => {
      const name = m.league_name.toLowerCase();
      const country = m.country_name.toLowerCase();
      
      const isRequested = Keywords.some(key => name.includes(key.toLowerCase()));
      const isAfrican = africanKeywords.some(key => name.includes(key.toLowerCase()) || country.includes(key.toLowerCase()));
      const isMajorCountry = ['England', 'Spain', 'Italy', 'Germany', 'France', 'Brazil', 'Mexico', 'USA', 'Portugal', 'Netherlands', 'Spain'].includes(m.country_name);
      
      // Force include CAN (League ID 28 usually) or any league with African keywords
      return isRequested || isAfrican || isMajorCountry || m.league_id === '28';
    });

  } catch (error) {
    console.error("FootballAPI Error:", error);
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
    return null;
  }
}
