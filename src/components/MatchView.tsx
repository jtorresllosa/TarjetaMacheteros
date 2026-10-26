import React from 'react';
import { GolfCourse, Player, Round } from '../types';
import { calculatePlayerHoleStrokes, calculateNetScore, getSortedRoundPlayers } from '../utils/golfCalculations';
import { ArrowLeft, Swords, Trophy, Check } from 'lucide-react';

interface MatchViewProps {
  round: Round;
  course: GolfCourse;
  roundPlayers: Player[];
  onBack: () => void;
}

export const MatchView: React.FC<MatchViewProps> = ({
  round,
  course,
  roundPlayers,
  onBack
}) => {
  const sortedPlayers = getSortedRoundPlayers(roundPlayers, round.config);
  const numPlayers = sortedPlayers.length;

  const isStartHole10 = round.config.startHole === 10;
  const first9Holes = isStartHole10
    ? Array.from({ length: 9 }, (_, i) => i + 10)
    : Array.from({ length: 9 }, (_, i) => i + 1);

  const second9Holes = isStartHole10
    ? Array.from({ length: 9 }, (_, i) => i + 1)
    : Array.from({ length: 9 }, (_, i) => i + 10);

  const playerStrokesMap: Record<string, Record<number, number>> = {};
  roundPlayers.forEach((p) => {
    playerStrokesMap[p.id] = calculatePlayerHoleStrokes(p, roundPlayers, course, round.config);
  });

  const getPlayerHoleNet = (playerId: string, holeNumber: number) => {
    const gross = round.scores[playerId]?.[holeNumber];
    if (gross === undefined || gross === null || isNaN(gross)) return null;
    const strokes = playerStrokesMap[playerId]?.[holeNumber] || 0;
    const net = calculateNetScore(gross, strokes);
    return { gross, net };
  };

  const getHoleWinners = (holeNumber: number) => {
    let minNet = Infinity;
    const candidates: string[] = [];

    sortedPlayers.forEach((p) => {
      const res = getPlayerHoleNet(p.id, holeNumber);
      if (res && res.net !== null) {
        if (res.net < minNet) {
          minNet = res.net;
          candidates.length = 0;
          candidates.push(p.id);
        } else if (res.net === minNet) {
          candidates.push(p.id);
        }
      }
    });

    if (minNet === Infinity) return [];
    return candidates;
  };

  const calculateMatchResults = () => {
    const firstHalfHoles = first9Holes;
    const secondHalfHoles = second9Holes;

    const firstHalfWins: Record<string, number> = {};
    const secondHalfWins: Record<string, number> = {};
    const totalWins: Record<string, number> = {};

    sortedPlayers.forEach((p) => {
      firstHalfWins[p.id] = 0;
      secondHalfWins[p.id] = 0;
      totalWins[p.id] = 0;
    });

    firstHalfHoles.forEach((hNum) => {
      const winners = getHoleWinners(hNum);
      winners.forEach((pId) => {
        firstHalfWins[pId] = (firstHalfWins[pId] || 0) + 1;
        totalWins[pId] = (totalWins[pId] || 0) + 1;
      });
    });

    secondHalfHoles.forEach((hNum) => {
      const winners = getHoleWinners(hNum);
      winners.forEach((pId) => {
        secondHalfWins[pId] = (secondHalfWins[pId] || 0) + 1;
        totalWins[pId] = (totalWins[pId] || 0) + 1;
      });
    });

    const getTopWinners = (winsMap: Record<string, number>) => {
      let maxWins = -1;
      let topIds: string[] = [];
      sortedPlayers.forEach((p) => {
        const w = winsMap[p.id] || 0;
        if (w > maxWins) {
          maxWins = w;
          topIds = [p.id];
        } else if (w === maxWins) {
          topIds.push(p.id);
        }
      });
      return { topIds, maxWins };
    };

    const firstTop = getTopWinners(firstHalfWins);
    const secondTop = getTopWinners(secondHalfWins);
    const totalTop = getTopWinners(totalWins);

    const pointsFirst: Record<string, number> = {};
    const pointsSecond: Record<string, number> = {};
    const pointsTotal: Record<string, number> = {};

    sortedPlayers.forEach((p) => {
      pointsFirst[p.id] = 0;
      pointsSecond[p.id] = 0;
      pointsTotal[p.id] = 0;
    });

    if (numPlayers === 3) {
      let firstWinnerIds = firstTop.topIds;
      if (firstWinnerIds.length > 1) {
        const combinedWins: Record<string, number> = {};
        sortedPlayers.forEach((p) => {
          combinedWins[p.id] = (firstHalfWins[p.id] || 0) + (secondHalfWins[p.id] || 0);
        });
        let maxCombined = -1;
        let combinedTop: string[] = [];
        sortedPlayers.forEach((p) => {
          const cw = combinedWins[p.id];
          if (cw > maxCombined) {
            maxCombined = cw;
            combinedTop = [p.id];
          } else if (cw === maxCombined) {
            combinedTop.push(p.id);
          }
        });
        if (combinedTop.length === 1) {
          firstWinnerIds = combinedTop;
        } else {
          firstWinnerIds = [];
        }
      }

      if (firstWinnerIds.length === 1) {
        const wId = firstWinnerIds[0];
        sortedPlayers.forEach((p) => {
          pointsFirst[p.id] = p.id === wId ? 10 : -5;
        });
      } else {
        sortedPlayers.forEach((p) => { pointsFirst[p.id] = 0; });
      }

      let secondWinnerIds = secondTop.topIds;
      if (secondWinnerIds.length > 1) {
        secondWinnerIds = [];
      }
      if (secondWinnerIds.length === 1) {
        const wId = secondWinnerIds[0];
        sortedPlayers.forEach((p) => {
          pointsSecond[p.id] = p.id === wId ? 10 : -5;
        });
      } else {
        sortedPlayers.forEach((p) => { pointsSecond[p.id] = 0; });
      }

      let totalWinnerIds = totalTop.topIds;
      if (totalWinnerIds.length > 1) {
        totalWinnerIds = [];
      }
      if (totalWinnerIds.length === 1) {
        const wId = totalWinnerIds[0];
        sortedPlayers.forEach((p) => {
          pointsTotal[p.id] = p.id === wId ? 10 : -5;
        });
      } else {
        sortedPlayers.forEach((p) => { pointsTotal[p.id] = 0; });
      }
    } else if (numPlayers === 4) {
      let firstWinnerIds = firstTop.topIds;
      if (firstWinnerIds.length >= 3) {
        const combinedWins: Record<string, number> = {};
        sortedPlayers.forEach((p) => {
          combinedWins[p.id] = (firstHalfWins[p.id] || 0) + (secondHalfWins[p.id] || 0);
        });
        let maxC = -1;
        let cTop: string[] = [];
        sortedPlayers.forEach((p) => {
          const cw = combinedWins[p.id];
          if (cw > maxC) {
            maxC = cw;
            cTop = [p.id];
          } else if (cw === maxC) {
            cTop.push(p.id);
          }
        });
        firstWinnerIds = cTop.length === 1 ? cTop : [];
      }

      if (firstWinnerIds.length === 1) {
        const wId = firstWinnerIds[0];
        sortedPlayers.forEach((p) => {
          pointsFirst[p.id] = p.id === wId ? 15 : -5;
        });
      } else if (firstWinnerIds.length === 2) {
        sortedPlayers.forEach((p) => {
          pointsFirst[p.id] = firstWinnerIds.includes(p.id) ? 5 : -5;
        });
      } else {
        sortedPlayers.forEach((p) => { pointsFirst[p.id] = 0; });
      }

      let secondWinnerIds = secondTop.topIds;
      if (secondWinnerIds.length >= 3) {
        secondWinnerIds = [];
      }
      if (secondWinnerIds.length === 1) {
        const wId = secondWinnerIds[0];
        sortedPlayers.forEach((p) => {
          pointsSecond[p.id] = p.id === wId ? 15 : -5;
        });
      } else if (secondWinnerIds.length === 2) {
        sortedPlayers.forEach((p) => {
          pointsSecond[p.id] = secondWinnerIds.includes(p.id) ? 5 : -5;
        });
      } else {
        sortedPlayers.forEach((p) => { pointsSecond[p.id] = 0; });
      }

      let totalWinnerIds = totalTop.topIds;
      if (totalWinnerIds.length >= 3) {
        totalWinnerIds = [];
      }
      if (totalWinnerIds.length === 1) {
        const wId = totalWinnerIds[0];
        sortedPlayers.forEach((p) => {
          pointsTotal[p.id] = p.id === wId ? 15 : -5;
        });
      } else if (totalWinnerIds.length === 2) {
        sortedPlayers.forEach((p) => {
          pointsTotal[p.id] = totalWinnerIds.includes(p.id) ? 5 : -5;
        });
      } else {
        sortedPlayers.forEach((p) => { pointsTotal[p.id] = 0; });
      }
    } else if (numPlayers === 5) {
      const getHandicap = (pId: string) => {
        const p = sortedPlayers.find((x) => x.id === pId);
        return round.config.roundHandicaps?.[pId] !== undefined
          ? round.config.roundHandicaps[pId]
          : (p?.handicapIndex || 0);
      };

      const assignPointsForWinners = (winnerIds: string[]) => {
        const pMap: Record<string, number> = {};
        sortedPlayers.forEach((p) => {
          pMap[p.id] = winnerIds.includes(p.id) ? 0 : -5;
        });

        if (winnerIds.length === 1) {
          pMap[winnerIds[0]] = 20;
        } else if (winnerIds.length === 2) {
          const [id1, id2] = winnerIds;
          const hcp1 = getHandicap(id1);
          const hcp2 = getHandicap(id2);
          if (hcp1 < hcp2) {
            pMap[id1] = 8;
            pMap[id2] = 7;
          } else if (hcp2 < hcp1) {
            pMap[id2] = 8;
            pMap[id1] = 7;
          } else {
            pMap[id1] = 7.5;
            pMap[id2] = 7.5;
          }
        } else {
          sortedPlayers.forEach((p) => { pMap[p.id] = 0; });
        }
        return pMap;
      };

      let firstWinnerIds = firstTop.topIds;
      if (firstWinnerIds.length >= 3) {
        const combinedWins: Record<string, number> = {};
        sortedPlayers.forEach((p) => {
          combinedWins[p.id] = (firstHalfWins[p.id] || 0) + (secondHalfWins[p.id] || 0);
        });
        let maxC = -1;
        let cTop: string[] = [];
        sortedPlayers.forEach((p) => {
          const cw = combinedWins[p.id];
          if (cw > maxC) {
            maxC = cw;
            cTop = [p.id];
          } else if (cw === maxC) {
            cTop.push(p.id);
          }
        });
        firstWinnerIds = cTop.length <= 2 ? cTop : [];
      }
      const pFirst = assignPointsForWinners(firstWinnerIds);
      sortedPlayers.forEach((p) => { pointsFirst[p.id] = pFirst[p.id]; });

      const pSecond = assignPointsForWinners(secondTop.topIds.length >= 3 ? [] : secondTop.topIds);
      sortedPlayers.forEach((p) => { pointsSecond[p.id] = pSecond[p.id]; });

      const pTotal = assignPointsForWinners(totalTop.topIds.length >= 3 ? [] : totalTop.topIds);
      sortedPlayers.forEach((p) => { pointsTotal[p.id] = pTotal[p.id]; });
    }

    return {
      firstHalfWins,
      secondHalfWins,
      totalWins,
      pointsFirst,
      pointsSecond,
      pointsTotal
    };
  };

  const results = calculateMatchResults();

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Swords className="w-5 h-5 text-rose-600" />
            Apuesta Match Play — {course.name}
          </h2>
          <p className="text-xs text-slate-500">
            Modalidad Individual por Hoyos • {numPlayers} Jugadores
          </p>
        </div>
      </div>

      {/* Summary Points Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Resumen de Puntos Match
          </h3>
          <span className="text-xs bg-rose-500/25 text-rose-300 font-bold px-3 py-1 rounded-full border border-rose-500/30">
            {numPlayers} Jugadores
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedPlayers.map((p) => {
            const fPts = results.pointsFirst[p.id] || 0;
            const sPts = results.pointsSecond[p.id] || 0;
            const tPts = results.pointsTotal[p.id] || 0;
            const finalSum = fPts + sPts + tPts;

            return (
              <div key={p.id} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-200">
                  <span>{p.name}</span>
                  <span className={`text-sm font-black ${finalSum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {finalSum > 0 ? `+${finalSum}` : finalSum} pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>• 1ª Vuelta: {fPts >= 0 ? `+${fPts}` : fPts} pts ({results.firstHalfWins[p.id]} hoyos)</div>
                  <div>• 2ª Vuelta: {sPts >= 0 ? `+${sPts}` : sPts} pts ({results.secondHalfWins[p.id]} hoyos)</div>
                  <div>• Total: {tPts >= 0 ? `+${tPts}` : tPts} pts ({results.totalWins[p.id]} hoyos)</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tables for First Half and Second Half */}
      <div className="space-y-6">
        {/* First Half Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm flex justify-between items-center">
            <span>{isStartHole10 ? 'Primera Vuelta (Hoyos 10 al 18)' : 'Primera Vuelta (Hoyos 1 al 9)'}</span>
            <span className="text-xs bg-slate-800 px-3 py-1 rounded-xl">Ganadores por hoyo (Menor Neto)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-800 border-b border-slate-300">
                  <th className="py-2.5 px-3 text-left font-bold">Hoyo</th>
                  <th className="py-2.5 px-3 font-bold">Par</th>
                  {sortedPlayers.map((p) => (
                    <th key={p.id} className="py-2.5 px-2 font-bold">
                      <div>{p.initials}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {first9Holes.map((hNum) => {
                  const holeData = course.holes.find((h) => h.number === hNum);
                  const holeWinners = getHoleWinners(hNum);

                  return (
                    <tr key={hNum} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-left font-bold text-slate-900">Hoyo {hNum}</td>
                      <td className="py-3 px-3 text-slate-600 font-semibold">{holeData?.par || 4}</td>
                      {sortedPlayers.map((p) => {
                        const res = getPlayerHoleNet(p.id, hNum);
                        const isWinner = holeWinners.includes(p.id);

                        return (
                          <td key={p.id} className={`py-3 px-2 ${isWinner ? 'bg-emerald-50 font-bold' : ''}`}>
                            {res && res.net !== null ? (
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                {isWinner && (
                                  <span className="text-emerald-600 font-black flex items-center gap-0.5">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </span>
                                )}
                                <span className={`text-[11px] ${isWinner ? 'text-emerald-800 font-black' : 'text-slate-700 font-semibold'}`}>
                                  ({res.gross}/{res.net})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td className="py-3 px-3 text-left">Total Hoyos Ganados</td>
                  <td>-</td>
                  {sortedPlayers.map((p) => (
                    <td key={p.id} className="py-3 px-2 text-emerald-800 font-extrabold text-sm">
                      {results.firstHalfWins[p.id]}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-200/90 border-t border-slate-300">
                  <td className="py-3 px-3 text-left">Puntos 1ª Vuelta</td>
                  <td>-</td>
                  {sortedPlayers.map((p) => {
                    const pts = results.pointsFirst[p.id] || 0;
                    return (
                      <td key={p.id} className={`py-3 px-2 font-black text-sm ${pts >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {pts > 0 ? `+${pts}` : pts} pts
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Second Half Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm flex justify-between items-center">
            <span>{isStartHole10 ? 'Segunda Vuelta (Hoyos 1 al 9)' : 'Segunda Vuelta (Hoyos 10 al 18)'}</span>
            <span className="text-xs bg-slate-800 px-3 py-1 rounded-xl">Ganadores por hoyo (Menor Neto)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-800 border-b border-slate-300">
                  <th className="py-2.5 px-3 text-left font-bold">Hoyo</th>
                  <th className="py-2.5 px-3 font-bold">Par</th>
                  {sortedPlayers.map((p) => (
                    <th key={p.id} className="py-2.5 px-2 font-bold">
                      <div>{p.initials}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {second9Holes.map((hNum) => {
                  const holeData = course.holes.find((h) => h.number === hNum);
                  const holeWinners = getHoleWinners(hNum);

                  return (
                    <tr key={hNum} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-left font-bold text-slate-900">Hoyo {hNum}</td>
                      <td className="py-3 px-3 text-slate-600 font-semibold">{holeData?.par || 4}</td>
                      {sortedPlayers.map((p) => {
                        const res = getPlayerHoleNet(p.id, hNum);
                        const isWinner = holeWinners.includes(p.id);

                        return (
                          <td key={p.id} className={`py-3 px-2 ${isWinner ? 'bg-emerald-50 font-bold' : ''}`}>
                            {res && res.net !== null ? (
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                {isWinner && (
                                  <span className="text-emerald-600 font-black flex items-center gap-0.5">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </span>
                                )}
                                <span className={`text-[11px] ${isWinner ? 'text-emerald-800 font-black' : 'text-slate-700 font-semibold'}`}>
                                  ({res.gross}/{res.net})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td className="py-3 px-3 text-left">Total Hoyos Ganados</td>
                  <td>-</td>
                  {sortedPlayers.map((p) => (
                    <td key={p.id} className="py-3 px-2 text-emerald-800 font-extrabold text-sm">
                      {results.secondHalfWins[p.id]}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-200/90 border-t border-slate-300">
                  <td className="py-3 px-3 text-left">Puntos 2ª Vuelta</td>
                  <td>-</td>
                  {sortedPlayers.map((p) => {
                    const pts = results.pointsSecond[p.id] || 0;
                    return (
                      <td key={p.id} className={`py-3 px-2 font-black text-sm ${pts >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {pts > 0 ? `+${pts}` : pts} pts
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
