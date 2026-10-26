import React, { useState } from 'react';
import { GolfCourse, Player, Round } from '../types';
import { calculateRoundHandicaps, getSortedRoundPlayers } from '../utils/golfCalculations';
import { ArrowLeft, Sparkles, Trophy, Check, AlertTriangle } from 'lucide-react';

interface IndividualesViewProps {
  round: Round;
  course: GolfCourse;
  roundPlayers: Player[];
  onUpdateRound?: (updatedRound: Round) => void;
  onBack: () => void;
}

export const IndividualesView: React.FC<IndividualesViewProps> = ({
  round,
  course,
  roundPlayers,
  onUpdateRound,
  onBack
}) => {
  const sortedPlayers = getSortedRoundPlayers(roundPlayers, round.config);
  const roundHcps = calculateRoundHandicaps(roundPlayers, round.config);
  const hcpMap = new Map(roundHcps.map((h) => [h.playerId, h]));

  const isStartHole10 = round.config.startHole === 10;
  const first9Holes = isStartHole10
    ? Array.from({ length: 9 }, (_, i) => i + 10)
    : Array.from({ length: 9 }, (_, i) => i + 1);
  const second9Holes = isStartHole10
    ? Array.from({ length: 9 }, (_, i) => i + 1)
    : Array.from({ length: 9 }, (_, i) => i + 10);
  const allHoleNumbers = [...first9Holes, ...second9Holes];

  // Generate all pairings (i < j)
  const pairings: { id: string; pA: Player; pB: Player; hcpA: number; hcpB: number; diff: number }[] = [];
  for (let i = 0; i < sortedPlayers.length; i++) {
    for (let j = i + 1; j < sortedPlayers.length; j++) {
      const p1 = sortedPlayers[i];
      const p2 = sortedPlayers[j];
      const hcp1 = hcpMap.get(p1.id)?.playingHandicap ?? p1.handicapIndex;
      const hcp2 = hcpMap.get(p2.id)?.playingHandicap ?? p2.handicapIndex;

      let pA = p1;
      let pB = p2;
      let hcpA = hcp1;
      let hcpB = hcp2;

      if (hcp2 < hcp1 || (hcp2 === hcp1 && i > j)) {
        pA = p2;
        pB = p1;
        hcpA = hcp2;
        hcpB = hcp1;
      }

      const diff = Math.abs(hcpA - hcpB);
      const pairId = `${pA.id}_${pB.id}`;
      pairings.push({ id: pairId, pA, pB, hcpA, hcpB, diff });
    }
  }

  // Active prompt state for Bye / ReBye resolution
  const [byeAcceptedChoice, setByeAcceptedChoice] = useState<boolean | null>(null);
  const [byeLeonChoice, setByeLeonChoice] = useState<boolean | null>(null);

  // Helper to calculate match state for a pairing
  const getMatchupHoleResults = (pair: typeof pairings[0]) => {
    const byeState = round.individualesByeStates?.[pair.id] || {};

    let detectedByeHole = -1;
    let detectedReByeHole = -1;

    // Pass 1: detect when bye and rebye conditions are met
    let tempCum = 0;
    allHoleNumbers.forEach((hNum, hIdx) => {
      const holeData = course.holes.find((h) => h.number === hNum);
      const holeHcp = holeData?.handicap || 18;
      const hasAdvantage = holeHcp <= pair.diff;
      const grossA = round.scores[pair.pA.id]?.[hNum];
      const grossB = round.scores[pair.pB.id]?.[hNum];
      if (grossA === undefined || grossA === null || isNaN(grossA) || grossB === undefined || grossB === null || isNaN(grossB)) return;

      const netA = grossA;
      const netB = grossB - (hasAdvantage ? 1 : 0);
      let hRes = 0;
      if (netA < netB) hRes = 1;
      else if (netB < netA) hRes = -1;

      if (byeState.byeResolved && byeState.byeAccepted && hIdx === (byeState.byeHoleIndex ?? 0) + 1) {
        tempCum = 0;
      }
      tempCum += hRes;

      if (!byeState.byeResolved && hIdx < allHoleNumbers.length - 1) {
        const remaining = allHoleNumbers.length - (hIdx + 1);
        if (Math.abs(tempCum) > remaining && Math.abs(tempCum) > 0 && detectedByeHole === -1) {
          detectedByeHole = hIdx;
        }
      }

      if (byeState.byeResolved && byeState.byeAccepted && !byeState.rebyeResolved && hIdx > (byeState.byeHoleIndex ?? 0)) {
        const remaining = allHoleNumbers.length - (hIdx + 1);
        if (Math.abs(tempCum) > remaining && Math.abs(tempCum) > 0 && detectedReByeHole === -1) {
          detectedReByeHole = hIdx;
        }
      }
    });

    const byeHIdx = byeState.byeHoleIndex !== undefined ? byeState.byeHoleIndex : detectedByeHole;

    // Pass 2: build hole results with reset or dash (-), and underline termination hole
    let activeCum = 0;
    let terminated = false;
    let terminationHoleIdx = -1;
    const holeResults: { hNum: number; holeResult: number; cumulative: string | number; isTerminatedHole: boolean }[] = [];

    allHoleNumbers.forEach((hNum, hIdx) => {
      const holeData = course.holes.find((h) => h.number === hNum);
      const holeHcp = holeData?.handicap || 18;
      const hasAdvantage = holeHcp <= pair.diff;

      const grossA = round.scores[pair.pA.id]?.[hNum];
      const grossB = round.scores[pair.pB.id]?.[hNum];

      if (grossA === undefined || grossA === null || isNaN(grossA) || grossB === undefined || grossB === null || isNaN(grossB)) {
        holeResults.push({ hNum, holeResult: 0, cumulative: terminated ? '-' : activeCum, isTerminatedHole: false });
        return;
      }

      const netA = grossA;
      const netB = grossB - (hasAdvantage ? 1 : 0);
      let hRes = 0;
      if (netA < netB) hRes = 1;
      else if (netB < netA) hRes = -1;

      // Handle bye resolution point
      if (byeState.byeResolved && hIdx === byeHIdx) {
        terminationHoleIdx = hIdx;
        if (!byeState.byeAccepted) {
          terminated = true;
        }
      }

      if (byeState.byeResolved && byeState.byeAccepted && hIdx === byeHIdx + 1) {
        activeCum = 0;
      }

      // Handle rebye resolution point
      if (byeState.rebyeResolved && hIdx === detectedReByeHole) {
        terminationHoleIdx = hIdx;
        if (!byeState.rebyeAccepted) {
          terminated = true;
        }
      }

      if (byeState.rebyeResolved && byeState.rebyeAccepted && hIdx === detectedReByeHole + 1) {
        activeCum = 0;
      }

      if (terminated && hIdx > (byeState.rebyeResolved ? detectedReByeHole : byeHIdx)) {
        holeResults.push({ hNum, holeResult: hRes, cumulative: '-', isTerminatedHole: hIdx === terminationHoleIdx });
        return;
      }

      activeCum += hRes;
      const isTerm = hIdx === terminationHoleIdx || (!terminated && hIdx === allHoleNumbers.length - 1 && Boolean(byeState.byeResolved));

      holeResults.push({ hNum, holeResult: hRes, cumulative: activeCum, isTerminatedHole: isTerm });
    });

    return { holeResults, detectedByeHole: byeHIdx, detectedReByeHole };
  };

  // Find if any pairing needs Bye or ReBye prompt
  const findActivePrompt = () => {
    for (const pair of pairings) {
      const byeState = round.individualesByeStates?.[pair.id] || {};
      const { holeResults, detectedByeHole, detectedReByeHole } = getMatchupHoleResults(pair);

      if (!byeState.byeResolved && detectedByeHole !== -1) {
        return { pair, type: 'bye' as const, byeHoleIndex: detectedByeHole };
      } else if (byeState.byeResolved && byeState.byeAccepted && !byeState.rebyeResolved && detectedReByeHole !== -1) {
        return { pair, type: 'rebye' as const, byeHoleIndex: detectedReByeHole };
      }
    }
    return null;
  };

  const activePrompt = findActivePrompt();

  const handleResolvePrompt = (pairId: string, type: 'bye' | 'rebye', accepted: boolean, leonAccepted: boolean, byeHIdx: number) => {
    if (onUpdateRound) {
      const existing = round.individualesByeStates?.[pairId] || {};
      const updatedRound: Round = {
        ...round,
        individualesByeStates: {
          ...(round.individualesByeStates || {}),
          [pairId]: {
            ...existing,
            ...(type === 'bye' ? {
              byeResolved: true,
              byeAccepted: accepted,
              byeLeonAccepted: leonAccepted,
              byeHoleIndex: byeHIdx
            } : {
              rebyeResolved: true,
              rebyeAccepted: accepted,
              rebyeLeonAccepted: leonAccepted
            })
          }
        }
      };
      onUpdateRound(updatedRound);
      setByeAcceptedChoice(null);
      setByeLeonChoice(null);
    }
  };

  // Calculate final summary points and details
  const calculateSummary = () => {
    const summary: Record<string, { name: string; initials: string; totalPoints: number; matchupLines: string[] }> = {};
    sortedPlayers.forEach((p) => {
      summary[p.id] = { name: p.name, initials: p.initials, totalPoints: 0, matchupLines: [] };
    });

    pairings.forEach((pair) => {
      const { holeResults } = getMatchupHoleResults(pair);
      const byeState = round.individualesByeStates?.[pair.id] || {};
      const finalRes = holeResults[holeResults.length - 1];
      const finalCum = finalRes && finalRes.cumulative !== '-' ? Number(finalRes.cumulative) : 0;

      // Main match points (+10 / -5 or 0)
      let matchWinner = finalCum > 0 ? 1 : finalCum < 0 ? 2 : 0;
      let pAPts = matchWinner === 1 ? 10 : matchWinner === 2 ? -5 : 0;
      let pBPts = matchWinner === 2 ? 10 : matchWinner === 1 ? -5 : 0;

      summary[pair.pA.id].totalPoints += pAPts;
      summary[pair.pB.id].totalPoints += pBPts;
      summary[pair.pA.id].matchupLines.push(`${pair.pA.initials} vs ${pair.pB.initials} (Match): ${pAPts >= 0 ? `+${pAPts}` : pAPts}`);
      summary[pair.pB.id].matchupLines.push(`${pair.pB.initials} vs ${pair.pA.initials} (Match): ${pBPts >= 0 ? `+${pBPts}` : pBPts}`);

      // Bye points if accepted (+5/±10)
      if (byeState.byeResolved && byeState.byeAccepted) {
        const byeVal = byeState.byeLeonAccepted ? 10 : 5;
        let bSum = 0;
        holeResults.forEach((r, idx) => {
          if (idx > (byeState.byeHoleIndex ?? 0) && r.cumulative !== '-') {
            bSum += r.holeResult;
          }
        });
        let bWinner = bSum > 0 ? 1 : bSum < 0 ? 2 : 0;
        let bAPts = bWinner === 1 ? byeVal : bWinner === 2 ? -5 : 0;
        let bBPts = bWinner === 2 ? byeVal : bWinner === 1 ? -5 : 0;

        summary[pair.pA.id].totalPoints += bAPts;
        summary[pair.pB.id].totalPoints += bBPts;
        summary[pair.pA.id].matchupLines.push(`${pair.pA.initials} vs ${pair.pB.initials} (Bye): ${bAPts >= 0 ? `+${bAPts}` : bAPts}`);
        summary[pair.pB.id].matchupLines.push(`${pair.pB.initials} vs ${pair.pA.initials} (Bye): ${bBPts >= 0 ? `+${bBPts}` : bBPts}`);
      }
    });

    return summary;
  };

  const summary = calculateSummary();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Apuesta Individuales (Nassau) — {course.name}
          </h2>
          <p className="text-xs text-slate-500">
            Enfrentamientos uno a uno con handicap, ventaja por hoyo y Bye/ReBye
          </p>
        </div>
      </div>

      {/* Summary Points Card & Final Results Box */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Cuadro Final de Resultados Individuales
          </h3>
          <span className="text-xs bg-purple-500/25 text-purple-300 font-bold px-3 py-1 rounded-full border border-purple-500/30">
            {pairings.length} Enfrentamientos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedPlayers.map((p) => {
            const data = summary[p.id];
            const pts = data?.totalPoints || 0;
            return (
              <div key={p.id} className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-200">
                  <span>{p.name} ({p.initials})</span>
                  <span className={`text-sm font-black ${pts >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pts > 0 ? `+${pts}` : pts} pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  {data?.matchupLines.map((line, idx) => (
                    <div key={idx}>• {line}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matchups Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 text-white p-4 font-bold text-sm flex justify-between items-center">
          <span>Tarjeta de Enfrentamientos Individuales</span>
          <span className="text-xs bg-slate-800 px-3 py-1 rounded-xl">Acumulado por Hoyo</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-800 border-b border-slate-300">
                <th className="py-3 px-2 text-left font-bold sticky left-0 bg-slate-200 z-20">Hoyo</th>
                <th className="py-3 px-2 font-bold">Par</th>
                {pairings.map((pair) => (
                  <th key={pair.id} className="py-2 px-1 font-bold bg-slate-200 border-l border-slate-300">
                    <div className="flex flex-col items-center justify-center leading-tight">
                      <span className="font-black text-slate-900 text-[11px] sm:text-xs">
                        {pair.pA.initials}/{pair.pB.initials}
                      </span>
                      <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-100 px-1 py-0.2 rounded mt-0.5">
                        ({pair.diff})
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allHoleNumbers.map((hNum) => {
                const holeData = course.holes.find((h) => h.number === hNum);
                const holeHcp = holeData?.handicap || 18;

                return (
                  <tr key={hNum} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-left font-bold text-slate-900 sticky left-0 bg-slate-100/90 z-10">
                      H.{hNum} <span className="text-[10px] text-slate-500 font-normal">(Hcp {holeHcp})</span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 font-semibold">{holeData?.par || 4}</td>
                    {pairings.map((pair) => {
                      const hasAdvantage = holeHcp <= pair.diff;
                      const { holeResults } = getMatchupHoleResults(pair);
                      const hRes = holeResults.find((r) => r.hNum === hNum);
                      const cum = hRes ? hRes.cumulative : 0;
                      const isTerminated = hRes?.isTerminatedHole;

                      return (
                        <td
                          key={pair.id}
                          className={`py-2.5 px-1 border-l border-slate-200 transition-colors ${
                            hasAdvantage ? 'bg-amber-50/60' : ''
                          } ${isTerminated ? 'border-b-4 border-black font-black bg-slate-100' : ''}`}
                          title={hasAdvantage ? `Ventaja para ${pair.pB.initials} (Hcp hoyo ${holeHcp} <= ${pair.diff})` : ''}
                        >
                          <div className="flex flex-col items-center justify-center">
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                cum === '-'
                                  ? 'text-slate-400 bg-slate-100'
                                  : Number(cum) > 0
                                  ? 'text-emerald-900 bg-emerald-100 font-extrabold'
                                  : Number(cum) < 0
                                  ? 'text-rose-900 bg-rose-100 font-extrabold'
                                  : 'text-slate-600 bg-slate-100'
                              }`}
                            >
                              {cum === '-' ? '-' : Number(cum) > 0 ? `+${cum}` : cum}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bye / ReBye Modal Prompt */}
      {activePrompt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  ¡Alerta de {activePrompt.type === 'bye' ? 'Bye' : 'ReBye'} Individual!
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Enfrentamiento: {activePrompt.pair.pA.name} vs {activePrompt.pair.pB.name}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2 font-semibold">
              <p>
                Terminó el enfrentamiento {activePrompt.pair.pA.initials}/{activePrompt.pair.pB.initials}, acepta el {activePrompt.type === 'bye' ? 'Bye' : 'ReBye'} Sí ? No ?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">¿Aceptas {activePrompt.type === 'bye' ? 'Bye' : 'ReBye'}?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setByeAcceptedChoice(true)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      byeAcceptedChoice === true ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setByeAcceptedChoice(false)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      byeAcceptedChoice === false ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">¿{activePrompt.type === 'bye' ? 'Bye' : 'ReBye'} León?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setByeLeonChoice(true)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      byeLeonChoice === true ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Sí (León)
                  </button>
                  <button
                    type="button"
                    onClick={() => setByeLeonChoice(false)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      byeLeonChoice === false ? 'bg-slate-700 text-white border-slate-700 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={byeAcceptedChoice === null || byeLeonChoice === null}
              onClick={() => {
                if (byeAcceptedChoice !== null && byeLeonChoice !== null) {
                  handleResolvePrompt(activePrompt.pair.id, activePrompt.type, byeAcceptedChoice!, byeLeonChoice!, activePrompt.byeHoleIndex);
                }
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg transition-colors cursor-pointer text-xs"
            >
              Confirmar y Continuar Jugando
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
