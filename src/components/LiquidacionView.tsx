import React, { useState, useEffect } from 'react';
import { GolfCourse, Player, Round } from '../types';
import { calculateSindicato } from '../utils/sindicatoCalculations';
import { getSortedRoundPlayers, calculatePlayerHoleStrokes, calculateNetScore } from '../utils/golfCalculations';
import { ArrowLeft, Calculator, Trophy, Users, Sparkles, Swords, DollarSign, Award, ChevronRight } from 'lucide-react';

interface LiquidacionViewProps {
  round: Round;
  course: GolfCourse;
  roundPlayers: Player[];
  onNavigate: (subView: 'hub' | 'scorecard' | 'sindicato' | 'parejas' | 'individuales' | 'match' | 'perifericos' | 'monedas' | 'liquidacion') => void;
  onBack: () => void;
  onUpdateRound?: (updatedRound: Round) => void;
}

export const LiquidacionView: React.FC<LiquidacionViewProps> = ({
  round,
  course,
  roundPlayers,
  onNavigate,
  onBack,
  onUpdateRound
}) => {
  const activeBets = round.config.activeBets || round.activeBets || {
    sindicato: true,
    parejas: true,
    individuales: true,
    match: true,
    perifericos: true,
    monedas: true,
    medallas: true,
  };

  const isMonedasActive = activeBets.monedas !== undefined 
    ? activeBets.monedas 
    : (activeBets.medallas !== undefined ? activeBets.medallas : true);

  const sortedPlayers = getSortedRoundPlayers(roundPlayers, round.config);
  const n = sortedPlayers.length;

  const hasAnyScores = Object.values(round.scores || {}).some((pScores) => 
    pScores && Object.values(pScores).some((s) => s !== undefined && s !== null && !isNaN(s))
  );

  // 1. Sindicato Settlement Calculation
  const sindicatoSummary = calculateSindicato(round, course, roundPlayers);

  const calculateSindicatoSettlement = () => {
    const settlement: Record<string, { primera: number; segunda: number; total: number; primeraScore: number; segundaScore: number; totalScore: number }> = {};
    sortedPlayers.forEach((p) => {
      settlement[p.id] = {
        primera: 0,
        segunda: 0,
        total: 0,
        primeraScore: sindicatoSummary.primeraVueltaPoints[p.id] || 0,
        segundaScore: sindicatoSummary.segundaVueltaPoints[p.id] || 0,
        totalScore: sindicatoSummary.totalPoints[p.id] || 0
      };
    });

    if (!hasAnyScores || activeBets.sindicato === false) return settlement;

    if (n === 3) {
      // 3 Players: 1st=+9, 2nd=-3, 3rd=-6
      // Helper for ranking
      const rankVuelta = (pointsMap: Record<string, number>, isCarryOver: boolean, isSecondOrTotal: boolean) => {
        const sorted = sortedPlayers.map((p) => ({ id: p.id, pts: pointsMap[p.id] || 0 })).sort((a, b) => b.pts - a.pts);
        const maxPts = sorted[0].pts;
        const tiedForFirst = sorted.filter((s) => s.pts === maxPts);

        const res: Record<string, number> = {};
        sortedPlayers.forEach((p) => { res[p.id] = 0; });

        if (isCarryOver && tiedForFirst.length >= 2) {
          // Carry over -> 0 pts for this vuelta
          return res;
        }

        if (tiedForFirst.length >= 2 && isSecondOrTotal) {
          // 2nd/Total tie -> 0 pts
          return res;
        }

        if (sorted.length >= 3) {
          const p1 = sorted[0].id;
          const p2 = sorted[1].id;
          const p3 = sorted[2].id;

          // Check if 2nd and 3rd tied
          if (sorted[1].pts === sorted[2].pts) {
            res[p1] = 9;
            res[p2] = -4.5;
            res[p3] = -4.5;
          } else {
            res[p1] = 9;
            res[p2] = -3;
            res[p3] = -6;
          }
        }
        return res;
      };

      const p1Settlement = rankVuelta(sindicatoSummary.primeraVueltaPoints, sindicatoSummary.primeraVueltaWinner === 'carry-over', false);
      const p2Settlement = rankVuelta(sindicatoSummary.segundaVueltaPoints, sindicatoSummary.segundaVueltaWinner === 'carry-over', true);

      // Total rank
      const totalSorted = sortedPlayers.map((p) => ({ id: p.id, pts: sindicatoSummary.totalPoints[p.id] || 0 })).sort((a, b) => b.pts - a.pts);
      const totalTied = totalSorted.filter((s) => s.pts === totalSorted[0].pts);
      const pTotalSettlement: Record<string, number> = {};
      sortedPlayers.forEach((p) => { pTotalSettlement[p.id] = 0; });

      if (totalTied.length < 2 && totalSorted.length >= 3) {
        const p1 = totalSorted[0].id;
        const p2 = totalSorted[1].id;
        const p3 = totalSorted[2].id;
        if (totalSorted[1].pts === totalSorted[2].pts) {
          pTotalSettlement[p1] = 9;
          pTotalSettlement[p2] = -4.5;
          pTotalSettlement[p3] = -4.5;
        } else {
          pTotalSettlement[p1] = 9;
          pTotalSettlement[p2] = -3;
          pTotalSettlement[p3] = -6;
        }
      }

      sortedPlayers.forEach((p) => {
        settlement[p.id].primera = p1Settlement[p.id];
        settlement[p.id].segunda = p2Settlement[p.id];
        settlement[p.id].total = pTotalSettlement[p.id];
      });
    } else if (n === 4) {
      // 4 Players: 1st=+12, 2nd=-2, 3rd=-4, 4th=-6
      const rankVuelta4 = (pointsMap: Record<string, number>, isCarryOver: boolean, isTotal: boolean) => {
        const sorted = sortedPlayers.map((p) => ({ id: p.id, pts: pointsMap[p.id] || 0 })).sort((a, b) => b.pts - a.pts);
        const maxPts = sorted[0].pts;
        const tiedForFirst = sorted.filter((s) => s.pts === maxPts);

        const res: Record<string, number> = {};
        sortedPlayers.forEach((p) => { res[p.id] = 0; });

        if ((isCarryOver || tiedForFirst.length >= 3) && !isTotal) {
          return res;
        }
        if (isTotal && tiedForFirst.length >= 3) {
          sortedPlayers.forEach((p) => { res[p.id] = 9; });
          return res;
        }

        // Standard base payout: [12, -2, -4, -6]
        const basePayouts = [12, -2, -4, -6];
        // Group players by points
        const groups: { pts: number; ids: string[] }[] = [];
        sorted.forEach((item) => {
          const last = groups[groups.length - 1];
          if (last && last.pts === item.pts) {
            last.ids.push(item.id);
          } else {
            groups.push({ pts: item.pts, ids: [item.id] });
          }
        });

        let rankIdx = 0;
        groups.forEach((group) => {
          let sumPayout = 0;
          for (let i = 0; i < group.ids.length; i++) {
            sumPayout += basePayouts[Math.min(rankIdx + i, basePayouts.length - 1)];
          }
          const avgPayout = sumPayout / group.ids.length;
          group.ids.forEach((id) => {
            res[id] = avgPayout;
          });
          rankIdx += group.ids.length;
        });

        return res;
      };

      const p1Settlement = rankVuelta4(sindicatoSummary.primeraVueltaPoints, sindicatoSummary.primeraVueltaWinner === 'carry-over', false);
      const p2Settlement = rankVuelta4(sindicatoSummary.segundaVueltaPoints, sindicatoSummary.segundaVueltaWinner === 'carry-over', false);
      const pTotalSettlement = rankVuelta4(sindicatoSummary.totalPoints, false, true);

      sortedPlayers.forEach((p) => {
        settlement[p.id].primera = p1Settlement[p.id];
        settlement[p.id].segunda = p2Settlement[p.id];
        settlement[p.id].total = pTotalSettlement[p.id];
      });
    } else if (n === 5) {
      // 5 Players: 1st=+20, 2nd=-2, 3rd=-4, 4th=-6, 5th=-8
      const rankVuelta5 = (pointsMap: Record<string, number>, isCarryOver: boolean) => {
        const sorted = sortedPlayers.map((p) => ({ id: p.id, pts: pointsMap[p.id] || 0 })).sort((a, b) => b.pts - a.pts);
        const maxPts = sorted[0].pts;
        const tiedForFirst = sorted.filter((s) => s.pts === maxPts);

        const res: Record<string, number> = {};
        sortedPlayers.forEach((p) => { res[p.id] = 0; });

        if (isCarryOver || tiedForFirst.length >= 3) {
          return res;
        }

        const basePayouts = [20, -2, -4, -6, -8];
        const groups: { pts: number; ids: string[] }[] = [];
        sorted.forEach((item) => {
          const last = groups[groups.length - 1];
          if (last && last.pts === item.pts) {
            last.ids.push(item.id);
          } else {
            groups.push({ pts: item.pts, ids: [item.id] });
          }
        });

        let rankIdx = 0;
        groups.forEach((group) => {
          let sumPayout = 0;
          for (let i = 0; i < group.ids.length; i++) {
            sumPayout += basePayouts[Math.min(rankIdx + i, basePayouts.length - 1)];
          }
          const avgPayout = sumPayout / group.ids.length;
          group.ids.forEach((id) => {
            res[id] = avgPayout;
          });
          rankIdx += group.ids.length;
        });

        return res;
      };

      const p1Settlement = rankVuelta5(sindicatoSummary.primeraVueltaPoints, sindicatoSummary.primeraVueltaWinner === 'carry-over');
      const p2Settlement = rankVuelta5(sindicatoSummary.segundaVueltaPoints, sindicatoSummary.segundaVueltaWinner === 'carry-over');
      const pTotalSettlement = rankVuelta5(sindicatoSummary.totalPoints, false);

      sortedPlayers.forEach((p) => {
        settlement[p.id].primera = p1Settlement[p.id];
        settlement[p.id].segunda = p2Settlement[p.id];
        settlement[p.id].total = pTotalSettlement[p.id];
      });
    }

    return settlement;
  };

  const sindicatoSettlement = calculateSindicatoSettlement();

  // 2. Parejas Summary
  const getParejasSummary = () => {
    const pPoints: Record<string, number> = {};
    sortedPlayers.forEach((p) => { pPoints[p.id] = 0; });
    return pPoints;
  };
  const parejasSummary = getParejasSummary();

  // 3. Individuales Summary
  const getIndividualesSummary = () => {
    const pPoints: Record<string, number> = {};
    sortedPlayers.forEach((p) => { pPoints[p.id] = 0; });
    return pPoints;
  };
  const individualesSummary = getIndividualesSummary();

  // 4. Match Summary
  const getMatchSummary = () => {
    const pPoints: Record<string, number> = {};
    sortedPlayers.forEach((p) => { pPoints[p.id] = 0; });
    return pPoints;
  };
  const matchSummary = getMatchSummary();

  // 5. Periféricos Summary
  const getPerifericosSummary = () => {
    const pPoints: Record<string, number> = {};
    sortedPlayers.forEach((p) => { pPoints[p.id] = 0; });
    if (activeBets.perifericos === false) return pPoints;

    const participation = round.perifericosParticipation || {};
    const counts = round.perifericosCounts || {};
    const active = sortedPlayers.filter((p) => participation[p.id] !== false);
    if (active.length > 1) {
      const earnings: Record<string, number> = {};
      sortedPlayers.forEach((p) => {
        if (participation[p.id] === false) { earnings[p.id] = 0; return; }
        const c = counts[p.id] || { greenie: 0, birdie: 0, sandy: 0, aguila: 0, ppun: 0 };
        earnings[p.id] = c.greenie * 3 + c.sandy * 3 + c.ppun * 3 + c.birdie * 5 + c.aguila * 10;
      });
      active.forEach((p) => {
        const myEarned = earnings[p.id];
        const othersSum = active.filter((o) => o.id !== p.id).reduce((acc, o) => acc + earnings[o.id], 0);
        pPoints[p.id] = myEarned * (active.length - 1) - othersSum;
      });
    }
    return pPoints;
  };
  const perifericosSummary = getPerifericosSummary();

  // 6. Monedas Summary
  const getMedallasSummary = () => {
    const pPoints: Record<string, number> = {};
    sortedPlayers.forEach((p) => { pPoints[p.id] = 0; });
    if (!isMonedasActive) return pPoints;

    const participation = round.monedasParticipation || round.medallasParticipation || {};
    const counts = round.monedasCounts || round.medallasCounts || {};
    const active = sortedPlayers.filter((p) => participation[p.id] !== false);
    if (active.length > 1) {
      const balances: Record<string, number> = {};
      sortedPlayers.forEach((p) => { balances[p.id] = 0; });
      active.forEach((p) => {
        const c = counts[p.id] || { agua: 0, bunker: 0, calle: 0, triputt: 0, special: 0 };
        const negCount = c.agua + c.bunker + c.calle + c.triputt;
        if (negCount > 0) {
          balances[p.id] += negCount * (-5) * (active.length - 1);
          active.forEach((o) => {
            if (o.id !== p.id) balances[o.id] += negCount * 5;
          });
        }
        if (c.special > 0) {
          balances[p.id] += c.special * 5 * (active.length - 1);
          active.forEach((o) => {
            if (o.id !== p.id) balances[o.id] += c.special * (-5);
          });
        }
      });
      sortedPlayers.forEach((p) => {
        pPoints[p.id] = participation[p.id] !== false ? balances[p.id] : 0;
      });
    }
    return pPoints;
  };
  const medallasSummary = getMedallasSummary();

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Liquidación General — {course.name}
          </h2>
          <p className="text-xs text-slate-500">
            Resumen financiero y saldos finales de todas las apuestas
          </p>
        </div>
      </div>



      {/* Resumen Total de Apuestas para cada jugador */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-600" />
            Resumen Total de Apuestas
          </h3>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
            Saldo Global por Jugador
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                <th className="py-3 px-3 text-left font-bold">Jugador</th>
                {activeBets.sindicato !== false && <th className="py-3 px-2 font-bold">Sindicato</th>}
                {activeBets.parejas !== false && <th className="py-3 px-2 font-bold">Parejas</th>}
                {activeBets.individuales !== false && <th className="py-3 px-2 font-bold">Individuales</th>}
                {activeBets.match !== false && <th className="py-3 px-2 font-bold">Match</th>}
                {activeBets.perifericos !== false && <th className="py-3 px-2 font-bold">Periféricos</th>}
                {isMonedasActive && <th className="py-3 px-2 font-bold">Monedas</th>}
                <th className="py-3 px-3 font-bold">Total General</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPlayers.map((p) => {
                const sindPts = activeBets.sindicato !== false ? (sindicatoSettlement[p.id]?.total || 0) : 0;
                const parejasPts = activeBets.parejas !== false ? (parejasSummary[p.id] || 0) : 0;
                const individualesPts = activeBets.individuales !== false ? (individualesSummary[p.id] || 0) : 0;
                const matchPts = activeBets.match !== false ? (matchSummary[p.id] || 0) : 0;
                const perfPts = activeBets.perifericos !== false ? (perifericosSummary[p.id] || 0) : 0;
                const medPts = isMonedasActive ? (medallasSummary[p.id] || 0) : 0;
                const totalGen = sindPts + parejasPts + individualesPts + matchPts + perfPts + medPts;

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-left font-bold text-slate-900">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{p.initials}</div>
                    </td>
                    {activeBets.sindicato !== false && (
                      <td className={`py-3 px-2 font-bold ${sindPts >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {sindPts > 0 ? `+${sindPts}` : sindPts}
                      </td>
                    )}
                    {activeBets.parejas !== false && (
                      <td className={`py-3 px-2 font-bold ${parejasPts >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {parejasPts > 0 ? `+${parejasPts}` : parejasPts}
                      </td>
                    )}
                    {activeBets.individuales !== false && (
                      <td className={`py-3 px-2 font-bold ${individualesPts >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {individualesPts > 0 ? `+${individualesPts}` : individualesPts}
                      </td>
                    )}
                    {activeBets.match !== false && (
                      <td className={`py-3 px-2 font-bold ${matchPts >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {matchPts > 0 ? `+${matchPts}` : matchPts}
                      </td>
                    )}
                    {activeBets.perifericos !== false && (
                      <td className={`py-3 px-2 font-bold ${perfPts >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {perfPts > 0 ? `+${perfPts}` : perfPts}
                      </td>
                    )}
                    {isMonedasActive && (
                      <td className={`py-3 px-2 font-bold ${medPts >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {medPts > 0 ? `+${medPts}` : medPts}
                      </td>
                    )}
                    <td className="py-3 px-3">
                      <span className={`px-3 py-1.5 rounded-xl font-black text-sm ${totalGen >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {totalGen > 0 ? `+${totalGen}` : totalGen} pts
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Sindicato Section */}
      {activeBets.sindicato !== false && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Sindicato (Puntos por Hoyo)
            </h3>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full">
              Apuesta Principal
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                  <th className="py-3 px-3 text-left font-bold">Jugador</th>
                  <th className="py-3 px-3 font-bold">Primera Vuelta</th>
                  <th className="py-3 px-3 font-bold">Segunda Vuelta</th>
                  <th className="py-3 px-3 font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPlayers.map((p) => {
                  const s = sindicatoSettlement[p.id] || { primera: 0, segunda: 0, total: 0, primeraScore: 0, segundaScore: 0, totalScore: 0 };
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-4 px-3 text-left font-bold text-slate-900">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{p.initials}</div>
                      </td>

                      {/* Primera Vuelta */}
                      <td className="py-4 px-3">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`text-base font-black ${s.primera >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {s.primera > 0 ? `+${s.primera}` : s.primera}
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            ({s.primeraScore > 0 ? `+${s.primeraScore}` : s.primeraScore} pts)
                          </span>
                        </div>
                      </td>

                      {/* Segunda Vuelta */}
                      <td className="py-4 px-3">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`text-base font-black ${s.segunda >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {s.segunda > 0 ? `+${s.segunda}` : s.segunda}
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            ({s.segundaScore > 0 ? `+${s.segundaScore}` : s.segundaScore} pts)
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-3">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`text-base font-black ${s.total >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {s.total > 0 ? `+${s.total}` : s.total}
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            ({s.totalScore > 0 ? `+${s.totalScore}` : s.totalScore} pts)
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Other Betting Modules Summary Cards with Navigation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parejas */}
        {activeBets.parejas !== false && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Parejas
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('parejas')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 px-3 py-1 rounded-xl transition-colors"
              >
                <span>Ver detalle</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {sortedPlayers.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800">{p.name} ({p.initials})</span>
                  <span className="font-black text-slate-700">Modo Rotación</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individuales */}
        {activeBets.individuales !== false && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Individuales (Nassau)
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('individuales')}
                className="text-xs text-purple-700 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer bg-purple-50 px-3 py-1 rounded-xl transition-colors"
              >
                <span>Ver detalle</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {sortedPlayers.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800">{p.name} ({p.initials})</span>
                  <span className="font-black text-slate-700">Ver en detalle</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match */}
        {activeBets.match !== false && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Swords className="w-4 h-4 text-rose-600" />
                Match Play
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('match')}
                className="text-xs text-rose-700 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer bg-rose-50 px-3 py-1 rounded-xl transition-colors"
              >
                <span>Ver detalle</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {sortedPlayers.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800">{p.name} ({p.initials})</span>
                  <span className="font-black text-slate-700">Ver en detalle</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Periféricos */}
        {activeBets.perifericos !== false && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Periféricos
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('perifericos')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 px-3 py-1 rounded-xl transition-colors"
              >
                <span>Ver detalle</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {sortedPlayers.map((p) => {
                const pts = perifericosSummary[p.id] || 0;
                return (
                  <div key={p.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">{p.name} ({p.initials})</span>
                    <span className={`font-black ${pts >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {pts > 0 ? `+${pts}` : pts} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Monedas */}
        {isMonedasActive && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4 md:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Monedas
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('monedas')}
                className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer bg-amber-50 px-3 py-1 rounded-xl transition-colors"
              >
                <span>Ver detalle</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {sortedPlayers.map((p) => {
                const pts = medallasSummary[p.id] || 0;
                return (
                  <div key={p.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">{p.name} ({p.initials})</span>
                    <span className={`font-black ${pts >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {pts > 0 ? `+${pts}` : pts} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
