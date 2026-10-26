import React, { useState } from 'react';
import { GolfCourse, Player, Round } from '../types';
import { calculateSindicato } from '../utils/sindicatoCalculations';
import { getSortedRoundPlayers } from '../utils/golfCalculations';
import { ArrowLeft, Trophy, Award, AlertCircle } from 'lucide-react';

interface SindicatoViewProps {
  round: Round;
  course: GolfCourse;
  roundPlayers: Player[];
  onBack: () => void;
}

export const SindicatoView: React.FC<SindicatoViewProps> = ({
  round,
  course,
  roundPlayers,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'holes'>('holes');
  const summary = calculateSindicato(round, course, roundPlayers);
  const sortedPlayers = getSortedRoundPlayers(roundPlayers, round.config);

  const isStartHole10 = round.config.startHole === 10;
  const primeraVueltaHoles = isStartHole10
    ? Array.from({ length: 9 }, (_, i) => i + 10)
    : Array.from({ length: 9 }, (_, i) => i + 1);

  const segundaVueltaHoles = isStartHole10
    ? Array.from({ length: 9 }, (_, i) => i + 1)
    : Array.from({ length: 9 }, (_, i) => i + 10);

  const getPlayerName = (id: string) => roundPlayers.find((p) => p.id === id)?.name || id;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Sindicato — {course.name}
          </h2>
          <p className="text-xs text-slate-500">
            Jugadores: {roundPlayers.length} ({sortedPlayers.map((p) => p.initials).join(', ')})
          </p>
        </div>

        <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('holes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'holes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Detalle por Hoyo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'summary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resumen General
          </button>
        </div>
      </div>

      {summary.messages.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-amber-900 uppercase">Avisos y Reglas Especiales Aplicadas:</h4>
            {summary.messages.map((msg, idx) => (
              <p key={idx} className="text-xs text-amber-800">{msg}</p>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPlayers.map((player) => {
              const pvPts = summary.primeraVueltaPoints[player.id] || 0;
              const svPts = summary.segundaVueltaPoints[player.id] || 0;
              const totalPts = summary.totalPoints[player.id] || 0;

              const isPvWinner = summary.primeraVueltaWinner === player.id;
              const isSvWinner = summary.segundaVueltaWinner === player.id;
              const isTotalWinner = summary.totalWinner === player.id;

              return (
                <div key={player.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                        {player.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{player.name}</h4>
                        <p className="text-[11px] text-slate-500">Hcp: {player.handicapIndex}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">1ª Vuelta</div>
                      <div className="text-base font-black text-slate-900">{pvPts} pts</div>
                      {isPvWinner && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full inline-block mt-1">
                          Ganador
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">2ª Vuelta</div>
                      <div className="text-base font-black text-slate-900">{svPts} pts</div>
                      {isSvWinner && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full inline-block mt-1">
                          Ganador
                        </span>
                      )}
                      {summary.segundaVueltaWinner === 'carry-over' && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1 py-0.5 rounded-full inline-block mt-1">
                          Carry-Over
                        </span>
                      )}
                    </div>

                    <div className="bg-emerald-900 text-white p-2.5 rounded-2xl">
                      <div className="text-[9px] text-emerald-200 font-bold uppercase">Total</div>
                      <div className="text-base font-black">{totalPts} pts</div>
                      {isTotalWinner && (
                        <span className="text-[9px] bg-amber-400 text-slate-900 font-black px-1.5 py-0.5 rounded-full inline-block mt-1">
                          Campeón
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Estado de la Apuesta Sindicato
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold block">Ganador 1ª Vuelta ({isStartHole10 ? 'Hoyos 10-18' : 'Hoyos 1-9'})</span>
                <span className="font-bold text-slate-900 text-sm">
                  {summary.primeraVueltaWinner === 'carry-over'
                    ? 'Carry-Over (Ganador Total)'
                    : summary.primeraVueltaWinner
                    ? getPlayerName(summary.primeraVueltaWinner)
                    : 'Sin definir'}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold block">Ganador 2ª Vuelta ({isStartHole10 ? 'Hoyos 1-9' : 'Hoyos 10-18'})</span>
                <span className="font-bold text-slate-900 text-sm">
                  {summary.segundaVueltaWinner === 'carry-over'
                    ? 'Carry-Over (Sin Ganador)'
                    : summary.segundaVueltaWinner
                    ? getPlayerName(summary.segundaVueltaWinner)
                    : 'Sin definir'}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold block">Ganador Vuelta Total (18 Hoyos)</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {summary.totalWinner === 'tie'
                    ? 'Empate (0 pts en Total)'
                    : summary.totalWinner
                    ? getPlayerName(summary.totalWinner)
                    : 'Sin definir'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'holes' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold text-sm">
            Detalle de Puntos por Hoyo (Sindicato)
          </div>
          <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-800 border-b border-slate-300 sticky top-0 z-20">
                  <th className="py-3 px-2 text-left font-bold bg-slate-200">Hoyo</th>
                  {sortedPlayers.map((player) => (
                    <th key={player.id} className="py-3 px-1 font-bold bg-slate-200">
                      <div>{player.initials}</div>
                      <div className="text-[9px] text-slate-500 font-normal">Pts (Bruto/Neto)</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* 1ª Vuelta */}
                <tr className="bg-slate-100/80">
                  <td colSpan={sortedPlayers.length + 1} className="py-2 px-3 text-left font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                    1ª Vuelta ({isStartHole10 ? 'Hoyos 10-18' : 'Hoyos 1-9'})
                  </td>
                </tr>
                {primeraVueltaHoles.map((hNum) => {
                  const hr = summary.holeResults.find((r) => r.holeNumber === hNum);
                  const holeData = course.holes.find((h) => h.number === hNum);
                  return (
                    <tr key={hNum} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-bold text-slate-900 bg-slate-50/50">
                        <div className="flex items-center gap-1.5">
                          <span>H.{hNum}</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            (Par {holeData?.par || 4})
                          </span>
                        </div>
                      </td>
                      {sortedPlayers.map((player) => {
                        const gross = round.scores[player.id]?.[hNum];
                        const net = hr?.netScores[player.id];
                        const pts = hr?.points[player.id] || 0;
                        return (
                          <td key={player.id} className="py-2 px-1">
                            {gross !== undefined && gross !== null && !isNaN(gross) ? (
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                  {pts} pts
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  {gross}g / {net ?? '-'}n
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
                {/* Subtotal 1ª Vuelta */}
                <tr className="bg-emerald-50/60 font-extrabold border-t-2 border-emerald-200">
                  <td className="py-2.5 px-3 text-left text-emerald-900 uppercase">
                    Subtotal 1ª Vuelta
                  </td>
                  {sortedPlayers.map((player) => {
                    const pvPts = primeraVueltaHoles.reduce((acc, hNum) => {
                      const hr = summary.holeResults.find((r) => r.holeNumber === hNum);
                      return acc + (hr?.points[player.id] || 0);
                    }, 0);
                    return (
                      <td key={player.id} className="py-2.5 px-1 text-emerald-900 text-sm">
                        {pvPts} pts
                      </td>
                    );
                  })}
                </tr>

                {/* 2ª Vuelta */}
                <tr className="bg-slate-100/80">
                  <td colSpan={sortedPlayers.length + 1} className="py-2 px-3 text-left font-extrabold text-slate-800 uppercase tracking-wider text-[11px] pt-4">
                    2ª Vuelta ({isStartHole10 ? 'Hoyos 1-9' : 'Hoyos 10-18'})
                  </td>
                </tr>
                {segundaVueltaHoles.map((hNum) => {
                  const hr = summary.holeResults.find((r) => r.holeNumber === hNum);
                  const holeData = course.holes.find((h) => h.number === hNum);
                  return (
                    <tr key={hNum} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-bold text-slate-900 bg-slate-50/50">
                        <div className="flex items-center gap-1.5">
                          <span>H.{hNum}</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            (Par {holeData?.par || 4})
                          </span>
                        </div>
                      </td>
                      {sortedPlayers.map((player) => {
                        const gross = round.scores[player.id]?.[hNum];
                        const net = hr?.netScores[player.id];
                        const pts = hr?.points[player.id] || 0;
                        return (
                          <td key={player.id} className="py-2 px-1">
                            {gross !== undefined && gross !== null && !isNaN(gross) ? (
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                  {pts} pts
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  {gross}g / {net ?? '-'}n
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
                {/* Subtotal 2ª Vuelta */}
                <tr className="bg-emerald-50/60 font-extrabold border-t-2 border-emerald-200">
                  <td className="py-2.5 px-3 text-left text-emerald-900 uppercase">
                    Subtotal 2ª Vuelta
                  </td>
                  {sortedPlayers.map((player) => {
                    const svPts = segundaVueltaHoles.reduce((acc, hNum) => {
                      const hr = summary.holeResults.find((r) => r.holeNumber === hNum);
                      return acc + (hr?.points[player.id] || 0);
                    }, 0);
                    return (
                      <td key={player.id} className="py-2.5 px-1 text-emerald-900 text-sm">
                        {svPts} pts
                      </td>
                    );
                  })}
                </tr>

                {/* Total Final */}
                <tr className="bg-slate-900 text-white font-black border-t-4 border-slate-900">
                  <td className="py-3 px-3 text-left uppercase text-xs">
                    Total Puntos (18 Hoyos)
                  </td>
                  {sortedPlayers.map((player) => {
                    const totPts = summary.totalPoints[player.id] || 0;
                    return (
                      <td key={player.id} className="py-3 px-1 text-amber-400 text-base">
                        {totPts} pts
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
