import { GolfCourse, Player, Round } from '../types';
import { calculatePlayerHoleStrokes, calculateNetScore } from './golfCalculations';

export interface HoleSindicatoResult {
  holeNumber: number;
  netScores: Record<string, number | null>;
  points: Record<string, number>;
}

export interface SindicatoRoundSummary {
  holeResults: HoleSindicatoResult[];
  primeraVueltaPoints: Record<string, number>;
  segundaVueltaPoints: Record<string, number>;
  totalPoints: Record<string, number>;
  primeraVueltaWinner: string | null;
  segundaVueltaWinner: string | null;
  totalWinner: string | null;
  messages: string[];
}

export function calculateSindicato(
  round: Round,
  course: GolfCourse,
  players: Player[]
): SindicatoRoundSummary {
  const n = players.length;
  if (n < 3 || n > 5) {
    return {
      holeResults: [],
      primeraVueltaPoints: {},
      segundaVueltaPoints: {},
      totalPoints: {},
      primeraVueltaWinner: null,
      segundaVueltaWinner: null,
      totalWinner: null,
      messages: ['El Sindicato requiere entre 3 y 5 jugadores.']
    };
  }

  const isStartHole10 = round.config.startHole === 10;
  const primeraVueltaHoles = isStartHole10
    ? Array.from({ length: 9 }, (_, i) => i + 10)
    : Array.from({ length: 9 }, (_, i) => i + 1);

  const segundaVueltaHoles = isStartHole10
    ? Array.from({ length: 9 }, (_, i) => i + 1)
    : Array.from({ length: 9 }, (_, i) => i + 10);

  const allHoles = [...primeraVueltaHoles, ...segundaVueltaHoles];

  const playerStrokesMap: Record<string, Record<number, number>> = {};
  players.forEach((p) => {
    playerStrokesMap[p.id] = calculatePlayerHoleStrokes(p, players, course, round.config);
  });

  let basePoints: number[] = [];
  if (n === 3) basePoints = [4, 2, 0];
  else if (n === 4) basePoints = [6, 4, 2, 0];
  else if (n === 5) basePoints = [8, 6, 4, 2, 0];

  const holeResults: HoleSindicatoResult[] = [];
  const primeraVueltaPoints: Record<string, number> = {};
  const segundaVueltaPoints: Record<string, number> = {};
  const totalPoints: Record<string, number> = {};

  players.forEach((p) => {
    primeraVueltaPoints[p.id] = 0;
    segundaVueltaPoints[p.id] = 0;
    totalPoints[p.id] = 0;
  });

  allHoles.forEach((hNum) => {
    const netScores: Record<string, number | null> = {};
    const activePlayersOnHole: { id: string; net: number }[] = [];

    players.forEach((p) => {
      const g = round.scores[p.id]?.[hNum];
      if (g !== undefined && g !== null && !isNaN(g)) {
        const strokes = playerStrokesMap[p.id]?.[hNum] || 0;
        const net = calculateNetScore(g, strokes);
        netScores[p.id] = net;
        if (net !== null) {
          activePlayersOnHole.push({ id: p.id, net });
        } else {
          netScores[p.id] = null;
        }
      } else {
        netScores[p.id] = null;
      }
    });

    const holePoints: Record<string, number> = {};
    players.forEach((p) => {
      holePoints[p.id] = 0;
    });

    if (activePlayersOnHole.length === n) {
      activePlayersOnHole.sort((a, b) => a.net - b.net);

      const groups: { net: number; ids: string[] }[] = [];
      activePlayersOnHole.forEach((item) => {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.net === item.net) {
          lastGroup.ids.push(item.id);
        } else {
          groups.push({ net: item.net, ids: [item.id] });
        }
      });

      let currentRank = 0;
      groups.forEach((group) => {
        const groupSize = group.ids.length;
        let sumPoints = 0;
        for (let i = 0; i < groupSize; i++) {
          const rankIdx = Math.min(currentRank + i, basePoints.length - 1);
          sumPoints += basePoints[rankIdx];
        }
        const ptsPerPlayer = sumPoints / groupSize;
        group.ids.forEach((id) => {
          holePoints[id] = ptsPerPlayer;
        });
        currentRank += groupSize;
      });
    }

    players.forEach((p) => {
      const pts = holePoints[p.id] || 0;
      if (primeraVueltaHoles.includes(hNum)) {
        primeraVueltaPoints[p.id] += pts;
      } else {
        segundaVueltaPoints[p.id] += pts;
      }
      totalPoints[p.id] += pts;
    });

    holeResults.push({
      holeNumber: hNum,
      netScores,
      points: holePoints
    });
  });

  const getVueltaWinner = (vueltaPoints: Record<string, number>): { winner: string | null; isCarryOver: boolean; tiedIds: string[] } => {
    const entries = Object.entries(vueltaPoints).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { winner: null, isCarryOver: false, tiedIds: [] };

    const maxPts = entries[0][1];
    const tied = entries.filter((e) => e[1] === maxPts);

    if (tied.length === 1) {
      return { winner: tied[0][0], isCarryOver: false, tiedIds: [tied[0][0]] };
    }

    if (n === 3 && tied.length === 2) {
      return { winner: 'carry-over', isCarryOver: true, tiedIds: tied.map((e) => e[0]) };
    }
    if ((n === 4 || n === 5) && tied.length >= 3) {
      return { winner: 'carry-over', isCarryOver: true, tiedIds: tied.map((e) => e[0]) };
    }

    return { winner: 'tie', isCarryOver: false, tiedIds: tied.map((e) => e[0]) };
  };

  const pvRes = getVueltaWinner(primeraVueltaPoints);
  const svRes = getVueltaWinner(segundaVueltaPoints);
  const totalRes = getVueltaWinner(totalPoints);

  let primeraVueltaWinner: string | null = pvRes.winner;
  let segundaVueltaWinner: string | null = svRes.winner;
  let totalWinner: string | null = totalRes.winner;

  const messages: string[] = [];

  if (pvRes.isCarryOver) {
    messages.push('¡Carry-over en la Primera Vuelta! El ganador de la Primera Vuelta será el ganador del Total.');
  }

  if (svRes.isCarryOver) {
    messages.push('¡Carry-over en la Segunda Vuelta! No habrá ganador en la Segunda Vuelta.');
    segundaVueltaWinner = 'carry-over';
  }

  if (totalRes.winner === 'tie' || (totalRes.tiedIds.length > 1 && !totalRes.isCarryOver)) {
    messages.push('Empate en la vuelta Total. Cada jugador recibe 0 puntos en dicha vuelta.');
  }

  if (pvRes.isCarryOver && totalRes.tiedIds.length > 0) {
    const samePlayers = pvRes.tiedIds.every((id) => totalRes.tiedIds.includes(id)) && pvRes.tiedIds.length === totalRes.tiedIds.length;
    if (samePlayers) {
      messages.push('Hubo carry-over en la Primera Vuelta y los mismos jugadores empataran en el Total. Cada jugador en la Primera Vuelta recibe 0 puntos.');
    }
  }

  return {
    holeResults,
    primeraVueltaPoints,
    segundaVueltaPoints,
    totalPoints,
    primeraVueltaWinner,
    segundaVueltaWinner,
    totalWinner,
    messages
  };
}
