export interface Hole {
  number: number;
  par: number;
  handicap: number; // Índice de dificultad del hoyo (1 al 18)
}

export interface TeeInfo {
  name: string; // e.g., "Blancas", "Azules", "Rojas", "Doradas"
  rating: number;
  slope: number;
  parTotal: number;
}

export interface GolfCourse {
  id: string;
  name: string;
  location?: string;
  isFavorite?: boolean; // Marcado como favorito con estrella
  holes: Hole[]; // Exactamente 18 hoyos
  tees?: TeeInfo[];
}

export interface Player {
  id: string;
  name: string;
  initials: string; // Campo de tres letras como iniciales
  phone?: string; // Teléfono opcional
  handicapIndex: number; // Hándicap entero (positivo o negativo)
  avatar?: string;
}

export type GameMode = 'contra_base' | 'contra_campo';

export interface RoundConfig {
  courseId: string;
  playerIds: string[]; // Entre 3 y 5 jugadores
  gameMode: GameMode;
  percentage: number; // 75, 80, 85, 90, 100
  startHole: 1 | 10;
  roundHandicaps?: Record<string, number>; // Hándicap temporal exclusivo para esta ronda por jugador
  activeBets?: {
    sindicato?: boolean;
    parejas?: boolean;
    individuales?: boolean;
    match?: boolean;
    perifericos?: boolean;
    monedas?: boolean;
    medallas?: boolean;
  };
}

export interface Round {
  id: string;
  date: string;
  config: RoundConfig;
  scores: Record<string, Record<number, number>>; // { playerId: { holeNumber: strokes } }
  status: 'setup' | 'active' | 'finished';
  parejasConfig?: Record<number, { pair1: string[]; pair2: string[] }>;
  parejasByeStates?: Record<number, {
    byeResolved?: boolean;
    byeAccepted?: boolean;
    byeLeonAccepted?: boolean;
    byeHoleIndex?: number;
    rebyeResolved?: boolean;
    rebyeAccepted?: boolean;
    rebyeLeonAccepted?: boolean;
  }>;
  confirmedHoles?: Record<number, boolean>;
  individualesByeStates?: Record<string, {
    byeResolved?: boolean;
    byeAccepted?: boolean;
    byeLeonAccepted?: boolean;
    byeHoleIndex?: number;
    rebyeResolved?: boolean;
    rebyeAccepted?: boolean;
    rebyeLeonAccepted?: boolean;
  }>;
  perifericosParticipation?: Record<string, boolean>;
  perifericosCounts?: Record<string, { greenie: number; birdie: number; sandy: number; aguila: number; ppun: number }>;
  medallasParticipation?: Record<string, boolean>;
  medallasCounts?: Record<string, { agua: number; bunker: number; calle: number; triputt: number; special: number }>;
  monedasParticipation?: Record<string, boolean>;
  monedasCounts?: Record<string, { agua: number; bunker: number; calle: number; triputt: number; special: number }>;
  activeBets?: {
    sindicato?: boolean;
    parejas?: boolean;
    individuales?: boolean;
    match?: boolean;
    perifericos?: boolean;
    monedas?: boolean;
    medallas?: boolean;
  };
}

