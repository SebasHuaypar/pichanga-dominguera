export interface Team {
  id: string;
  name: string;
  logo_url?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
  is_active: boolean;
  created_at?: string;
}

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'live' | 'completed';
  scheduled_date: string;
  round: number;
  home_team?: Team;
  away_team?: Team;
}

export interface StandingsEntry extends Team {
  goal_difference: number;
}
