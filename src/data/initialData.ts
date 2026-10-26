import { GolfCourse, Player } from '../types';

export const INITIAL_COURSES: GolfCourse[] = [
  {
    id: 'course-1',
    name: 'Club de Golf El Bosque',
    location: 'Lima, Perú',
    isFavorite: true,
    holes: Array.from({ length: 18 }, (_, i) => {
      const num = i + 1;
      let par = 4;
      if (num === 3 || num === 7 || num === 12 || num === 17) par = 3;
      if (num === 5 || num === 9 || num === 14 || num === 18) par = 5;
      return {
        number: num,
        par: par,
        handicap: ((num * 7) % 18) + 1
      };
    })
  },
  {
    id: 'course-2',
    name: 'Lima Golf Club',
    location: 'San Isidro, Lima',
    isFavorite: false,
    holes: Array.from({ length: 18 }, (_, i) => {
      const num = i + 1;
      let par = 4;
      if (num === 2 || num === 8 || num === 13 || num === 16) par = 3;
      if (num === 4 || num === 10 || num === 15) par = 5;
      return {
        number: num,
        par: par,
        handicap: ((num * 11) % 18) + 1
      };
    })
  },
  {
    id: 'course-3',
    name: 'Los Inkas Golf Club',
    location: 'Santiago de Surco, Lima',
    isFavorite: false,
    holes: Array.from({ length: 18 }, (_, i) => {
      const num = i + 1;
      let par = 4;
      if (num === 3 || num === 7 || num === 12 || num === 15) par = 3;
      if (num === 1 || num === 9 || num === 14 || num === 18) par = 5;
      return {
        number: num,
        par: par,
        handicap: ((num * 5) % 18) + 1
      };
    })
  }
];

export const INITIAL_PLAYERS: Player[] = [
  { id: 'player-1', name: 'Carlos Mendoza', initials: 'CM', phone: '+51999111222', handicapIndex: 12 },
  { id: 'player-2', name: 'Alonso Fernandez', initials: 'ALF', phone: '+51988222333', handicapIndex: 8 },
  { id: 'player-3', name: 'Diego Benavides', initials: 'DB', phone: '+51977333444', handicapIndex: 18 },
  { id: 'player-4', name: 'Rodrigo Salazar', initials: 'RS', phone: '+51966444555', handicapIndex: -2 },
  { id: 'player-5', name: 'Mateo Cilloniz', initials: 'MC', phone: '+51955555666', handicapIndex: 21 },
  { id: 'player-6', name: 'Ignacio Larco', initials: 'IL', phone: '+51944666777', handicapIndex: 15 }
];
