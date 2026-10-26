import React, { useState } from 'react';
import { GolfCourse, Player, Round } from '../types';
import { getSortedRoundPlayers } from '../utils/golfCalculations';
import { ArrowLeft, Award, Trophy, Check, Edit2, Users } from 'lucide-react';

interface MonedasViewProps {
  round: Round;
  course: GolfCourse;
  roundPlayers: Player[];
  onUpdateRound?: (updatedRound: Round) => void;
  onBack: () => void;
}

export const MonedasView: React.FC<MonedasViewProps> = ({
  round,
  course,
  roundPlayers,
  onUpdateRound,
  onBack
}) => {
  const sortedPlayers = getSortedRoundPlayers(roundPlayers, round.config);

  // Participation: default all to true if not set
  const participation = round.monedasParticipation || round.medallasParticipation || {};
  const isPlaying = (pId: string) => participation[pId] !== false;

  const toggleParticipation = (pId: string) => {
    if (!onUpdateRound) return;
    const updated = {
      ...participation,
      [pId]: !isPlaying(pId)
    };
    onUpdateRound({
      ...round,
      monedasParticipation: updated,
      medallasParticipation: updated
    });
  };

  // Counts per player
  const counts = round.monedasCounts || round.medallasCounts || {};
  const getCounts = (pId: string) => {
    return counts[pId] || { agua: 0, bunker: 0, calle: 0, triputt: 0, special: 0 };
  };

  // Edit mode state per player
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [tempCounts, setTempCounts] = useState<Record<string, { agua: number; bunker: number; calle: number; triputt: number; special: number }>>({});

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
      monedasCounts: newCounts,
      medallasCounts: newCounts
    });
    setEditingPlayerId(null);
  };

  // Calculate settlement points for each player (-5p for Agua, Bunker, Calle, Tri-Putt; +5p for Special)
  const calculatePoints = () => {
    const activePlayers = sortedPlayers.filter((p) => isPlaying(p.id));
    const numActive = activePlayers.length;

    const pointsMap: Record<string, number> = {};
    sortedPlayers.forEach((p) => {
      pointsMap[p.id] = 0;
    });

    if (numActive <= 1) return pointsMap;

    const playerBalances: Record<string, number> = {};
    sortedPlayers.forEach((p) => {
      playerBalances[p.id] = 0;
    });

    activePlayers.forEach((p) => {
      const c = getCounts(p.id);

      const negCount = c.agua + c.bunker + c.calle + c.triputt;
      if (negCount > 0) {
        playerBalances[p.id] += negCount * (-5) * (numActive - 1);
        activePlayers.forEach((other) => {
          if (other.id !== p.id) {
            playerBalances[other.id] += negCount * 5;
          }
        });
      }

      if (c.special > 0) {
        playerBalances[p.id] += c.special * 5 * (numActive - 1);
        activePlayers.forEach((other) => {
          if (other.id !== p.id) {
            playerBalances[other.id] += c.special * (-5);
          }
        });
      }
    });

    sortedPlayers.forEach((p) => {
      pointsMap[p.id] = isPlaying(p.id) ? playerBalances[p.id] : 0;
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
            <Award className="w-5 h-5 text-amber-500" />
            Apuesta Monedas — {course.name}
          </h2>
          <p className="text-xs text-slate-500">
            Agua (-5p), Bunker (-5p), Calle (-5p), Tri-Putt (-5p), Special (+5p)
          </p>
        </div>
      </div>

      {/* Participation Selector Row */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            Participantes en Monedas (Marcar para incluir)
          </h3>
          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full">
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
                    ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                    : 'bg-slate-50 text-slate-400 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-extrabold text-xs">{p.name}</span>
                  <span className="text-[10px] font-semibold">{p.initials}</span>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                  active ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-slate-300 text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Monedas Management Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 text-white p-4 font-bold text-sm flex justify-between items-center">
          <span>Registro de Monedas</span>
          <span className="text-xs bg-slate-800 px-3 py-1 rounded-xl">Agua/Bunker/Calle/Tri-Putt: -5p | Special: +5p</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="bg-slate-200 text-slate-800 border-b border-slate-300">
                <th className="py-3 px-3 text-left font-bold">Jugador</th>
                <th className="py-3 px-2 font-bold">Agua <span className="text-[10px] text-rose-600">(-5p)</span></th>
                <th className="py-3 px-2 font-bold">Bunker <span className="text-[10px] text-rose-600">(-5p)</span></th>
                <th className="py-3 px-2 font-bold">Calle <span className="text-[10px] text-rose-600">(-5p)</span></th>
                <th className="py-3 px-2 font-bold">Tri-Putt <span className="text-[10px] text-rose-600">(-5p)</span></th>
                <th className="py-3 px-2 font-bold">Special <span className="text-[10px] text-emerald-700">(+5p)</span></th>
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

                    {/* Agua */}
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={pCounts.agua === 0 ? '' : pCounts.agua}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateTempCount(p.id, 'agua', isNaN(val) ? 0 : val);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-14 text-center font-bold border rounded-lg p-1 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{pCounts.agua === 0 ? '-' : pCounts.agua}</span>
                      )}
                    </td>

                    {/* Bunker */}
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={pCounts.bunker === 0 ? '' : pCounts.bunker}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateTempCount(p.id, 'bunker', isNaN(val) ? 0 : val);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-14 text-center font-bold border rounded-lg p-1 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{pCounts.bunker === 0 ? '-' : pCounts.bunker}</span>
                      )}
                    </td>

                    {/* Calle */}
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={pCounts.calle === 0 ? '' : pCounts.calle}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateTempCount(p.id, 'calle', isNaN(val) ? 0 : val);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-14 text-center font-bold border rounded-lg p-1 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{pCounts.calle === 0 ? '-' : pCounts.calle}</span>
                      )}
                    </td>

                    {/* Tri-Putt */}
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={pCounts.triputt === 0 ? '' : pCounts.triputt}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateTempCount(p.id, 'triputt', isNaN(val) ? 0 : val);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-14 text-center font-bold border rounded-lg p-1 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{pCounts.triputt === 0 ? '-' : pCounts.triputt}</span>
                      )}
                    </td>

                    {/* Special */}
                    <td className="py-3 px-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={pCounts.special === 0 ? '' : pCounts.special}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateTempCount(p.id, 'special', isNaN(val) ? 0 : val);
                          }}
                          onFocus={(e) => e.target.select()}
                          className="w-14 text-center font-bold border rounded-lg p-1 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{pCounts.special === 0 ? '-' : pCounts.special}</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center">
                      {active ? (
                        isEditing ? (
                          <button
                            type="button"
                            onClick={() => confirmEditing(p.id)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-xs"
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
            Cuadro Resumen Final — Monedas
          </h3>
          <span className="text-xs bg-amber-500/25 text-amber-300 font-bold px-3 py-1 rounded-full border border-amber-500/30">
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
                    <div>• Monedas: Agua:{c.agua === 0 ? '-' : c.agua} | Bnk:{c.bunker === 0 ? '-' : c.bunker} | Cll:{c.calle === 0 ? '-' : c.calle} | Tri:{c.triputt === 0 ? '-' : c.triputt} | Spc:{c.special === 0 ? '-' : c.special}</div>
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
