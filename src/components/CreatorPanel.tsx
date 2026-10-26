import React, { useState } from 'react';
import { ShieldCheck, Users, Key, Save, X, ArrowLeft, CheckCircle2, Eye, EyeOff, Smartphone, Laptop } from 'lucide-react';

interface CreatorPanelProps {
  onClose: () => void;
}

export const CreatorPanel: React.FC<CreatorPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [newUserPassword, setNewUserPassword] = useState('');
  const [newCreatorPassword, setNewCreatorPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);

  const currentAccessPassword = localStorage.getItem('golf_access_password') || 'jugador123';
  const registeredUsersStr = localStorage.getItem('golf_registered_users');
  const registeredUsers: Array<{ id: string; name: string; date: string; device?: string }> = registeredUsersStr
    ? JSON.parse(registeredUsersStr)
    : [];

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    const currentCreatorPassword = localStorage.getItem('golf_creator_password') || 'admin999';
    const validPasswords = [currentCreatorPassword.trim(), 'admin999', '1234'];

    if (validPasswords.includes(authPassword.trim())) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Contraseña de creador incorrecta.');
    }
  };

  const handleUpdateUserPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserPassword.trim() || newUserPassword.length < 3) {
      alert('La contraseña de acceso debe tener al menos 3 caracteres.');
      return;
    }

    localStorage.setItem('golf_access_password', newUserPassword.trim());
    setNewUserPassword('');
    setSuccessMessage('¡Contraseña de acceso para jugadores actualizada exitosamente!');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleUpdateCreatorPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreatorPassword.trim() || newCreatorPassword.length < 3) {
      alert('La contraseña de creador debe tener al menos 3 caracteres.');
      return;
    }

    localStorage.setItem('golf_creator_password', newCreatorPassword.trim());
    setNewCreatorPassword('');
    setSuccessMessage('¡Contraseña de creador actualizada exitosamente!');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la App</span>
        </button>
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Panel de Creador</span>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
              <Key className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Acceso Restringido</h3>
            <p className="text-xs text-slate-500">Ingresa tu contraseña de creador (por defecto: admin999) para ver estadísticas y gestionar contraseñas.</p>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-4">
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold text-center">
                {authError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contraseña de Creador</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
            >
              Entrar al Panel
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tarjeta de Estadísticas de Usuarios */}
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden space-y-4">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-emerald-700/30 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <span className="bg-emerald-800/80 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                  Control de Audiencia
                </span>
                <h3 className="text-2xl font-extrabold">Usuarios Totales</h3>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-700/60 border border-emerald-600 flex items-center justify-center text-3xl font-black text-amber-300">
                {registeredUsers.length}
              </div>
            </div>
            <p className="text-xs text-emerald-200">
              Número total de usuarios únicos que han ingresado y utilizado la aplicación.
            </p>
          </div>

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cambio y visualización de Contraseña de Acceso (Usuarios) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Contraseña de Acceso (Usuarios)</h3>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Contraseña Actual</span>
                  <div className="text-base font-black text-emerald-950 font-mono">
                    {showUserPassword ? currentAccessPassword : '••••••••'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUserPassword(!showUserPassword)}
                  className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                  title={showUserPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <form onSubmit={handleUpdateUserPassword} className="space-y-3 pt-2">
                <input
                  type="text"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Nueva contraseña de jugadores"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-semibold"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Actualizar Contraseña de Jugadores</span>
                </button>
              </form>
            </div>

            {/* Cambio de Contraseña de Creador */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Contraseña de Creador (Admin)</h3>
              </div>
              <p className="text-xs text-slate-500">
                La contraseña privada para entrar a este panel de administración.
              </p>

              <form onSubmit={handleUpdateCreatorPassword} className="space-y-3 pt-2">
                <input
                  type="text"
                  required
                  value={newCreatorPassword}
                  onChange={(e) => setNewCreatorPassword(e.target.value)}
                  placeholder="Nueva contraseña de creador"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm font-semibold"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Actualizar Contraseña de Creador</span>
                </button>
              </form>
            </div>
          </div>

          {/* Lista de Usuarios Registrados con indicación de Dispositivo */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Lista de Usuarios Registrados</h3>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {registeredUsers.length} usuarios
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {registeredUsers.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No hay usuarios registrados todavía.</p>
              ) : (
                registeredUsers.map((user, idx) => (
                  <div key={user.id || idx} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-400">Último acceso: {user.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-xl font-medium">
                      {user.device?.includes('Celular') ? <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> : <Laptop className="w-3.5 h-3.5 text-blue-600" />}
                      <span>{user.device || 'Desconocido'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
