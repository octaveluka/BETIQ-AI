
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
    if (data.error || !Array.isArray(data)) {
      console.warn("Football API Error or Empty:", data);
      return [];
    }
    
    // Priority Leagues for Sorting
    const priorityLeagues = [
      'Champions League', 'Premier League', 'La Liga', 'Serie A', 
      'Bundesliga', 'Ligue 1', 'Europa League', 'Conference League',
      'World Cup', 'Euro', 'Copa América', 'Brasileirão', 'Eredivisie',
      'Primeira Liga', 'MLS', 'Saudi Pro League'
    ];

    // Sort: Priority Leagues first, then by time
    return data.sort((a, b) => {
      const aIsPriority = priorityLeagues.some(l => a.league_name.includes(l));
      const bIsPriority = priorityLeagues.some(l => b.league_name.includes(l));

      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      return a.match_time.localeCompare(b.match_time);
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
