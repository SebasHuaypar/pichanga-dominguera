import { Match } from "@/types";

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Reorders matches to minimize or eliminate back-to-back matches for any team.
 */
function reorderFixtureToAvoidBackToBack(matches: any[]): any[] {
  const teamIds = Array.from(
    new Set(matches.flatMap(m => [m.home_team_id, m.away_team_id]))
  );

  // Try increasing maxBackToBacks limits
  for (let maxBackToBacks = 0; maxBackToBacks <= matches.length; maxBackToBacks++) {
    // Try increasing maxRest limits
    for (let maxRest = 1; maxRest <= matches.length; maxRest++) {
      const used = new Array(matches.length).fill(false);
      const path: any[] = [];
      const lastPos: Record<string, number> = {};
      for (const t of teamIds) {
        lastPos[t] = -1;
      }

      let solved = false;
      // Shuffle matches to ensure randomization across different generations
      const shuffledMatches = shuffleArray(matches);

      function solve(backToBackCount: number): boolean {
        if (path.length === matches.length) {
          solved = true;
          return true;
        }

        const idx = path.length;

        // Pruning: check if any team has rested too long
        const mustPlayTeams: string[] = [];
        for (const t of teamIds) {
          if (lastPos[t] !== -1) {
            const currentRest = idx - lastPos[t] - 1;
            if (currentRest >= maxRest) {
              mustPlayTeams.push(t);
            }
          }
        }

        if (mustPlayTeams.length > 2) {
          return false; // Impossible to satisfy because too many teams must play in this single slot
        }

        if (mustPlayTeams.length === 2) {
          const t1 = mustPlayTeams[0];
          const t2 = mustPlayTeams[1];
          const matchIdx = shuffledMatches.findIndex((m, i) => 
            !used[i] && (
              (m.home_team_id === t1 && m.away_team_id === t2) || 
              (m.home_team_id === t2 && m.away_team_id === t1)
            )
          );
          
          if (matchIdx !== -1) {
            const match = shuffledMatches[matchIdx];
            
            let causesBackToBack = false;
            if (idx > 0) {
              const prevMatch = path[idx - 1];
              if (
                match.home_team_id === prevMatch.home_team_id || 
                match.home_team_id === prevMatch.away_team_id || 
                match.away_team_id === prevMatch.home_team_id || 
                match.away_team_id === prevMatch.away_team_id
              ) {
                causesBackToBack = true;
              }
            }

            if (causesBackToBack && backToBackCount >= maxBackToBacks) {
              return false;
            }

            used[matchIdx] = true;
            path.push(match);
            const prevHome = lastPos[match.home_team_id];
            const prevAway = lastPos[match.away_team_id];
            lastPos[match.home_team_id] = idx;
            lastPos[match.away_team_id] = idx;

            if (solve(backToBackCount + (causesBackToBack ? 1 : 0))) return true;

            lastPos[match.home_team_id] = prevHome;
            lastPos[match.away_team_id] = prevAway;
            path.pop();
            used[matchIdx] = false;
          }
          return false;
        }

        if (mustPlayTeams.length === 1) {
          const t = mustPlayTeams[0];
          for (let i = 0; i < shuffledMatches.length; i++) {
            if (!used[i]) {
              const match = shuffledMatches[i];
              if (match.home_team_id === t || match.away_team_id === t) {
                let causesBackToBack = false;
                if (idx > 0) {
                  const prevMatch = path[idx - 1];
                  if (
                    match.home_team_id === prevMatch.home_team_id || 
                    match.home_team_id === prevMatch.away_team_id || 
                    match.away_team_id === prevMatch.home_team_id || 
                    match.away_team_id === prevMatch.away_team_id
                  ) {
                    causesBackToBack = true;
                  }
                }

                if (causesBackToBack && backToBackCount >= maxBackToBacks) {
                  continue;
                }

                used[i] = true;
                path.push(match);
                const prevHome = lastPos[match.home_team_id];
                const prevAway = lastPos[match.away_team_id];
                lastPos[match.home_team_id] = idx;
                lastPos[match.away_team_id] = idx;

                if (solve(backToBackCount + (causesBackToBack ? 1 : 0))) return true;

                lastPos[match.home_team_id] = prevHome;
                lastPos[match.away_team_id] = prevAway;
                path.pop();
                used[i] = false;
              }
            }
          }
          return false;
        }

        // Try any unused match
        for (let i = 0; i < shuffledMatches.length; i++) {
          if (!used[i]) {
            const match = shuffledMatches[i];
            let causesBackToBack = false;
            if (idx > 0) {
              const prevMatch = path[idx - 1];
              if (
                match.home_team_id === prevMatch.home_team_id || 
                match.home_team_id === prevMatch.away_team_id || 
                match.away_team_id === prevMatch.home_team_id || 
                match.away_team_id === prevMatch.away_team_id
              ) {
                causesBackToBack = true;
              }
            }

            if (causesBackToBack && backToBackCount >= maxBackToBacks) {
              continue;
            }

            used[i] = true;
            path.push(match);
            const prevHome = lastPos[match.home_team_id];
            const prevAway = lastPos[match.away_team_id];
            lastPos[match.home_team_id] = idx;
            lastPos[match.away_team_id] = idx;

            if (solve(backToBackCount + (causesBackToBack ? 1 : 0))) return true;

            lastPos[match.home_team_id] = prevHome;
            lastPos[match.away_team_id] = prevAway;
            path.pop();
            used[i] = false;
          }
        }

        return false;
      }

      solve(0);
      if (solved) {
        return path;
      }
    }
  }

  return matches;
}


/**
 * Generates a randomized Round Robin fixture.
 * Shuffles teams before generating to ensure fairness.
 */
export function generateRandomFixture(teamIds: string[]) {
  const randomizedTeams = shuffleArray(teamIds);
  
  if (randomizedTeams.length % 2 !== 0) {
    randomizedTeams.push('BYE'); // Add a dummy team for odd number of teams
  }

  const rounds = randomizedTeams.length - 1;
  const matchesPerRound = randomizedTeams.length / 2;
  let fixture = [];

  for (let round = 0; round < rounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = (round + match) % (randomizedTeams.length - 1);
      let away = (randomizedTeams.length - 1 - match + round) % (randomizedTeams.length - 1);

      if (match === 0) {
        away = randomizedTeams.length - 1;
      }

      if (randomizedTeams[home] !== 'BYE' && randomizedTeams[away] !== 'BYE') {
        fixture.push({
          id: Math.random().toString(36).substr(2, 9),
          home_team_id: randomizedTeams[home],
          away_team_id: randomizedTeams[away],
          home_score: null,
          away_score: null,
          status: 'scheduled' as const,
          scheduled_date: new Date().toISOString(), // This should be adjusted by the admin
          round: round + 1,
        });
      }
    }
  }

  return reorderFixtureToAvoidBackToBack(fixture);
}
