import React, { useState } from 'react';
import { Round, GolfCourse, Player } from '../types';
import { ScorecardView } from './ScorecardView';
import { SindicatoView } from './SindicatoView';
import { ParejasView } from './ParejasView';
import { MatchView } from './MatchView';
import { IndividualesView } from './IndividualesView';
import { PerifericosView } from './PerifericosView';
import { MonedasView } from './MonedasView';
import { LiquidacionView } from './LiquidacionView';
import { FileText, Trophy, Users, Sparkles, Swords, DollarSign, Award, Calculator } from 'lucide-react';

interface ActiveRoundHubProps {
  round: Round;
  courses: GolfCourse[];
  players: Player[];
  onUpdateScores: (newScores: Record<string, Record<number, number>>) => void;
  onUpdateRound: (updatedRound: Round) => void;
  onFinishRound: () => void;
  onResetRound: () => void;
}

export const ActiveRoundHub: React.FC<ActiveRoundHubProps> = ({
  round,
  courses,
  players,
  onUpdateScores,
  onUpdateRound,
  onFinishRound,
  onResetRound
}) => {
  const [activeSubView, setActiveSubView] = useState<'scorecard' | 'sindicato' | 'parejas' | 'individuales' | 'match' | 'perifericos' | 'monedas' | 'liquidacion'>('scorecard');

  const course = courses.find((c) => c.id === round.config.courseId) || courses[0];
  const roundPlayers = players.filter((p) => round.config.playerIds.includes(p.id));

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

  return (
    <div className="pb-28">
      {activeSubView === 'scorecard' && (
        <ScorecardView
          round={round}
          course={course}
          roundPlayers={roundPlayers}
          onUpdateScores={onUpdateScores}
          onUpdateRound={onUpdateRound}
          onNavigate={setActiveSubView}
          onFinishRound={onFinishRound}
          onResetRound={onResetRound}
        />
      )}

      {activeSubView === 'sindicato' && (
        <SindicatoView
          round={round}
          course={course}
          roundPlayers={roundPlayers}
          onBack={() => setActiveSubView('scorecard')}
        />
      )}

      {activeSubView === 'parejas' && (
        <ParejasView
          round={round}
          course={course}
          roundPlayers={roundPlayers}
          onUpdateRound={onUpdateRound}
          onBack={() => setActiveSubView('scorecard')}
        />
      )}

      {activeSubView === 'individuales' && (
        <IndividualesView
          round={round}
          course={course}
          roundPlayers={roundPlayers}
          onUpdateRound={onUpdateRound}
          onBack={() => setActiveSubView('scorecard')}
        />
      )}

      {activeSubView === 'match' && (
        <MatchView
          round={round}
          course={course}
          roundPlayers={roundPlayers}
          onBack={() => setActiveSubView('scorecard')}
        />
      )}

      {activeSubView === 'monedas' && (
        <MonedasView
          round={round}
          course={course}
          roundPlayers={roundPlayers}
          onUpdateRound={onUpdateRound}
          onBack={() => setActiveSubView('scorecard')}
        />
      )}

      {activeSubView === 'perifericos' && (
        <PerifericosView
          round={round}
          course={course}
          roundPlayers={roundPlayers}
          onUpdateRound={onUpdateRound}
          onBack={() => setActiveSubView('scorecard')}
        />
      )}

      {activeSubView === 'liquidacion' && (
        <LiquidacionView
          round={round}
          course={course}
          roundPlayers={roundPlayers}
          onNavigate={(sub) => setActiveSubView(sub === 'hub' ? 'scorecard' : (sub as any))}
          onBack={() => setActiveSubView('scorecard')}
          onUpdateRound={onUpdateRound}
        />
      )}

      {/* Sticky Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 z-40 shadow-lg space-y-2">
        <div className="max-w-5xl mx-auto space-y-2">
          {/* 1. Scorecard button on top, occupying full width */}
          <button
            type="button"
            onClick={() => setActiveSubView('scorecard')}
            className={`w-full py-3 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              activeSubView === 'scorecard'
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Scorecard</span>
          </button>

          {/* 2. Horizontal scrolling betting buttons below Scorecard (only active bets) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'sindicato', label: 'Sindicato', icon: Trophy, color: 'bg-amber-100 text-amber-800', enabled: activeBets.sindicato !== false },
              { id: 'parejas', label: 'Parejas', icon: Users, color: 'bg-emerald-100 text-emerald-800', enabled: activeBets.parejas !== false },
              { id: 'individuales', label: 'Individuales', icon: Sparkles, color: 'bg-purple-100 text-purple-800', enabled: activeBets.individuales !== false },
              { id: 'match', label: 'Match Play', icon: Swords, color: 'bg-rose-100 text-rose-800', enabled: activeBets.match !== false },
              { id: 'perifericos', label: 'Periféricos', icon: DollarSign, color: 'bg-emerald-100 text-emerald-800', enabled: activeBets.perifericos !== false },
              { id: 'monedas', label: 'Monedas', icon: Award, color: 'bg-amber-100 text-amber-800', enabled: isMonedasActive },
              { id: 'liquidacion', label: 'Liquidación', icon: Calculator, color: 'bg-blue-100 text-blue-800', enabled: true },
            ]
              .filter((tab) => tab.enabled)
              .map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSubView(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/20 text-white' : tab.color}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
