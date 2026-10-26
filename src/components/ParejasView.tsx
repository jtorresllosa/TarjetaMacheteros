import React, { useState } from 'react';
import { GolfCourse, Player, Round } from '../types';
import { Users, ArrowLeft, Trophy, Check } from 'lucide-react';
import { getRotations, calculateHolePairPoints, ParejasMode, getPairScoreDisplay } from '../utils/parejasCalculations';
import { getSortedRoundPlayers } from '../utils/golfCalculations';

interface ParejasViewProps {
  round: Round;
  course: GolfCourse;
  roundPlayers: Player[];
  onUpdateRound?: (updatedRound: Round) => void;
  onBack: () => void;
}

export const ParejasView: React.FC<ParejasViewProps> = ({
  round,
  course,
  roundPlayers,
  onUpdateRound,
  onBack
}) => {
  const sortedPlayers = getSortedRoundPlayers(roundPlayers, round.config);
  const rotations = getRotations(round.config.startHole, roundPlayers.length);

  const [mode, setMode] = useState<ParejasMode>('low_high');
  const [activeRotationIndex, setActiveRotationIndex] = useState(0);

  // Pair configuration state per rotation, chosen by the user
  const [rotationPairs, setRotationPairs] = useState<Record<number, { pair1: string[]; pair2: string[] }>>(() => {
    if (round.parejasConfig) {
      return round.parejasConfig;
    }
    return {};
  });

  const updateRotationPairs = (newPairs: Record<number, { pair1: string[]; pair2: string[] }>) => {
    setRotationPairs(newPairs);
    if (onUpdateRound) {
      onUpdateRound({
        ...round,
        parejasConfig: newPairs
      });
    }
  };

  const currentRotation = rotations[activeRotationIndex];
  const currentPairs = rotationPairs[activeRotationIndex] || { pair1: [], pair2: [] };

  const getPlayerInitials = (ids: string[]) => {
    if (!ids || ids.length === 0) return 'Por definir';
    return ids.map((id) => roundPlayers.find((p) => p.id === id)?.initials || id.slice(0, 3).toUpperCase()).join(' & ');
  };

  // Handlers for user choice of pairs in the active rotation
  const handleSelectPair1 = (selectedIds: string[]) => {
    const p1Ids = selectedIds;
    const p2Ids = sortedPlayers.filter((p) => !p1Ids.includes(p.id)).map((p) => p.id);

    const updated = {
      ...rotationPairs,
      [activeRotationIndex]: {
        pair1: p1Ids,
        pair2: p2Ids
      }
    };
    updateRotationPairs(updated);
  };

  const handleTogglePlayerSelection = (playerId: string) => {
    const requiredPair1Size = sortedPlayers.length === 3 ? 1 : 2;
    const currentPair1 = [...currentPairs.pair1];

    let newPair1: string[];
    if (currentPair1.includes(playerId)) {
      newPair1 = currentPair1.filter((id) => id !== playerId);
    } else {
      if (currentPair1.length >= requiredPair1Size) {
        newPair1 = [playerId];
      } else {
        newPair1 = [...currentPair1, playerId];
      }
    }
    handleSelectPair1(newPair1);
  };

  const isConfigured = currentPairs.pair1.length > 0 && currentPairs.pair2.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Apuesta Parejas — {course.name}
          </h2>
          <p className="text-xs text-slate-500">
            Jugadores: {sortedPlayers.map((p) => p.name).join(', ')}
          </p>
        </div>

        {/* Modalidad Selector */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <span className="text-xs font-bold text-slate-600 px-2">Modalidad:</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as ParejasMode)}
            className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="low_high">Baja/Alta (Default)</option>
            <option value="best_ball">Best Ball</option>
            <option value="sum_net">Suma de Scores Netos</option>
          </select>
        </div>
      </div>

      {/* Rotations Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {rotations.map((rot, idx) => {
          const hasConfig = rotationPairs[idx]?.pair1?.length > 0;
          return (
            <button
              key={rot.id}
              type="button"
              onClick={() => setActiveRotationIndex(idx)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                activeRotationIndex === idx
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>{rot.name}</span>
              {hasConfig && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
            </button>
          );
        })}
      </div>

      {/* Rotation Details & Pair Customization */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 text-sm">Configuración de Parejas • {currentRotation.name}</h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
              {sortedPlayers.length} Jugadores
            </span>
          </div>

          {/* User Pair Selection UI */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 block">
              Elige las parejas de cada rotación:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {sortedPlayers.map((p) => {
                const isSelected = currentPairs.pair1.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleTogglePlayerSelection(p.id)}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
            <span>Pareja 1: <strong className="text-emerald-700">{getPlayerInitials(currentPairs.pair1)}</strong></span>
            <span>vs</span>
            <span>Pareja 2: <strong className="text-slate-800">{getPlayerInitials(currentPairs.pair2)}</strong></span>
          </div>
        </div>

        {/* Holes Table for Current Rotation */}
        {isConfigured ? (
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-800 border-b border-slate-300">
                  <th className="py-2.5 px-3 text-left font-bold">Hoyo</th>
                  <th className="py-2.5 px-3 font-bold">Par</th>
                  <th className="py-2.5 px-3 font-bold">Pareja 1 ({getPlayerInitials(currentPairs.pair1)})</th>
                  <th className="py-2.5 px-3 font-bold">Pareja 2 ({getPlayerInitials(currentPairs.pair2)})</th>
                  <th className="py-2.5 px-3 font-bold">Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const byeState = round.parejasByeStates?.[activeRotationIndex];
                  
                  let byeHoleIdx = -1;
                  let reByeHoleIdx = -1;

                  let lastCompIdx = -1;
                  currentRotation.holes.forEach((hNum, hIdx) => {
                    const res = calculateHolePairPoints(hNum, currentPairs.pair1, currentPairs.pair2, round, roundPlayers, course, mode);
                    if (res.completed) {
                      lastCompIdx = hIdx;
                    }
                  });

                  if (lastCompIdx >= 0) {
                    let c1 = 0;
                    let c2 = 0;
                    for (let i = 0; i <= lastCompIdx; i++) {
                      const res = calculateHolePairPoints(currentRotation.holes[i], currentPairs.pair1, currentPairs.pair2, round, roundPlayers, course, mode);
                      if (res.completed) {
                        c1 += res.pair1Points;
                        c2 += res.pair2Points;
                        const lead = Math.abs(c1 - c2);
                        const rem = currentRotation.holes.length - (i + 1);
                        if (lead > rem * 2 && lead > 0 && byeHoleIdx === -1) {
                          if (byeState?.byeResolved && byeState?.byeAccepted) {
                            byeHoleIdx = i;
                            break;
                          }
                        }
                      }
                    }
                  }

                  if (byeHoleIdx >= 0 && byeState?.byeResolved && byeState?.byeAccepted) {
                    let rc1 = 0;
                    let rc2 = 0;
                    for (let i = byeHoleIdx + 1; i <= lastCompIdx; i++) {
                      const res = calculateHolePairPoints(currentRotation.holes[i], currentPairs.pair1, currentPairs.pair2, round, roundPlayers, course, mode);
                      if (res.completed) {
                        rc1 += res.pair1Points;
                        rc2 += res.pair2Points;
                        const lead = Math.abs(rc1 - rc2);
                        const rem = currentRotation.holes.length - (i + 1);
                        if (lead > rem * 2 && lead > 0) {
                          if (byeState?.rebyeResolved && byeState?.rebyeAccepted) {
                            reByeHoleIdx = i;
                            break;
                          }
                        }
                      }
                    }
                  }

                  let winningHoleIdx = -1;
                  if (reByeHoleIdx >= 0) {
                    winningHoleIdx = reByeHoleIdx;
                  } else if (byeHoleIdx >= 0) {
                    winningHoleIdx = byeHoleIdx;
                  } else {
                    winningHoleIdx = lastCompIdx;
                  }

                  let cumulativeP1 = 0;
                  let cumulativeP2 = 0;

                  return currentRotation.holes.map((hNum, hIdx) => {
                    const holeData = course.holes.find((h) => h.number === hNum);
                    const result = calculateHolePairPoints(
                      hNum,
                      currentPairs.pair1,
                      currentPairs.pair2,
                      round,
                      roundPlayers,
                      course,
                      mode
                    );

                    if (byeHoleIdx >= 0 && hIdx === byeHoleIdx + 1) {
                      cumulativeP1 = 0;
                      cumulativeP2 = 0;
                    }
                    if (reByeHoleIdx >= 0 && hIdx === reByeHoleIdx + 1) {
                      cumulativeP1 = 0;
                      cumulativeP2 = 0;
                    }

                    if (result.completed) {
                      cumulativeP1 += result.pair1Points;
                      cumulativeP2 += result.pair2Points;
                    }

                    const diff = cumulativeP1 - cumulativeP2;
                    const diffStr = diff === 0 ? '0' : diff > 0 ? `+${diff}` : `${diff}`;

                    const p1ScoreDisplay = getPairScoreDisplay(currentPairs.pair1, hNum, round, roundPlayers, course);
                    const p2ScoreDisplay = getPairScoreDisplay(currentPairs.pair2, hNum, round, roundPlayers, course);

                    const isWinningHole = result.completed && hIdx === winningHoleIdx && (diff !== 0 || winningHoleIdx === lastCompIdx);

                    return (
                      <tr key={hNum} className={`hover:bg-slate-50 ${isWinningHole ? 'border-b-4 border-black font-bold bg-slate-100/80' : ''}`}>
                        <td className="py-3 px-3 text-left font-bold text-slate-900">
                          Hoyo {hNum}
                          {isWinningHole && (
                            <span className="ml-1 text-[9px] bg-black text-white px-1.5 py-0.5 rounded-full font-bold">Ganador</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-semibold">{holeData?.par || 4}</td>
                        <td className="py-3 px-3 text-slate-800 font-medium">
                          {result.completed ? (
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                {result.pair1Points} pts
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                                {p1ScoreDisplay}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium">
                          {result.completed ? (
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-sm font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                                {result.pair2Points} pts
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                                {p2ScoreDisplay}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className={`py-3 px-3 font-black text-slate-900 ${isWinningHole ? 'underline decoration-black decoration-2' : ''}`}>
                          {result.completed ? diffStr : '-'}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs font-semibold">
            Selecciona los jugadores de la Pareja 1 para visualizar la tarjeta y los resultados de esta rotación.
          </div>
        )}

        {/* Resultado de la Rotación (Suma Algebraica) */}
        {isConfigured && (() => {
          const getRotationSummary = () => {
            const byeState = round.parejasByeStates?.[activeRotationIndex];
            let byeHoleIdx = -1;
            let reByeHoleIdx = -1;
            let lastCompIdx = -1;

            currentRotation.holes.forEach((hNum, hIdx) => {
              const res = calculateHolePairPoints(hNum, currentPairs.pair1, currentPairs.pair2, round, roundPlayers, course, mode);
              if (res.completed) {
                lastCompIdx = hIdx;
              }
            });

            if (lastCompIdx >= 0) {
              let c1 = 0;
              let c2 = 0;
              for (let i = 0; i <= lastCompIdx; i++) {
                const res = calculateHolePairPoints(currentRotation.holes[i], currentPairs.pair1, currentPairs.pair2, round, roundPlayers, course, mode);
                if (res.completed) {
                  c1 += res.pair1Points;
                  c2 += res.pair2Points;
                  const lead = Math.abs(c1 - c2);
                  const rem = currentRotation.holes.length - (i + 1);
                  if (lead > rem * 2 && lead > 0 && byeHoleIdx === -1) {
                    if (byeState?.byeResolved && byeState?.byeAccepted) {
                      byeHoleIdx = i;
                      break;
                    }
                  }
                }
              }
            }

            if (byeHoleIdx >= 0 && byeState?.byeResolved && byeState?.byeAccepted) {
              let rc1 = 0;
              let rc2 = 0;
              for (let i = byeHoleIdx + 1; i <= lastCompIdx; i++) {
                const res = calculateHolePairPoints(currentRotation.holes[i], currentPairs.pair1, currentPairs.pair2, round, roundPlayers, course, mode);
                if (res.completed) {
                  rc1 += res.pair1Points;
                  rc2 += res.pair2Points;
                  const lead = Math.abs(rc1 - rc2);
                  const rem = currentRotation.holes.length - (i + 1);
                  if (lead > rem * 2 && lead > 0) {
                    if (byeState?.rebyeResolved && byeState?.rebyeAccepted) {
                      reByeHoleIdx = i;
                      break;
                    }
                  }
                }
              }
            }

            let seg1P1 = 0, seg1P2 = 0;
            let seg2P1 = 0, seg2P2 = 0;
            let seg3P1 = 0, seg3P2 = 0;

            currentRotation.holes.forEach((hNum, hIdx) => {
              const res = calculateHolePairPoints(hNum, currentPairs.pair1, currentPairs.pair2, round, roundPlayers, course, mode);
              if (res.completed) {
                if (byeHoleIdx >= 0 && hIdx > byeHoleIdx) {
                  if (reByeHoleIdx >= 0 && hIdx > reByeHoleIdx) {
                    seg3P1 += res.pair1Points;
                    seg3P2 += res.pair2Points;
                  } else {
                    seg2P1 += res.pair1Points;
                    seg2P2 += res.pair2Points;
                  }
                } else {
                  seg1P1 += res.pair1Points;
                  seg1P2 += res.pair2Points;
                }
              }
            });

            const mainWinner = seg1P1 > seg1P2 ? 1 : seg1P2 > seg1P1 ? 2 : 0;
            const mainP1Pts = mainWinner === 1 ? 10 : mainWinner === 2 ? -10 : 0;
            const mainP2Pts = mainWinner === 2 ? 10 : mainWinner === 1 ? -10 : 0;

            let byeP1Pts = 0;
            let byeP2Pts = 0;
            const byeValue = byeState?.byeLeonAccepted ? 10 : 5;
            if (byeHoleIdx >= 0 && byeState?.byeResolved && byeState?.byeAccepted) {
              const byeDiff = seg2P1 - seg2P2;
              const byeWinner = byeDiff > 0 ? 1 : byeDiff < 0 ? 2 : 0;
              if (byeWinner === 1) {
                byeP1Pts = byeValue;
                byeP2Pts = -byeValue;
              } else if (byeWinner === 2) {
                byeP1Pts = -byeValue;
                byeP2Pts = byeValue;
              } else {
                byeP1Pts = 0;
                byeP2Pts = 0;
              }
            }

            let reByeP1Pts = 0;
            let reByeP2Pts = 0;
            const reByeValue = byeState?.rebyeLeonAccepted ? 10 : 5;
            if (reByeHoleIdx >= 0 && byeState?.byeResolved && byeState?.byeAccepted && byeState?.rebyeResolved && byeState?.rebyeAccepted) {
              const reByeDiff = seg3P1 - seg3P2;
              const reByeWinner = reByeDiff > 0 ? 1 : reByeDiff < 0 ? 2 : 0;
              if (reByeWinner === 1) {
                reByeP1Pts = reByeValue;
                reByeP2Pts = -reByeValue;
              } else if (reByeWinner === 2) {
                reByeP1Pts = -reByeValue;
                reByeP2Pts = reByeValue;
              } else {
                reByeP1Pts = 0;
                reByeP2Pts = 0;
              }
            }

            const finalAlgebraicP1 = mainP1Pts + byeP1Pts + reByeP1Pts;
            const finalAlgebraicP2 = mainP2Pts + byeP2Pts + reByeP2Pts;

            return {
              lastCompIdx,
              mainP1Pts,
              mainP2Pts,
              byeResolved: byeHoleIdx >= 0 && byeState?.byeResolved && byeState?.byeAccepted,
              byeValue,
              byeP1Pts,
              byeP2Pts,
              reByeResolved: reByeHoleIdx >= 0 && byeState?.byeResolved && byeState?.byeAccepted && byeState?.rebyeResolved && byeState?.rebyeAccepted,
              reByeValue,
              reByeP1Pts,
              reByeP2Pts,
              finalAlgebraicP1,
              finalAlgebraicP2
            };
          };

          const summary = getRotationSummary();
          if (summary.lastCompIdx === -1) return null;

          const p1Initials = getPlayerInitials(currentPairs.pair1);
          const p2Initials = getPlayerInitials(currentPairs.pair2);

          return (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg space-y-4 mt-6">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  Resultado Final de la Rotación — {currentRotation.name}
                </h3>
                <span className="text-xs bg-emerald-500/25 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                  Suma Algebraica
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Pareja 1 */}
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-200">
                    <span>Pareja 1 ({p1Initials})</span>
                    <span className={`text-sm font-black ${summary.finalAlgebraicP1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {summary.finalAlgebraicP1 > 0 ? `+${summary.finalAlgebraicP1}` : summary.finalAlgebraicP1} pts
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>• Pareja principal: {summary.mainP1Pts >= 0 ? `+${summary.mainP1Pts}` : summary.mainP1Pts} pts</div>
                    {summary.byeResolved && (
                      <div>• Bye ({summary.byeValue} pts): {summary.byeP1Pts >= 0 ? `+${summary.byeP1Pts}` : summary.byeP1Pts} pts</div>
                    )}
                    {summary.reByeResolved && (
                      <div>• ReBye ({summary.reByeValue} pts): {summary.reByeP1Pts >= 0 ? `+${summary.reByeP1Pts}` : summary.reByeP1Pts} pts</div>
                    )}
                  </div>
                </div>

                {/* Pareja 2 */}
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-200">
                    <span>Pareja 2 ({p2Initials})</span>
                    <span className={`text-sm font-black ${summary.finalAlgebraicP2 >= 0 ? 'text-emerald-400' : 'text-rose-600'}`}>
                      {summary.finalAlgebraicP2 > 0 ? `+${summary.finalAlgebraicP2}` : summary.finalAlgebraicP2} pts
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>• Pareja principal: {summary.mainP2Pts >= 0 ? `+${summary.mainP2Pts}` : summary.mainP2Pts} pts</div>
                    {summary.byeResolved && (
                      <div>• Bye ({summary.byeValue} pts): {summary.byeP2Pts >= 0 ? `+${summary.byeP2Pts}` : summary.byeP2Pts} pts</div>
                    )}
                    {summary.reByeResolved && (
                      <div>• ReBye ({summary.reByeValue} pts): {summary.reByeP2Pts >= 0 ? `+${summary.reByeP2Pts}` : summary.reByeP2Pts} pts</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
