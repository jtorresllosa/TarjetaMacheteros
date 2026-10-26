import React, { useState } from 'react';
import { GolfCourse, Player, Round } from '../types';
import { getSortedRoundPlayers } from '../utils/golfCalculations';
import { ArrowLeft, DollarSign, Trophy, Check, Edit2, Users } from 'lucide-react';

interface PerifericosViewProps {
  round: Round;
  course: GolfCourse;
  roundPlayers: Player[];
  onUpdateRound?: (updatedRound: Round) => void;
  onBack: () => void;
}

export const PerifericosView: React.FC<PerifericosViewProps> = ({
  round,
  course,
  roundPlayers,
  onUpdateRound,
  onBack
}) => {
  const sortedPlayers = getSortedRoundPlayers(roundPlayers, round.config);

  // Participation: default all to true if not set
  const participation = round.perifericosParticipation || {};
  const isPlaying = (pId: string) => participation[pId] !== false;

  const toggleParticipation = (pId: string) => {
    if (!onUpdateRound) return;
    const updated = {
      ...participation,
      [pId]: !isPlaying(pId)
    };
    onUpdateRound({
      ...round,
      perifericosParticipation: updated
    });
  };

  // Counts per player
  const counts = round.perifericosCounts || {};
  const getCounts = (pId: string) => {
    return counts[pId] || { greenie: 0, birdie: 0, sandy: 0, aguila: 0, ppun: 0 };
  };

  // Edit mode state per player
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [tempCounts, setTempCounts] = useState<Record<string, { greenie: number; birdie: number; sandy: number; aguila: number; ppun: number }>>({});

  const startEditing = (pId: string) => {
    setEditingPlayerId(pId);
    setTempCounts({
      ...tempCounts,
      [pId]: { ...getCounts(pId) }
    });
  };

  const updateTempCount = (pId: string, field: keyof ReturnType<typeof getCounts>, val: number) => {
    const current = tempCounts[pId] || getCounts(pId);
    setTempCounts({
      ...tempCounts,
      [pId]: {
        ...current,
        [field]: Math.max(0, val)
      }
    });
  };

  const confirmEditing = (pId: string) => {
    if (!onUpdateRound) return;
    const newCounts = {
      ...counts,
      [pId]: tempCounts[pId] || getCounts(pId)
    };
    onUpdateRound({
      ...round,
      perifericosCounts: newCounts
    });
    setEditingPlayerId(null);
  };

  // Point values
  const VALUES = {
    greenie: 3,
    sandy: 3,
    ppun: 3,
    birdie: 5,
    aguila: 10
  };

  // Calculate settlement points for each player
  const calculatePoints = () => {
    const activePlayers = sortedPlayers.filter((p) => isPlaying(p.id));
    const numActive = activePlayers.length;

    const pointsMap: Record<string, number> = {};
    sortedPlayers.forEach((p) => {
      pointsMap[p.id] = 0;
    });

    if (numActive <= 1) return pointsMap;

    const playerEarnings: Record<string, number> = {};
    sortedPlayers.forEach((p) => {
      if (!isPlaying(p.id)) {
        playerEarnings[p.id] = 0;
        return;
      }
      const c = getCounts(p.id);
      const earned =
        c.greenie * VALUES.greenie +
        c.sandy * VALUES.sandy +
        c.ppun * VALUES.ppun +
        c.birdie * VALUES.birdie +
        c.aguila * VALUES.aguila;
      playerEarnings[p.id] = earned;
    });

    sortedPlayers.forEach((p) => {
      if (!isPlaying(p.id)) {
        pointsMap[p.id] = 0;
        return;
      }
      const myEarned = playerEarnings[p.id];
      const othersEarnedSum = activePlayers
        .filter((other) => other.id !== p.id)
        .reduce((acc, other) => acc + playerEarnings[other.id], 0);

      pointsMap[p.id] = myEarned * (numActive - 1) - othersEarnedSum;
    });

    return pointsMap;
  };

  const points = calculatePoints();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Apuesta Periféricos — {course.name}
          </h2>
          <p className="text-xs text-slate-500">
            Greenies (3p), Sandy (3p), P/Pun (3p), Birdie (5p), Águila (10p)
          </p>
        </div>
      </div>

      {/* Participation Selector Row */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Participantes en Periféricos (Marcar para incluir)
          </h3>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
            {sortedPlayers.filter((p) => isPlaying(p.id)).length} de {sortedPlayers.length} activos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {sortedPlayers.map((p) => {
            const active = isPlaying(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleParticipation(p.id)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  active
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs'
                    : 'bg-slate-50 text-slate-400 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-extrabold text-xs">{p.name}</span>
                  <span className="text-[10px] font-semibold">{p.initials}</span>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                  active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300 text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Peripherals Management Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 text-white p-4 font-bold text-sm flex justify-between items-center">
          <span>Registro de Periféricos</span>
          <span className="text-xs bg-slate-800 px-3 py-1 rounded-xl">Greenie/Sandy/P.Pun: 3p | Birdie: 5p | Águila: 10p</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="bg-slate-200 text-slate-800 border-b border-slate-300">
                <th className="py-3 px-3 text-left font-bold">Jugador</th>
                <th className="py-3 px-2 font-bold">Greenie <span className="text-[10px] text-slate-500">(3p)</span></th>
                <th className="py-3 px-2 font-bold">Sandy <span className="text-[10px] text-slate-500">(3p)</span></th>
                <th className="py-3 px-2 font-bold">P/Pun <span className="text-[10px] text-slate-500">(3p)</span></th>
                <th className="py-3 px-2 font-bold">Birdie <span className="text-[10px] text-slate-500">(5p)</span></th>
                <th className="py-3 px-2 font-bold">Águila <span className="text-[10px] text-slate-500">(10p)</span></th>
                <th className="py-3 px-3 font-bold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPlayers.map((p) => {
                const active = isPlaying(p.id);
                const isEditing = editingPlayerId === p.id;
                const pCounts = isEditing ? (tempCounts[p.id] || getCounts(p.id)) : getCounts(p.id);

                return (
                  <tr key={p.id} className={`hover:bg-slate-50 ${!active ? 'opacity-40 bg-slate-50/50' : ''}`}>
                    <td className="py-3 px-3 text-left font-bold text-slate-900">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{active ? 'Jugando' : 'No participa'}</div>
                    </td>

                    {/* Greenie */}
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={pCounts.greenie === 0 ? '' : pCounts.greenie}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateTempCount(p.id, 'greenie', isNaN(val) ? 0 : val);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-14 text-center font-bold border rounded-lg p-1 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{pCounts.greenie === 0 ? '-' : pCounts.greenie}</span>
                      )}
                    </td>

                    {/* Sandy */}
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={pCounts.sandy === 0 ? '' : pCounts.sandy}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateTempCount(p.id, 'sandy', isNaN(val) ? 0 : val);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-14 text-center font-bold border rounded-lg p-1 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{pCounts.sandy === 0 ? '-' : pCounts.sandy}</span>
                      )}
                    </td>

                    {/* P/Pun */}
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={pCounts.ppun === 0 ? '' : pCounts.ppun}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateTempCount(p.id, 'ppun', isNaN(val) ? 0 : val);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-14 text-center font-bold border rounded-lg p-1 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{pCounts.ppun === 0 ? '-' : pCounts.ppun}</span>
                      )}
                    </td>

                    {/* Birdie */}
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={pCounts.birdie === 0 ? '' : pCounts.birdie}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateTempCount(p.id, 'birdie', isNaN(val) ? 0 : val);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-14 text-center font-bold border rounded-lg p-1 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{pCounts.birdie === 0 ? '-' : pCounts.birdie}</span>
                      )}
                    </td>

                    {/* Águila */}
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={pCounts.aguila === 0 ? '' : pCounts.aguila}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateTempCount(p.id, 'aguila', isNaN(val) ? 0 : val);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-14 text-center font-bold border rounded-lg p-1 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{pCounts.aguila === 0 ? '-' : pCounts.aguila}</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center">
                      {active ? (
                        isEditing ? (
                          <button
                            type="button"
                            onClick={() => confirmEditing(p.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditing(p.id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">No participa</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Cuadro Resumen Final — Periféricos
          </h3>
          <span className="text-xs bg-emerald-500/25 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
            Cálculo Cero-Suma
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedPlayers.map((p) => {
            const active = isPlaying(p.id);
            const pPts = points[p.id] || 0;
            const c = getCounts(p.id);

            return (
              <div key={p.id} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-200">
                  <span>{p.name} ({p.initials})</span>
                  <span className={`text-sm font-black ${pPts >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pPts > 0 ? `+${pPts}` : pPts} pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>• Estado: {active ? 'Participando' : 'No participa'}</div>
                  {active && (
                    <div>• Periféricos: G:{c.greenie === 0 ? '-' : c.greenie} | S:{c.sandy === 0 ? '-' : c.sandy} | P:{c.ppun === 0 ? '-' : c.ppun} | B:{c.birdie === 0 ? '-' : c.birdie} | A:{c.aguila === 0 ? '-' : c.aguila}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
