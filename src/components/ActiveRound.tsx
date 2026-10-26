import React, { useState } from 'react';
import { GolfCourse, Player, Round, RoundConfig } from '../types';
import { calculatePlayerHoleStrokes, calculateNetScore } from '../utils/golfCalculations';
import { Trophy, Flag, CheckCircle2, RotateCcw, Award, ChevronRight, ChevronLeft } from 'lucide-react';

interface ActiveRoundProps {
  round: Round;
  courses: GolfCourse[];
  players: Player[];
  onUpdateScores: (newScores: Record<string, Record<number, number>>) => void;
  onFinishRound: () => void;
  onResetRound: () => void;
}

export const ActiveRound: React.FC<ActiveRoundProps> = ({
  round,
  courses,
  players,
  onUpdateScores,
  onFinishRound,
  onResetRound
}) => {
  const course = courses.find((c) => c.id === round.config.courseId) || courses[0];
  const roundPlayers = players.filter((p) => round.config.playerIds.includes(p.id));

  // Orden de hoyos según startHole (1 o 10)
  // Si comienza en 10: [10, 11, 12, 13, 14, 15, 16, 17, 18, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  // Si comienza en 1: [1, 2, ..., 18]
  const allHoleNumbers = Array.from({ length: 18 }, (_, i) => {
    if (round.config.startHole === 10) {
      return i < 9 ? i + 10 : i - 8;
    }
    return i + 1;
  });

  const front9 = allHoleNumbers.slice(0, 9);
  const back9 = allHoleNumbers.slice(9, 18);

  const [activeTab, setActiveTab] = useState<'scorecard' | 'summary'>('scorecard');

  // Calcular golpes de ventaja por hoyo para cada jugador
  const playerStrokesMap: Record<string, Record<number, number>> = {};
  roundPlayers.forEach((p) => {
    playerStrokesMap[p.id] = calculatePlayerHoleStrokes(p, roundPlayers, course, round.config);
  });

  const handleScoreChange = (playerId: string, holeNumber: number, value: string) => {
    const num = value === '' ? undefined : parseInt(value, 10);
    const updated = {
      ...round.scores,
      [playerId]: {
        ...(round.scores[playerId] || {}),
        [holeNumber]: num !== undefined && !isNaN(num) ? num : (undefined as any)
      }
    };
    onUpdateScores(updated);
  };

  // Totals helper
  const getPlayerTotals = (playerId: string) => {
    const pScores = round.scores[playerId] || {};
    let grossOut = 0;
    let grossIn = 0;
    let netOut = 0;
    let netIn = 0;
    const pStrokes = playerStrokesMap[playerId] || {};

    front9.forEach((hNum) => {
      const g = pScores[hNum];
      if (g !== undefined) {
        grossOut += g;
        const net = calculateNetScore(g, pStrokes[hNum] || 0);
        if (net !== null) netIn += 0; // accumulate
        netOut += net ?? g;
      }
    });

    back9.forEach((hNum) => {
      const g = pScores[hNum];
      if (g !== undefined) {
        grossIn += g;
        const net = calculateNetScore(g, pStrokes[hNum] || 0);
        netIn += net ?? g;
      }
    });

    const totalGross = grossOut + grossIn;
    const totalNet = netOut + netIn;

    return { grossOut, grossIn, totalGross, netOut, netIn, totalNet };
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold">
              {round.config.gameMode === 'contra_base' ? 'Contra la base' : 'Contra el Campo'} ({round.config.percentage}%)
            </span>
            <span className="bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full font-semibold">
              Salida: Hoyo {round.config.startHole}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{course?.name}</h2>
          <p className="text-xs text-slate-500">
            Jugadores en ronda: {roundPlayers.map((p) => p.name).join(', ')}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onFinishRound}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalizar Ronda</span>
          </button>
          <button
            onClick={() => {
              if (confirm('¿Deseas reiniciar o descartar esta ronda?')) onResetRound();
            }}
            className="p-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-2xl transition-colors"
            title="Descartar ronda"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('scorecard')}
          className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'scorecard'
              ? 'bg-emerald-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Tarjeta de Scores (18 Hoyos)
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'summary'
              ? 'bg-emerald-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Resumen y Resultados
        </button>
      </div>

      {activeTab === 'scorecard' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900 text-white text-xs">
                  <th className="py-3 px-4 font-bold sticky left-0 bg-slate-900 z-10 min-w-[140px]">Jugador</th>
                  <th className="py-3 px-2 text-center bg-slate-800">Ida (Out)</th>
                  {front9.map((hNum) => {
                    const holeData = course.holes.find((h) => h.number === hNum);
                    return (
                      <th key={hNum} className="py-3 px-2 text-center min-w-[48px]">
                        <div className="font-bold">H.{hNum}</div>
                        <div className="text-[10px] text-slate-300 font-normal">P{holeData?.par || 4}</div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-2 text-center bg-slate-800">Vuelta (In)</th>
                  {back9.map((hNum) => {
                    const holeData = course.holes.find((h) => h.number === hNum);
                    return (
                      <th key={hNum} className="py-3 px-2 text-center min-w-[48px]">
                        <div className="font-bold">H.{hNum}</div>
                        <div className="text-[10px] text-slate-300 font-normal">P{holeData?.par || 4}</div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-3 text-center bg-emerald-800 font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Fila de Par del Campo */}
                <tr className="bg-slate-50 font-bold text-slate-700">
                  <td className="py-2.5 px-4 sticky left-0 bg-slate-50 z-10">Par del Hoyo</td>
                  <td className="py-2.5 px-2 text-center bg-slate-100">
                    {front9.reduce((sum, h) => sum + (course.holes.find((x) => x.number === h)?.par || 4), 0)}
                  </td>
                  {front9.map((hNum) => (
                    <td key={hNum} className="py-2.5 px-2 text-center text-slate-900">
                      {course.holes.find((x) => x.number === hNum)?.par || 4}
                    </td>
                  ))}
                  <td className="py-2.5 px-2 text-center bg-slate-100">
                    {back9.reduce((sum, h) => sum + (course.holes.find((x) => x.number === h)?.par || 4), 0)}
                  </td>
                  {back9.map((hNum) => (
                    <td key={hNum} className="py-2.5 px-2 text-center text-slate-900">
                      {course.holes.find((x) => x.number === hNum)?.par || 4}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-center bg-emerald-50 text-emerald-900">
                    {course.holes.reduce((sum, h) => sum + h.par, 0)}
                  </td>
                </tr>

                {/* Filas de Jugadores */}
                {roundPlayers.map((player) => {
                  const totals = getPlayerTotals(player.id);
                  const pScores = round.scores[player.id] || {};
                  const pStrokes = playerStrokesMap[player.id] || {};

                  return (
                    <React.Fragment key={player.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 sticky left-0 bg-white font-semibold text-slate-900 z-10 shadow-r">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {player.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold">{player.name}</div>
                              <div className="text-[11px] text-slate-400">Hcp Index: {player.handicapIndex}</div>
                            </div>
                          </div>
                        </td>

                        {/* Totales Out */}
                        <td className="py-3 px-2 text-center bg-slate-50/50 font-bold text-slate-800">
                          {totals.grossOut || '-'}
                        </td>

                        {/* Front 9 scores */}
                        {front9.map((hNum) => {
                          const val = pScores[hNum] !== undefined ? pScores[hNum] : '';
                          const strokesReceived = pStrokes[hNum] || 0;

                          return (
                            <td key={hNum} className="py-2 px-1.5 text-center">
                              <div className="relative inline-block">
                                <input
                                  type="number"
                                  min="1"
                                  max="15"
                                  value={val}
                                  onChange={(e) => handleScoreChange(player.id, hNum, e.target.value)}
                                  className="w-12 h-11 text-center font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                                  placeholder="-"
                                />
                                {strokesReceived > 0 && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-2xs" title={`Golpes de ventaja: ${strokesReceived}`}>
                                    {strokesReceived}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Totales In */}
                        <td className="py-3 px-2 text-center bg-slate-50/50 font-bold text-slate-800">
                          {totals.grossIn || '-'}
                        </td>

                        {/* Back 9 scores */}
                        {back9.map((hNum) => {
                          const val = pScores[hNum] !== undefined ? pScores[hNum] : '';
                          const strokesReceived = pStrokes[hNum] || 0;

                          return (
                            <td key={hNum} className="py-2 px-1.5 text-center">
                              <div className="relative inline-block">
                                <input
                                  type="number"
                                  min="1"
                                  max="15"
                                  value={val}
                                  onChange={(e) => handleScoreChange(player.id, hNum, e.target.value)}
                                  className="w-12 h-11 text-center font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                                  placeholder="-"
                                />
                                {strokesReceived > 0 && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-2xs" title={`Golpes de ventaja: ${strokesReceived}`}>
                                    {strokesReceived}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Total Gross */}
                        <td className="py-3 px-3 text-center bg-emerald-50 font-black text-emerald-900 text-base">
                          {totals.totalGross || '-'}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roundPlayers.map((player) => {
            const totals = getPlayerTotals(player.id);
            const coursePar = course.holes.reduce((sum, h) => sum + h.par, 0);
            const vsPar = totals.totalGross ? totals.totalGross - coursePar : null;

            return (
              <div key={player.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-lg">
                      {player.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{player.name}</h3>
                      <p className="text-xs text-slate-500">Hcp Index: {player.handicapIndex}</p>
                    </div>
                  </div>
                  {vsPar !== null && (
                    <span
                      className={`text-sm font-black px-3 py-1.5 rounded-2xl ${
                        vsPar === 0
                          ? 'bg-slate-100 text-slate-800'
                          : vsPar < 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : vsPar}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <div className="text-xs text-slate-500 font-semibold uppercase">Gross Total</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">{totals.totalGross || '-'}</div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-2xl">
                    <div className="text-xs text-emerald-700 font-semibold uppercase">Ida / Vuelta</div>
                    <div className="text-sm font-bold text-emerald-900 mt-1">
                      {totals.grossOut || 0} / {totals.grossIn || 0}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
