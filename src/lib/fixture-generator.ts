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
  let bestFixture = matches;
  let minConsecutive = Infinity;

  // Try multiple random greedy constructions to find a perfect sequence
  for (let attempt = 0; attempt < 1000; attempt++) {
    const pool = [...matches];
    const sequenced = [];
    let consecutiveCount = 0;

    // Shuffle pool to add randomness to the greedy search
    const shuffledPool = shuffleArray(pool);

    // Pick first match
    sequenced.push(shuffledPool.shift());

    while (shuffledPool.length > 0) {
      const lastMatch = sequenced[sequenced.length - 1];
      
      // Find a match that doesn't share teams with lastMatch
      const validIndex = shuffledPool.findIndex(m => 
        m.home_team_id !== lastMatch.home_team_id &&
        m.home_team_id !== lastMatch.away_team_id &&
        m.away_team_id !== lastMatch.home_team_id &&
        m.away_team_id !== lastMatch.away_team_id
      );

      if (validIndex !== -1) {
        sequenced.push(shuffledPool.splice(validIndex, 1)[0]);
      } else {
        // No valid match found, we have to pick one that causes back-to-back
        consecutiveCount++;
        sequenced.push(shuffledPool.shift());
      }
    }

    if (consecutiveCount === 0) {
      return sequenced; // Found a sequence with no back-to-back!
    }

    if (consecutiveCount < minConsecutive) {
      minConsecutive = consecutiveCount;
      bestFixture = sequenced;
    }
  }

  return bestFixture;
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
