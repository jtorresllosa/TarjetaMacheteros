import React, { useState, useEffect } from 'react';
import { GolfCourse, Player, Round, RoundConfig } from './types';
import { INITIAL_COURSES, INITIAL_PLAYERS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { CourseManager } from './components/CourseManager';
import { PlayerManager } from './components/PlayerManager';
import { RoundSetup } from './components/RoundSetup';
import { ActiveRoundHub } from './components/ActiveRoundHub';
import { UserLoginModal } from './components/UserLoginModal';
import { CreatorPanel } from './components/CreatorPanel';
import { Flag } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('golf_current_user');
  });

  const [courses, setCourses] = useState<GolfCourse[]>(() => {
    const saved = localStorage.getItem('golf_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('golf_players');
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });

  const [activeRound, setActiveRound] = useState<Round | null>(() => {
    const saved = localStorage.getItem('golf_active_round');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'setup' | 'active' | 'courses' | 'players' | 'creator'>(() => {
    const savedRound = localStorage.getItem('golf_active_round');
    return savedRound ? 'active' : 'setup';
  });

  useEffect(() => {
    localStorage.setItem('golf_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('golf_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    if (activeRound) {
      localStorage.setItem('golf_active_round', JSON.stringify(activeRound));
    } else {
      localStorage.removeItem('golf_active_round');
    }
  }, [activeRound]);

  const handleStartRound = (config: RoundConfig) => {
    const newRound: Round = {
      id: 'round-' + Date.now(),
      date: new Date().toISOString(),
      config,
      scores: {},
      status: 'active',
      activeBets: config.activeBets
    };
    setActiveRound(newRound);
    setActiveTab('active');
  };

  const handleUpdateScores = (newScores: Record<string, Record<number, number>>) => {
    if (activeRound) {
      setActiveRound({
        ...activeRound,
        scores: newScores
      });
    }
  };

  const handleUpdateRound = (updatedRound: Round) => {
    setActiveRound(updatedRound);
  };

  const handleFinishRound = () => {
    if (confirm('¿Deseas finalizar la ronda actual?')) {
      setActiveRound(null);
      setActiveTab('setup');
    }
  };

  const handleResetRound = () => {
    setActiveRound(null);
    setActiveTab('setup');
  };

  return (
    <div className="min-h-screen bg-slate-900/5 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {!currentUser && (
        <UserLoginModal
          onLoginSuccess={(name) => {
            setCurrentUser(name);
          }}
        />
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveRound={activeRound !== null}
        currentUser={currentUser}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'setup' && (
          <RoundSetup
            courses={courses}
            players={players}
            onStartRound={handleStartRound}
          />
        )}

        {activeTab === 'active' && activeRound && (
          <ActiveRoundHub
            round={activeRound}
            courses={courses}
            players={players}
            onUpdateScores={handleUpdateScores}
            onUpdateRound={handleUpdateRound}
            onFinishRound={handleFinishRound}
            onResetRound={handleResetRound}
          />
        )}

        {activeTab === 'active' && !activeRound && (
          <div className="max-w-md mx-auto p-8 text-center space-y-4 my-12 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center">
              <Flag className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No hay ninguna ronda activa</h3>
            <p className="text-sm text-slate-500">
              Configura una nueva ronda para comenzar a registrar los goles y apuestas.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('setup')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Configurar Nueva Ronda
            </button>
          </div>
        )}

        {activeTab === 'courses' && (
          <CourseManager courses={courses} setCourses={setCourses} />
        )}

        {activeTab === 'players' && (
          <PlayerManager players={players} setPlayers={setPlayers} />
        )}

        {activeTab === 'creator' && (
          <CreatorPanel onClose={() => setActiveTab(activeRound ? 'active' : 'setup')} />
        )}
      </main>
    </div>
  );
}
