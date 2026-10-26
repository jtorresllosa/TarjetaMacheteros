import { GolfCourse, Player, Round } from '../types';
import { calculateNetScore, calculatePlayerHoleStrokes, getSortedRoundPlayers } from './golfCalculations';

export type ParejasMode = 'low_high' | 'best_ball' | 'sum_net';

export interface PairSetup {
  rotationIndex: number;
  pair1PlayerIds: string[];
  pair2PlayerIds: string[];
}

export interface ByeState {
  rotationIndex: number;
  type: 'bye' | 'rebye';
  winningPairName: string;
  losingPairName: string;
  winningInitials: string;
  losingInitials: string;
  status: 'pending' | 'accepted_normal' | 'accepted_leon' | 'rejected';
}

export function getRotations(startHole: 1 | 10, numPlayers: number) {
  if (startHole === 10) {
    return [
      { id: 1, name: 'Rotación 1 (Hoyos 10-15)', holes: [10, 11, 12, 13, 14, 15] },
      { id: 2, name: 'Rotación 2 (Hoyos 16-3)', holes: [16, 17, 18, 1, 2, 3] },
      { id: 3, name: 'Rotación 3 (Hoyos 4-9)', holes: [4, 5, 6, 7, 8, 9] },
    ];
  } else {
    return [
      { id: 1, name: 'Rotación 1 (Hoyos 1-6)', holes: [1, 2, 3, 4, 5, 6] },
      { id: 2, name: 'Rotación 2 (Hoyos 7-12)', holes: [7, 8, 9, 10, 11, 12] },
      { id: 3, name: 'Rotación 3 (Hoyos 13-18)', holes: [13, 14, 15, 16, 17, 18] },
    ];
  }
}

export function calculateHolePairPoints(
  holeNumber: number,
  pair1Ids: string[],
  pair2Ids: string[],
  round: Round,
  roundPlayers: Player[],
  course: GolfCourse,
  mode: ParejasMode = 'low_high'
) {
  const playerStrokesMap: Record<string, Record<number, number>> = {};
  roundPlayers.forEach((p) => {
    playerStrokesMap[p.id] = calculatePlayerHoleStrokes(p, roundPlayers, course, round.config);
  });

  const getNet = (playerId: string) => {
    const strokes = round.scores[playerId]?.[holeNumber];
    if (strokes === undefined || strokes === null || isNaN(strokes)) return null;
    const hcpStrokes = playerStrokesMap[playerId]?.[holeNumber] || 0;
    return calculateNetScore(strokes, hcpStrokes);
  };

  const pair1Nets = pair1Ids.map(getNet).filter((n): n is number => n !== null);
  const pair2Nets = pair2Ids.map(getNet).filter((n): n is number => n !== null);

  if (pair1Nets.length === 0 || pair2Nets.length === 0) return { pair1Points: 0, pair2Points: 0, completed: false };

  // For 3 players: pair2 has 2 players, their score is average of net scores including decimals
  if (pair1Ids.length === 1 && pair2Ids.length === 2) {
    const p1Net = pair1Nets[0];
    const p2Avg = pair2Nets.reduce((a, b) => a + b, 0) / pair2Nets.length;
    let p1Pts = 0;
    let p2Pts = 0;
    if (p1Net < p2Avg) p1Pts += 2;
    else if (p2Avg < p1Net) p2Pts += 2;
    return { pair1Points: p1Pts, pair2Points: p2Pts, completed: true };
  }

  // For 4 or 5 players (2 vs 2 or general)
  if (mode === 'best_ball') {
    const p1Best = Math.min(...pair1Nets);
    const p2Best = Math.min(...pair2Nets);
    let p1Pts = 0;
    let p2Pts = 0;
    if (p1Best < p2Best) p1Pts += 2;
    else if (p2Best < p1Best) p2Pts += 2;
    return { pair1Points: p1Pts, pair2Points: p2Pts, completed: true };
  }

  if (mode === 'sum_net') {
    const p1Sum = pair1Nets.reduce((a, b) => a + b, 0);
    const p2Sum = pair2Nets.reduce((a, b) => a + b, 0);
    let p1Pts = 0;
    let p2Pts = 0;
    if (p1Sum < p2Sum) p1Pts += 2;
    else if (p2Sum < p1Sum) p2Pts += 2;
    return { pair1Points: p1Pts, pair2Points: p2Pts, completed: true };
  }

  // Default: low vs low (1 pt) and high vs high (1 pt)
  const p1Sorted = [...pair1Nets].sort((a, b) => a - b);
  const p2Sorted = [...pair2Nets].sort((a, b) => a - b);

  let p1Pts = 0;
  let p2Pts = 0;

  // Low vs Low
  const low1 = p1Sorted[0];
  const low2 = p2Sorted[0];
  if (low1 < low2) p1Pts += 1;
  else if (low2 < low1) p2Pts += 1;

  // High vs High
  const high1 = p1Sorted[p1Sorted.length - 1];
  const high2 = p2Sorted[p2Sorted.length - 1];
  if (high1 < high2) p1Pts += 1;
  else if (high2 < high1) p2Pts += 1;

  return { pair1Points: p1Pts, pair2Points: p2Pts, completed: true };
}

export function getPairScoreDisplay(
  pairIds: string[],
  holeNumber: number,
  round: Round,
  roundPlayers: Player[],
  course: GolfCourse
) {
  const playerStrokesMap: Record<string, Record<number, number>> = {};
  roundPlayers.forEach((p) => {
    playerStrokesMap[p.id] = calculatePlayerHoleStrokes(p, roundPlayers, course, round.config);
  });

  const scores = pairIds.map((id) => {
    const gross = round.scores[id]?.[holeNumber];
    if (gross === undefined || gross === null || isNaN(gross)) return null;
    const hcpStrokes = playerStrokesMap[id]?.[holeNumber] || 0;
    const net = calculateNetScore(gross, hcpStrokes);
    return `${gross}(${net ?? '-'})`;
  }).filter((s): s is string => s !== null);

  if (scores.length === 0) return '-';
  return scores.join(' / ');
}

export function getRotationPairsForPlayerList(sortedPlayers: Player[], rotIdx: number, numPlayers: number) {
  if (numPlayers === 3) {
    const p1Id = sortedPlayers[rotIdx % 3].id;
    const p2Ids = sortedPlayers.filter(p => p.id !== p1Id).map(p => p.id);
    return { pair1: [p1Id], pair2: p2Ids };
  } else if (numPlayers === 4) {
    if (rotIdx === 0) {
      return { pair1: [sortedPlayers[0].id, sortedPlayers[1].id], pair2: [sortedPlayers[2].id, sortedPlayers[3].id] };
    } else if (rotIdx === 1) {
      return { pair1: [sortedPlayers[0].id, sortedPlayers[2].id], pair2: [sortedPlayers[1].id, sortedPlayers[3].id] };
    } else {
      return { pair1: [sortedPlayers[0].id, sortedPlayers[3].id], pair2: [sortedPlayers[1].id, sortedPlayers[2].id] };
    }
  } else if (numPlayers === 5) {
    const fixed = [sortedPlayers[0].id, sortedPlayers[1].id];
    const rem = sortedPlayers.slice(2);
    const remPairs = [
      [rem[0].id, rem[1].id],
      [rem[1].id, rem[2].id],
      [rem[0].id, rem[2].id]
    ];
    return { pair1: fixed, pair2: remPairs[rotIdx % remPairs.length] };
  } else {
    return {
      pair1: [sortedPlayers[0]?.id || ''],
      pair2: [sortedPlayers[1]?.id || '']
    };
  }
}

export function getRotationPairs(round: Round, sortedPlayers: Player[], rotIdx: number) {
  if (round.parejasConfig && round.parejasConfig[rotIdx]) {
    return round.parejasConfig[rotIdx];
  }
  return getRotationPairsForPlayerList(sortedPlayers, rotIdx, sortedPlayers.length);
}

export function getPairInitials(pairIds: string[], roundPlayers: Player[]) {
  return pairIds.map((id) => roundPlayers.find((p) => p.id === id)?.initials || id.slice(0, 3).toUpperCase()).join(' & ');
}

export interface ByePromptInfo {
  rotationIndex: number;
  rotationName: string;
  winningInitials: string;
  losingInitials: string;
  cumP1: number;
  cumP2: number;
  type: 'bye' | 'rebye';
  byeHoleIndex?: number;
}

export function checkActiveBye(
  round: Round,
  roundPlayers: Player[],
  course: GolfCourse,
  mode: ParejasMode = 'low_high'
): ByePromptInfo | null {
  const sortedPlayers = getSortedRoundPlayers(roundPlayers, round.config);
  const rotations = getRotations(round.config.startHole, sortedPlayers.length);

  for (let rotIdx = 0; rotIdx < rotations.length; rotIdx++) {
    const byeState = round.parejasByeStates?.[rotIdx];
    const rot = rotations[rotIdx];
    const pairs = getRotationPairs(round, sortedPlayers, rotIdx);

    if (!byeState?.byeResolved) {
      let cumP1 = 0;
      let cumP2 = 0;
      let lastCompletedIndex = -1;

      rot.holes.forEach((hNum, hIdx) => {
        const res = calculateHolePairPoints(hNum, pairs.pair1, pairs.pair2, round, sortedPlayers, course, mode);
        if (res.completed) {
          cumP1 += res.pair1Points;
          cumP2 += res.pair2Points;
          lastCompletedIndex = hIdx;
        }
      });

      if (lastCompletedIndex >= 0 && lastCompletedIndex < rot.holes.length - 1) {
        const lead = Math.abs(cumP1 - cumP2);
        const remainingHolesCount = rot.holes.length - (lastCompletedIndex + 1);
        const pointsRemaining = remainingHolesCount * 2;

        if (lead > pointsRemaining && lead > 0) {
          const byeHoleNum = rot.holes[lastCompletedIndex];
          if (round.confirmedHoles?.[byeHoleNum]) {
            const p1Initials = getPairInitials(pairs.pair1, sortedPlayers);
            const p2Initials = getPairInitials(pairs.pair2, sortedPlayers);
            const winningInitials = cumP1 > cumP2 ? p1Initials : p2Initials;
            const losingInitials = cumP1 > cumP2 ? p2Initials : p1Initials;

            return {
              rotationIndex: rotIdx,
              rotationName: rot.name,
              winningInitials,
              losingInitials,
              cumP1,
              cumP2,
              type: 'bye',
              byeHoleIndex: lastCompletedIndex
            };
          }
        }
      }
    } else if (byeState.byeAccepted && !byeState.rebyeResolved) {
      const byeHoleIdx = byeState.byeHoleIndex ?? 0;
      let reCumP1 = 0;
      let reCumP2 = 0;
      let reLastCompleted = -1;

      rot.holes.forEach((hNum, hIdx) => {
        if (hIdx > byeHoleIdx) {
          const res = calculateHolePairPoints(hNum, pairs.pair1, pairs.pair2, round, sortedPlayers, course, mode);
          if (res.completed) {
            reCumP1 += res.pair1Points;
            reCumP2 += res.pair2Points;
            reLastCompleted = hIdx;
          }
        }
      });

      if (reLastCompleted >= 0 && reLastCompleted < rot.holes.length - 1) {
        const reLead = Math.abs(reCumP1 - reCumP2);
        const reRemaining = rot.holes.length - (reLastCompleted + 1);
        const rePointsRemaining = reRemaining * 2;

        if (reLead > rePointsRemaining && reLead > 0) {
          const reByeHoleNum = rot.holes[reLastCompleted];
          if (round.confirmedHoles?.[reByeHoleNum]) {
            const p1Initials = getPairInitials(pairs.pair1, sortedPlayers);
            const p2Initials = getPairInitials(pairs.pair2, sortedPlayers);
            const winningInitials = reCumP1 > reCumP2 ? p1Initials : p2Initials;
            const losingInitials = reCumP1 > reCumP2 ? p2Initials : p1Initials;

            return {
              rotationIndex: rotIdx,
              rotationName: rot.name,
              winningInitials,
              losingInitials,
              cumP1: reCumP1,
              cumP2: reCumP2,
              type: 'rebye'
            };
          }
        }
      }
    }
  }

  return null;
}


