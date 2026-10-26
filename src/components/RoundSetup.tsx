import React, { useState } from 'react';
import { GolfCourse, Player, RoundConfig, GameMode } from '../types';
import { Flag, Play, Check, AlertCircle, Users, MapPin, Percent, Star, Award, Trophy, Sparkles, Swords, DollarSign } from 'lucide-react';

interface RoundSetupProps {
  courses: GolfCourse[];
  players: Player[];
  onStartRound: (config: RoundConfig) => void;
}

export const RoundSetup: React.FC<RoundSetupProps> = ({ courses, players, onStartRound }) => {
  const defaultCourse = courses.find((c) => c.isFavorite) || courses[0];

  const [selectedCourseId, setSelectedCourseId] = useState<string>(defaultCourse?.id || '');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('contra_base');
  const [percentage, setPercentage] = useState<number>(75);
  const [startHole, setStartHole] = useState<1 | 10>(1);

  // Active bets configuration for the round
  const [activeBets, setActiveBets] = useState({
    sindicato: true,
    parejas: true,
    individuales: true,
    match: true,
    perifericos: true,
    monedas: true,
  });

  const handleToggleBet = (betKey: keyof typeof activeBets) => {
    setActiveBets({
      ...activeBets,
      [betKey]: !activeBets[betKey]
    });
  };

  // Hándicaps específicos para esta ronda (playerId -> handicap entero)
  const [roundHandicaps, setRoundHandicaps] = useState<Record<string, number>>({});

  const handleGameModeChange = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'contra_base') {
      setPercentage(75);
    } else {
      setPercentage(100);
    }
  };

  const handleTogglePlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== playerId));
      const updatedHcps = { ...roundHandicaps };
      delete updatedHcps[playerId];
      setRoundHandicaps(updatedHcps);
    } else {
      if (selectedPlayerIds.length >= 5) {
        alert('Máximo 5 jugadores permitidos por ronda.');
        return;
      }
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
      const playerObj = players.find((p) => p.id === playerId);
      if (playerObj) {
        setRoundHandicaps({
          ...roundHandicaps,
          [playerId]: playerObj.handicapIndex
        });
      }
    }
  };

  const handleRoundHandicapChange = (playerId: string, value: string) => {
    const num = parseInt(value, 10);
    const finalHcp = isNaN(num) ? 0 : num;
    setRoundHandicaps({
      ...roundHandicaps,
      [playerId]: finalHcp
    });
  };

  const isValidPlayerCount = selectedPlayerIds.length >= 3 && selectedPlayerIds.length <= 5;
  const isFormComplete = selectedCourseId && isValidPlayerCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) return;

    const config: RoundConfig = {
      courseId: selectedCourseId,
      playerIds: selectedPlayerIds,
      gameMode,
      percentage,
      startHole,
      roundHandicaps,
      activeBets
    };

    onStartRound(config);
  };

  const availablePercentages = [75, 80, 85, 90, 100];

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-emerald-700/30 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 uppercase tracking-wider">
            <Flag className="w-3.5 h-3.5 text-amber-300" />
            Configuración de Ronda
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Nueva Partida de Golf</h2>
          <p className="text-emerald-100 text-sm max-w-md">
            Selecciona el campo, añade de 3 a 5 jugadores, ajusta sus hándicaps y selecciona las apuestas activas para esta partida.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
        {/* 1. Selección de Campo de Golf */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Campo de Golf
            </span>
            <span className="text-amber-600 flex items-center gap-1 text-[11px] font-medium">
              <Star className="w-3.5 h-3.5 fill-current" /> Favorito por defecto
            </span>
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            required
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm transition-all"
          >
            {courses.length === 0 ? (
              <option value="">No hay campos disponibles. Agrega uno en la sección Campos.</option>
            ) : (
              courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.isFavorite ? '⭐ ' : ''}{course.name} {course.location ? `(${course.location})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 2. Selección de Jugadores y Edición de Hándicap de Ronda */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Jugadores (Selecciona 3, 4 o 5)
            </label>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                isValidPlayerCount
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {selectedPlayerIds.length} seleccionados {isValidPlayerCount ? '✓' : '(Mín. 3, Máx. 5)'}
            </span>
          </div>

          {players.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>No hay jugadores registrados. Agrega jugadores en la pestaña Jugadores.</span>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto pr-1 space-y-2.5 border border-slate-200 p-3 rounded-2xl bg-slate-50/50">
              {[...players]
                .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
                .map((player) => {
                const isSelected = selectedPlayerIds.includes(player.id);
                const currentRoundHcp = roundHandicaps[player.id] !== undefined ? roundHandicaps[player.id] : player.handicapIndex;

                return (
                  <div
                    key={player.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      onClick={() => handleTogglePlayer(player.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                            isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300 text-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900 text-sm">{player.name}</p>
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {player.initials}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">Hcp registrado: {player.handicapIndex}</p>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="pl-7 pt-1 flex items-center justify-between gap-3 border-t border-emerald-200/60 mt-2">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          Hcp para esta ronda:
                        </span>
                        <input
                          type="number"
                          step="1"
                          value={currentRoundHcp}
                          onChange={(e) => handleRoundHandicapChange(player.id, e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-20 px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-center font-black text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!isValidPlayerCount && (
            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Debes seleccionar exactamente 3, 4 o 5 jugadores para iniciar la ronda.
            </p>
          )}
        </div>

        {/* 3. Apuestas Activas en la Ronda */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Apuestas Activas en la Ronda
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'sindicato', label: 'Sindicato', icon: Trophy, color: 'text-amber-500' },
              { key: 'parejas', label: 'Parejas', icon: Users, color: 'text-emerald-600' },
              { key: 'individuales', label: 'Individuales', icon: Sparkles, color: 'text-purple-600' },
              { key: 'match', label: 'Match Play', icon: Swords, color: 'text-rose-600' },
              { key: 'perifericos', label: 'Periféricos', icon: DollarSign, color: 'text-emerald-600' },
              { key: 'monedas', label: 'Monedas', icon: Award, color: 'text-amber-500' },
            ].map((bet) => {
              const isChecked = activeBets[bet.key as keyof typeof activeBets] !== false;
              const Icon = bet.icon;
              return (
                <div
                  key={bet.key}
                  onClick={() => handleToggleBet(bet.key as keyof typeof activeBets)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isChecked ? 'bg-emerald-50/60 border-emerald-300 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${bet.color}`} />
                    <span className="text-xs font-bold">{bet.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 pointer-events-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Modalidad de Juego (Contra la base o Contra el Campo) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Modalidad de Juego
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleGameModeChange('contra_base')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                gameMode === 'contra_base'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="text-sm">Contra la base</div>
              <div className="text-xs text-slate-500 font-normal mt-0.5">Referencia al menor hándicap</div>
            </button>

            <button
              type="button"
              onClick={() => handleGameModeChange('contra_campo')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                gameMode === 'contra_campo'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="text-sm">Contra el Campo</div>
              <div className="text-xs text-slate-500 font-normal mt-0.5">Hándicap completo</div>
            </button>
          </div>
        </div>

        {/* 5. Porcentaje */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-emerald-600" />
            Porcentaje de Hándicap ({percentage}%)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {availablePercentages.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setPercentage(pct)}
                className={`py-2.5 rounded-2xl border text-sm font-bold transition-all cursor-pointer ${
                  percentage === pct
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            {gameMode === 'contra_base'
              ? 'Predeterminado para Contra la base: 75%.'
              : 'Predeterminado para Contra el Campo: 100%.'}
          </p>
        </div>

        {/* 6. Hoyo de Salida (Hoyo 1 o Hoyo 10) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Hoyo de Salida
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStartHole(1)}
              className={`p-3 rounded-2xl border text-center transition-all text-sm cursor-pointer ${
                startHole === 1
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              Comenzar por Hoyo 1
            </button>
            <button
              type="button"
              onClick={() => setStartHole(10)}
              className={`p-3 rounded-2xl border text-center transition-all text-sm cursor-pointer ${
                startHole === 10
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              Comenzar por Hoyo 10
            </button>
          </div>
        </div>

        {/* Botón Iniciar */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={!isFormComplete}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
              isFormComplete
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-98 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Iniciar Ronda</span>
          </button>
          {!isFormComplete && (
            <p className="text-xs text-center text-slate-400 mt-2">
              Selecciona un campo de golf y entre 3 y 5 jugadores para habilitar el botón.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
