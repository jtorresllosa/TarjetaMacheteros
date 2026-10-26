import React, { useState, useRef, useEffect } from 'react';
import { GolfCourse, Player, Round } from '../types';
import { calculatePlayerHoleStrokes, calculateNetScore, calculateRoundHandicaps, getSortedRoundPlayers } from '../utils/golfCalculations';
import { checkActiveBye } from '../utils/parejasCalculations';
import { FileText, ChevronRight, ChevronLeft, Check, Edit2, AlertTriangle, Trophy, Users, Sparkles, Swords, DollarSign, Award, Calculator, RotateCcw, Download } from 'lucide-react';

interface ScorecardViewProps {
  round: Round;
  course: GolfCourse;
  roundPlayers: Player[];
  onUpdateScores: (newScores: Record<string, Record<number, number>>) => void;
  onUpdateRound?: (updatedRound: Round) => void;
  onNavigate: (subView: 'scorecard' | 'sindicato' | 'parejas' | 'individuales' | 'match' | 'perifericos' | 'monedas' | 'liquidacion') => void;
  onFinishRound: () => void;
  onResetRound: () => void;
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({
  round,
  course,
  roundPlayers,
  onUpdateScores,
  onUpdateRound,
  onNavigate,
  onFinishRound,
  onResetRound
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

  const findCurrentHoleToPlay = () => {
    for (const hNum of allHoleNumbers) {
      const hasAllScores = sortedPlayers.every((p) => {
        const s = round.scores[p.id]?.[hNum];
        return s !== undefined && s !== null && !isNaN(s);
      });
      if (!hasAllScores) {
        return hNum;
      }
    }
    return allHoleNumbers[0];
  };

  const initialHole = findCurrentHoleToPlay();
  const isInitialInFirst9 = first9Holes.includes(initialHole);

  const [activeScreen, setActiveScreen] = useState<'screen1' | 'screen2' | 'summary'>(
    isInitialInFirst9 ? 'screen1' : 'screen2'
  );
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const activeBye = checkActiveBye(round, roundPlayers, course);

  const [byeAcceptedChoice, setByeAcceptedChoice] = React.useState<boolean | null>(null);
  const [byeLeonChoice, setByeLeonChoice] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setByeAcceptedChoice(null);
    setByeLeonChoice(null);
  }, [activeBye?.rotationIndex, activeBye?.type]);

  const handleResolveBye = (rotationIndex: number, type: 'bye' | 'rebye', accepted: boolean, leonAccepted: boolean) => {
    if (onUpdateRound) {
      const existing = round.parejasByeStates?.[rotationIndex] || {};
      const updatedRound: Round = {
        ...round,
        parejasByeStates: {
          ...(round.parejasByeStates || {}),
          [rotationIndex]: {
            ...existing,
            ...(type === 'bye' ? {
              byeResolved: true,
              byeAccepted: accepted,
              byeLeonAccepted: leonAccepted,
              byeHoleIndex: activeBye?.byeHoleIndex ?? 0
            } : {
              rebyeResolved: true,
              rebyeAccepted: accepted,
              rebyeLeonAccepted: leonAccepted
            })
          }
        }
      };
      onUpdateRound(updatedRound);

      let targetHole = allHoleNumbers[0];
      for (const hNum of allHoleNumbers) {
        const hasAllScores = sortedPlayers.every((p) => {
          const s = updatedRound.scores[p.id]?.[hNum];
          return s !== undefined && s !== null && !isNaN(s);
        });
        if (!hasAllScores) {
          targetHole = hNum;
          break;
        }
      }

      const isInFirst9 = first9Holes.includes(targetHole);
      setActiveScreen(isInFirst9 ? 'screen1' : 'screen2');
      setTimeout(() => {
        if (holeRowRefs.current[targetHole]) {
          holeRowRefs.current[targetHole]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const confirmedHoles = round.confirmedHoles || {};
  const inputRefs = useRef<Record<number, Record<number, HTMLInputElement | null>>>({});
  const holeRowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});

  const playerStrokesMap: Record<string, Record<number, number>> = {};
  roundPlayers.forEach((p) => {
    playerStrokesMap[p.id] = calculatePlayerHoleStrokes(p, roundPlayers, course, round.config);
  });

  useEffect(() => {
    const targetHole = findCurrentHoleToPlay();
    if (holeRowRefs.current[targetHole]) {
      holeRowRefs.current[targetHole]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeScreen]);

  const handleScoreChange = (playerId: string, holeNumber: number, value: string, playerIndex: number) => {
    const num = value === '' ? undefined : parseInt(value, 10);
    const updated = {
      ...round.scores,
      [playerId]: {
        ...(round.scores[playerId] || {}),
        [holeNumber]: num !== undefined && !isNaN(num) ? num : (undefined as any)
      }
    };
    onUpdateScores(updated);

    if (value.length >= 1 && playerIndex < sortedPlayers.length - 1) {
      const nextInput = inputRefs.current[holeNumber]?.[playerIndex + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, holeNumber: number, playerIndex: number) => {
    if (e.key === 'Enter' && playerIndex < sortedPlayers.length - 1) {
      e.preventDefault();
      const nextInput = inputRefs.current[holeNumber]?.[playerIndex + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const toggleConfirmHole = (holeNumber: number) => {
    if (!onUpdateRound) return;
    const updatedConfirmed = {
      ...confirmedHoles,
      [holeNumber]: !confirmedHoles[holeNumber]
    };
    const updatedRound: Round = {
      ...round,
      confirmedHoles: updatedConfirmed
    };
    onUpdateRound(updatedRound);
  };

  const getPlayerTotals = (playerId: string) => {
    const pScores = round.scores[playerId] || {};
    let sumFirst9Gross = 0;
    let sumSecond9Gross = 0;

    first9Holes.forEach((hNum) => {
      const g = pScores[hNum];
      if (g !== undefined) {
        sumFirst9Gross += g;
      }
    });

    second9Holes.forEach((hNum) => {
      const g = pScores[hNum];
      if (g !== undefined) {
        sumSecond9Gross += g;
      }
    });

    const totalGross = sumFirst9Gross + sumSecond9Gross;
    const player = roundPlayers.find((p) => p.id === playerId);
    const effectiveHcp =
      round.config.roundHandicaps?.[playerId] !== undefined
        ? round.config.roundHandicaps[playerId]
        : (player?.handicapIndex || 0);

    const totalNet = totalGross > 0 ? totalGross - effectiveHcp : 0;

    return { sumFirst9Gross, sumSecond9Gross, totalGross, totalNet, effectiveHcp };
  };

  const handleExportCSV = () => {
    const courseName = course.name.replace(/,/g, '');
    const mode = round.config.gameMode === 'contra_base' ? 'Contra la base' : 'Contra el Campo';
    
    let csvRows: string[] = [];
    csvRows.push(`Campo: "${courseName}"`);
    csvRows.push(`Modalidad: "${mode} (${round.config.percentage}%)"`);
    csvRows.push(`Fecha: "${new Date().toLocaleDateString()}"`);
    csvRows.push('');

    let headerRow = ['Hoyo', 'Par', 'Hcp'];
    sortedPlayers.forEach(p => {
      headerRow.push(`${p.name} (Gross)`, `${p.name} (Neto)`);
    });
    csvRows.push(headerRow.join(','));

    allHoleNumbers.forEach(hNum => {
      const hData = course.holes.find(h => h.number === hNum);
      const par = hData?.par || 4;
      const hcp = hData?.handicap || '-';
      
      let row: (string | number)[] = [hNum, par, hcp];
      sortedPlayers.forEach(p => {
        const pScores = round.scores[p.id] || {};
        const gross = pScores[hNum] !== undefined ? pScores[hNum] : '';
        const strokes = playerStrokesMap[p.id]?.[hNum] || 0;
        const net = gross !== '' ? calculateNetScore(gross, strokes) : '';
        row.push(gross !== '' ? gross : '', net !== null ? net : '');
      });
      csvRows.push(row.join(','));
    });

    let totalPar = course.holes.reduce((sum, h) => sum + h.par, 0);
    let totalRow: (string | number)[] = ['Total', totalPar, '-'];
    sortedPlayers.forEach(p => {
      const totals = getPlayerTotals(p.id);
      totalRow.push(totals.totalGross || 0, totals.totalNet || 0);
    });
    csvRows.push(totalRow.join(','));

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `scorecard_${course.name.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Round Header Info */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white p-5 sm:p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-emerald-700/30 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1 relative z-10">
          <span className="bg-emerald-800/80 px-3 py-1 rounded-full text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">
            {round.config.gameMode === 'contra_base' ? 'Contra la base' : 'Contra el Campo'} ({round.config.percentage}%)
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{course.name}</h2>
          <p className="text-xs text-emerald-200">
            Salida: Hoyo {round.config.startHole} | Jugadores: {roundPlayers.map((p) => p.initials || p.name).join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Exportar Ronda a Hoja de Cálculo"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Ronda</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFinishConfirm(true)}
            className="p-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl transition-colors shadow-sm cursor-pointer"
            title="Finalizar Ronda"
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowDiscardConfirm(true)}
            className="p-2.5 bg-emerald-950/60 hover:bg-rose-900/60 text-emerald-200 hover:text-white rounded-2xl transition-colors cursor-pointer"
            title="Descartar Ronda"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>



      {/* Screen selector for scorecard */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
        <h3 className="font-extrabold text-slate-900 text-sm">Tarjeta de Golpes</h3>
        <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveScreen('screen1')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScreen === 'screen1'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isStartHole10 ? 'Vuelta In (10-18)' : 'Vuelta Out (1-9)'}
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('screen2')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScreen === 'screen2'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isStartHole10 ? 'Vuelta Out (1-9)' : 'Vuelta In (10-18)'}
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('summary')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScreen === 'summary'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Totales
          </button>
        </div>
      </div>

      {activeBye && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  ¡Alerta de {activeBye.type === 'bye' ? 'Bye' : 'ReBye'}!
                </h3>
                <p className="text-xs text-slate-500 font-medium">{activeBye.rotationName}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center">
              <p className="text-base font-extrabold text-amber-900">
                Ganó la pareja {activeBye.winningInitials} a la pareja {activeBye.losingInitials}
              </p>
              <p className="text-xs font-bold text-amber-800 mt-1">
                Marcador acumulado: {activeBye.cumP1} - {activeBye.cumP2}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  {activeBye.type === 'bye' ? '¿Aceptas Bye?' : '¿Aceptas ReBye?'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setByeAcceptedChoice(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      byeAcceptedChoice === true
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setByeAcceptedChoice(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      byeAcceptedChoice === false
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  {activeBye.type === 'bye' ? '¿Bye León?' : '¿ReBye León?'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setByeLeonChoice(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      byeLeonChoice === true
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setByeLeonChoice(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      byeLeonChoice === false
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={byeAcceptedChoice === null || byeLeonChoice === null}
                onClick={() => {
                  if (byeAcceptedChoice !== null && byeLeonChoice !== null) {
                    handleResolveBye(activeBye.rotationIndex, activeBye.type, byeAcceptedChoice, byeLeonChoice);
                  }
                }}
                className={`w-full py-3 rounded-2xl text-xs font-black transition-all shadow-md ${
                  byeAcceptedChoice !== null && byeLeonChoice !== null
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Confirmar y Continuar Jugando
              </button>
              {(byeAcceptedChoice === null || byeLeonChoice === null) && (
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Debes responder ambas preguntas antes de continuar.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen 1 o Screen 2 */}
      {(activeScreen === 'screen1' || activeScreen === 'screen2') && (() => {
        const currentHoles = activeScreen === 'screen1' ? first9Holes : second9Holes;
        const sectionTitle = activeScreen === 'screen1'
          ? (isStartHole10 ? 'Vuelta In (Hoyos 10 al 18)' : 'Vuelta Out (Hoyos 1 al 9)')
          : (isStartHole10 ? 'Vuelta Out (Hoyos 1 al 9)' : 'Vuelta In (Hoyos 10 al 18)');

        const sectionPar = currentHoles.reduce((acc, hNum) => acc + (course.holes.find((h) => h.number === hNum)?.par || 4), 0);

        return (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 font-bold text-sm flex justify-between items-center">
              <span>{sectionTitle}</span>
              <span className="text-xs bg-slate-800 px-3 py-1 rounded-xl">Par: {sectionPar}</span>
            </div>

            <div className="overflow-x-hidden max-h-[70vh] overflow-y-auto">
              <table className="w-full text-center text-xs sm:text-sm" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-slate-200 text-slate-800 border-b border-slate-300 sticky top-0 z-30 shadow-xs">
                    <th className="py-2 px-1 text-left font-bold sticky left-0 bg-slate-200 z-45 shadow-r" style={{ width: '24%' }}>Hoyo</th>
                    {sortedPlayers.map((player) => {
                      const hcpData = hcpMap.get(player.id);
                      const displayHcp = hcpData ? hcpData.playingHandicap : 0;
                      return (
                        <th key={player.id} className="py-2 px-0.5 font-bold bg-slate-200 overflow-hidden" style={{ width: `${62 / sortedPlayers.length}%` }}>
                          <div className="text-slate-900 text-[11px] sm:text-xs font-black truncate">{player.initials}</div>
                          <div className="text-[9px] text-emerald-800 font-extrabold bg-emerald-100/80 px-1 py-0.2 rounded-full mt-0.5 inline-block">
                            Hcb: {displayHcp}
                          </div>
                        </th>
                      );
                    })}
                    <th className="py-2 px-1 font-bold bg-slate-200 text-slate-700" style={{ width: '14%' }}>Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentHoles.map((hNum) => {
                    const holeData = course.holes.find((h) => h.number === hNum);
                    const isConfirmed = confirmedHoles[hNum] || false;
                    const isCurrentToPlay = hNum === findCurrentHoleToPlay();

                    return (
                      <tr
                        key={hNum}
                        ref={(el) => { holeRowRefs.current[hNum] = el; }}
                        className={`transition-colors ${
                          isCurrentToPlay ? 'bg-emerald-50/50 border-l-4 border-emerald-600' : isConfirmed ? 'bg-emerald-50/20' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-2 px-2 text-left sticky left-0 bg-slate-100/90 z-20 shadow-r truncate">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 font-bold text-slate-900 text-xs sm:text-sm">
                              <span>H.{hNum}</span>
                              {isConfirmed && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Confirmado"></span>
                              )}
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 truncate">
                              Par {holeData?.par || 4} • Hcp {holeData?.handicap || '-'}
                            </span>
                          </div>
                        </td>

                        {sortedPlayers.map((player, pIdx) => {
                          const pScores = round.scores[player.id] || {};
                          const val = pScores[hNum] !== undefined ? pScores[hNum] : '';
                          const strokesReceived = playerStrokesMap[player.id]?.[hNum] || 0;
                          const netVal = calculateNetScore(pScores[hNum], strokesReceived);
                          const hasStrokes = strokesReceived > 0;

                          return (
                            <td
                              key={player.id}
                              className={`py-1.5 px-1 transition-colors ${
                                hasStrokes ? 'bg-amber-50/70' : ''
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                {isConfirmed ? (
                                  <div className="w-full max-w-[42px] h-9 flex flex-col items-center justify-center font-bold text-slate-900 text-xs bg-white border border-slate-200 rounded-lg mx-auto">
                                    <span>{val !== '' && val !== undefined ? val : '-'}</span>
                                    {val !== '' && val !== undefined && netVal !== null && (
                                      <span className="text-[9px] font-semibold text-slate-500 leading-none">
                                        ({netVal})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <input
                                      type="number"
                                      min="1"
                                      max="15"
                                      ref={(el) => {
                                        if (!inputRefs.current[hNum]) inputRefs.current[hNum] = {};
                                        inputRefs.current[hNum][pIdx] = el;
                                      }}
                                      value={val}
                                      onChange={(e) => handleScoreChange(player.id, hNum, e.target.value, pIdx)}
                                      onKeyDown={(e) => handleKeyDown(e, hNum, pIdx)}
                                      onWheel={(e) => e.currentTarget.blur()}
                                      className={`w-full max-w-[42px] h-9 text-center font-bold text-slate-900 border rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none mx-auto ${
                                        hasStrokes ? 'bg-amber-100/60 border-amber-300' : 'bg-slate-50 border-slate-200'
                                      }`}
                                      placeholder="-"
                                    />
                                    {val !== '' && netVal !== null && (
                                      <span className="text-[10px] font-bold text-slate-600 leading-none">
                                        ({netVal})
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        <td className="py-1.5 px-1 text-center">
                          {isConfirmed ? (
                            <button
                              type="button"
                              onClick={() => toggleConfirmHole(hNum)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 mx-auto cursor-pointer shadow-2xs"
                              title="Editar"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleConfirmHole(hNum)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 mx-auto cursor-pointer shadow-2xs"
                              title="Confirmar"
                            >
                              <Check className="w-3 h-3" />
                              <span className="hidden sm:inline">OK</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Subtotal de la sección */}
                  <tr className="bg-slate-200/90 font-extrabold text-slate-900 text-xs">
                    <td className="py-2.5 px-2 text-left sticky left-0 bg-slate-300 z-20 shadow-r truncate">
                      <div>Total</div>
                      <div className="text-[9px] text-slate-700 font-bold">
                        Par {sectionPar}
                      </div>
                    </td>
                    {sortedPlayers.map((player) => {
                      const pScores = round.scores[player.id] || {};
                      let grossTotal = 0;
                      let netTotal = 0;
                      currentHoles.forEach((hNum) => {
                        const g = pScores[hNum];
                        if (g !== undefined) {
                          grossTotal += g;
                          const net = calculateNetScore(g, playerStrokesMap[player.id]?.[hNum] || 0);
                          netTotal += net ?? g;
                        }
                      });
                      return (
                        <td key={player.id} className="py-2.5 px-1 text-emerald-900 text-[11px] sm:text-xs truncate">
                          <div>{grossTotal || '-'} <span className="text-slate-500 font-normal">({netTotal || '-'})</span></div>
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-1">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-100">
              {activeScreen === 'screen1' ? (
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => setActiveScreen('screen2')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Siguiente Vuelta</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex justify-between w-full">
                  <button
                    type="button"
                    onClick={() => setActiveScreen('screen1')}
                    className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Vuelta Anterior</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('summary')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Ver Totales</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Screen 3: Totales y Resumen */}
      {activeScreen === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Resumen General de la Ronda</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPlayers.map((player) => {
                const totals = getPlayerTotals(player.id);
                const coursePar = course.holes.reduce((sum, h) => sum + h.par, 0);
                const vsPar = totals.totalGross ? totals.totalGross - coursePar : null;
                const hcpData = hcpMap.get(player.id);

                return (
                  <div key={player.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                          {player.initials}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{player.name}</h4>
                          <p className="text-[11px] text-emerald-700 font-bold">Hcb: {hcpData?.playingHandicap ?? 0}</p>
                        </div>
                      </div>
                      {vsPar !== null && (
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                            vsPar === 0
                              ? 'bg-slate-200 text-slate-800'
                              : vsPar < 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : vsPar}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200/60">
                      <div className="bg-white p-2.5 rounded-2xl border border-slate-100">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Gross Total</div>
                        <div className="text-lg font-black text-slate-900">{totals.totalGross || '-'}</div>
                      </div>
                      <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-200">
                        <div className="text-[10px] text-slate-600 font-semibold uppercase">Handicap</div>
                        <div className="text-lg font-black text-slate-900">{hcpData?.rawHandicap ?? player.handicapIndex}</div>
                      </div>
                      <div className="bg-emerald-900 text-white p-2.5 rounded-2xl">
                        <div className="text-[10px] text-emerald-200 font-semibold uppercase">Neto Total</div>
                        <div className="text-lg font-black">{totals.totalNet || '-'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setActiveScreen('screen1')}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver a la Tarjeta</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">¿Descartar esta ronda?</h3>
            <p className="text-sm text-slate-500">
              Esta acción eliminará la ronda actual, incluyendo todos los scores ingresados y apuestas registradas. No se puede deshacer.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onResetRound();
                }}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-rose-600/30 cursor-pointer text-sm"
              >
                Sí, Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">¿Finalizar esta ronda?</h3>
            <p className="text-sm text-slate-500">
              ¿Deseas finalizar la ronda actual? Esto cerrará la ronda y volverá a la pantalla principal.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFinishConfirm(false);
                  onFinishRound();
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/30 cursor-pointer text-sm"
              >
                Sí, Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
