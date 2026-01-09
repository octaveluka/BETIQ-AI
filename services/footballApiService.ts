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
    
    // Filtres étendus selon les exigences
    const africanKeywords = ['Africa', 'CAN', 'Cup of Nations', 'CAF', 'Afrique', 'Coupe d\'Afrique'];
    const eliteKeywords = [
      'Champions League', 'Europa League', 'Conference League', 'Libertadores', 
      'CONCACAF', 'FIFA Club World Cup', 'World Cup', 'Euro', 'Copa América', 
      'Asian Cup', 'Gold Cup', 'Nations League', 'Copa del Rey', 'Coupe du roi', 'King\'s Cup'
    ];
    const majorCountries = [
      'England', 'Spain', 'Italy', 'Germany', 'France', 
      'Brazil', 'Mexico', 'USA', 'Portugal', 'Netherlands'
    ];

    return data.filter(m => {
      const name = m.league_name.toLowerCase();
      const country = m.country_name.toLowerCase();
      
      const isAfrican = africanKeywords.some(key => name.includes(key.toLowerCase()) || country.includes(key.toLowerCase()));
      const isElite = eliteKeywords.some(key => name.includes(key.toLowerCase()));
      const isMajorCountry = majorCountries.some(c => country === c.toLowerCase());
      
      // On garde aussi spécifiquement l'ID 28 (souvent CAN)
      return isAfrican || isElite || isMajorCountry || m.league_id === '28';
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