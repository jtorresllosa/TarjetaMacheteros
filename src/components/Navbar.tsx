import React, { useState } from 'react';
import { Flag, Users, MapPin, Play, Trophy, ShieldCheck, Download, Upload } from 'lucide-react';

interface NavbarProps {
  activeTab: 'setup' | 'active' | 'courses' | 'players' | 'creator';
  setActiveTab: (tab: 'setup' | 'active' | 'courses' | 'players' | 'creator') => void;
  hasActiveRound: boolean;
  currentUser: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, hasActiveRound, currentUser }) => {
  const [showShareModal, setShowShareModal] = useState(false);

  const handleExportData = () => {
    const backup = {
      courses: localStorage.getItem('golf_courses'),
      players: localStorage.getItem('golf_players'),
      activeRound: localStorage.getItem('golf_active_round'),
      currentUser: localStorage.getItem('golf_current_user'),
      accessPassword: localStorage.getItem('golf_access_password'),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `golf_apuestas_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (backup.courses) localStorage.setItem('golf_courses', backup.courses);
        if (backup.players) localStorage.setItem('golf_players', backup.players);
        if (backup.activeRound) localStorage.setItem('golf_active_round', backup.activeRound);
        if (backup.currentUser) localStorage.setItem('golf_current_user', backup.currentUser);
        if (backup.accessPassword) localStorage.setItem('golf_access_password', backup.accessPassword);
        alert('¡Datos restaurados exitosamente! La página se recargará.');
        window.location.reload();
      } catch (err) {
        alert('Error al leer el archivo de respaldo.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header className="bg-emerald-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab(hasActiveRound ? 'active' : 'setup')}>
            <div className="bg-emerald-700 p-2 rounded-xl shadow-inner flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Golf y Apuestas</h1>
              <p className="text-xs text-emerald-200">
                {currentUser ? `Hola, ${currentUser}` : 'Tu compañero de ronda'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
              title="Respaldar / Restaurar Datos"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Respaldo</span>
            </button>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2 bg-emerald-950/60 p-1.5 rounded-2xl border border-emerald-800/60 overflow-x-auto max-w-full">
            {hasActiveRound && (
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                    : 'text-emerald-100 hover:bg-emerald-800/60'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Ronda Activa</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('setup')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-emerald-600 text-white font-semibold shadow-md'
                  : 'text-emerald-100 hover:bg-emerald-800/60'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>Nueva Ronda</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'courses'
                  ? 'bg-emerald-600 text-white font-semibold shadow-md'
                  : 'text-emerald-100 hover:bg-emerald-800/60'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Campos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('players')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'players'
                  ? 'bg-emerald-600 text-white font-semibold shadow-md'
                  : 'text-emerald-100 hover:bg-emerald-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Jugadores</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('creator')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'creator'
                  ? 'bg-amber-600 text-white font-semibold shadow-md'
                  : 'text-amber-200 hover:bg-emerald-800/60'
              }`}
              title="Panel de Creador"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Creador</span>
            </button>
          </nav>
        </div>
      </header>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Respaldo de Datos</h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Respaldo y Restauración</label>
                <p className="text-xs text-slate-500">
                  Para evitar perder tus scores o partidas cuando el navegador limpia la caché, puedes descargar un respaldo en formato JSON y restaurarlo en cualquier momento.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Exportar Datos</span>
                  </button>

                  <label className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs cursor-pointer border border-emerald-200">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Importar Datos</span>
                    <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


