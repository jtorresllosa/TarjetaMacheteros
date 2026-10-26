import { GolfCourse, Player, RoundConfig } from '../types';

/**
 * Redondeo especial para golf: si termina en 0.5, se redondea hacia abajo siempre.
 */
export function golfRound(val: number): number {
  return Math.round(val);
}

export interface PlayerRoundHandicap {
  playerId: string;
  rawHandicap: number;
  hcb: number; // Handicap contra la base / campo calculado
  playingHandicap: number; // Handicap de juego para la ronda
}

/**
 * Calcula los hándicaps de la ronda para todos los jugadores según la modalidad, porcentaje y hándicaps de ronda.
 */
export function calculateRoundHandicaps(
  players: Player[],
  config: RoundConfig
): PlayerRoundHandicap[] {
  const evaluated = players.map((p) => {
    // Usar el hándicap temporal de la ronda si fue definido, de lo contrario el hándicap registrado
    const effectiveHcp = config.roundHandicaps?.[p.id] !== undefined
      ? config.roundHandicaps[p.id]
      : p.handicapIndex;

    const raw = effectiveHcp * (config.percentage / 100);
    const hcb = golfRound(raw);
    return {
      playerId: p.id,
      rawHandicap: effectiveHcp,
      hcb,
      playingHandicap: hcb
    };
  });

  if (config.gameMode === 'contra_base') {
    const minHcb = Math.min(...evaluated.map((e) => e.hcb));
    return evaluated.map((e) => ({
      ...e,
      playingHandicap: Math.max(0, e.hcb - minHcb)
    }));
  } else {
    return evaluated;
  }
}

/**
 * Obtiene los jugadores ordenados para la tarjeta:
 * En Contra la Base: orden ascendente de Hcb.
 */
export function getSortedRoundPlayers(
  players: Player[],
  config: RoundConfig
): Player[] {
  const handicaps = calculateRoundHandicaps(players, config);
  const hcpMap = new Map(handicaps.map((h) => [h.playerId, h]));

  const sorted = [...players].sort((a, b) => {
    const hA = hcpMap.get(a.id)?.hcb ?? a.handicapIndex;
    const hB = hcpMap.get(b.id)?.hcb ?? b.handicapIndex;
    if (hA !== hB) return hA - hB;
    return a.name.localeCompare(b.name);
  });

  return sorted;
}

/**
 * Calcula los golpes de ventaja que recibe un jugador en cada hoyo según su hándicap de juego.
 */
export function calculatePlayerHoleStrokes(
  player: Player,
  allPlayers: Player[],
  course: GolfCourse,
  config: RoundConfig
): Record<number, number> {
  const roundHcps = calculateRoundHandicaps(allPlayers, config);
  const playerHcpData = roundHcps.find((h) => h.playerId === player.id);
  
  const effectiveHcp = config.roundHandicaps?.[player.id] !== undefined
    ? config.roundHandicaps[player.id]
    : player.handicapIndex;

  const playingHcp = playerHcpData ? playerHcpData.playingHandicap : golfRound(effectiveHcp * (config.percentage / 100));

  const holeStrokes: Record<number, number> = {};

  course.holes.forEach((hole) => {
    let strokesOnThisHole = 0;
    const hcpRank = hole.handicap; // 1 (más difícil) al 18 (más fácil)

    if (playingHcp > 0) {
      const fullRounds = Math.floor(playingHcp / 18);
      const remainder = playingHcp % 18;

      strokesOnThisHole = fullRounds;
      if (hcpRank <= remainder) {
        strokesOnThisHole += 1;
      }
    } else if (playingHcp < 0) {
      const positiveHcp = Math.abs(playingHcp);
      const fullRounds = Math.floor(positiveHcp / 18);
      const remainder = positiveHcp % 18;
      strokesOnThisHole = -(fullRounds + (hcpRank > (18 - remainder) ? 1 : 0));
    }

    holeStrokes[hole.number] = strokesOnThisHole;
  });

  return holeStrokes;
}

export function calculateNetScore(
  grossStrokes: number | undefined,
  strokesReceived: number
): number | null {
  if (grossStrokes === undefined || grossStrokes === null) return null;
  return grossStrokes - strokesReceived;
}
