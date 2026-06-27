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
  // 1. Group matches by round
  const roundsMap: Record<number, any[]> = {};
  matches.forEach(m => {
    if (!roundsMap[m.round]) {
      roundsMap[m.round] = [];
    }
    roundsMap[m.round].push(m);
  });

  const sortedRounds = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);
  const orderedMatches: any[] = [];

  if (sortedRounds.length === 0) return [];
  
  // For the first round, we just add the matches as they are
  const firstRoundMatches = roundsMap[sortedRounds[0]];
  orderedMatches.push(...firstRoundMatches);

  for (let i = 1; i < sortedRounds.length; i++) {
    const roundNum = sortedRounds[i];
    const currentRoundMatches = [...roundsMap[roundNum]];
    
    // We want to find a match in currentRoundMatches where neither team played
    // in the last match of the previous round.
    const lastMatchOfPrevRound = orderedMatches[orderedMatches.length - 1];
    const prevTeams = [lastMatchOfPrevRound.home_team_id, lastMatchOfPrevRound.away_team_id];

    // Find index of match that does not contain any of the teams in prevTeams
    let bestMatchIdx = currentRoundMatches.findIndex(m => 
      !prevTeams.includes(m.home_team_id) && !prevTeams.includes(m.away_team_id)
    );

    if (bestMatchIdx !== -1) {
      // Move this match to the beginning of this round
      const [firstMatch] = currentRoundMatches.splice(bestMatchIdx, 1);
      orderedMatches.push(firstMatch);
    } else {
      // If not possible, find the match with the minimum overlap
      let minOverlapIdx = 0;
      let minOverlapCount = 2;
      currentRoundMatches.forEach((m, idx) => {
        let overlap = 0;
        if (prevTeams.includes(m.home_team_id)) overlap++;
        if (prevTeams.includes(m.away_team_id)) overlap++;
        if (overlap < minOverlapCount) {
          minOverlapCount = overlap;
          minOverlapIdx = idx;
        }
      });
      const [firstMatch] = currentRoundMatches.splice(minOverlapIdx, 1);
      orderedMatches.push(firstMatch);
    }

    // Add the rest of the matches for this round in their original order
    orderedMatches.push(...currentRoundMatches);
  }

  return orderedMatches;
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
