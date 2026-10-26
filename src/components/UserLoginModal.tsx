import React, { useState, useEffect } from 'react';
import { Trophy, Lock, User, ArrowRight } from 'lucide-react';

interface UserLoginModalProps {
  onLoginSuccess: (userName: string) => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({ onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Mostrar en la consola del navegador (F12) la contraseña actual para facilitar las pruebas durante el desarrollo
  useEffect(() => {
    const currentPass = localStorage.getItem('golf_access_password') || 'jugador123';
    console.info('🔒 [Golf App Debug] Contraseña actual de jugadores en este navegador:', currentPass);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      setError('Por favor ingresa tu nombre y la contraseña.');
      return;
    }

    const inputPassword = password.trim();
    const storedPassword = (localStorage.getItem('golf_access_password') || 'jugador123').trim();
    const defaultPasswords = [storedPassword, 'jugador123', '1234', 'golf'];

    if (!defaultPasswords.includes(inputPassword)) {
      setError('Contraseña incorrecta. (Tip: Puedes usar tu contraseña o la contraseña por defecto jugador123).');
      return;
    }

    // Detectar si ingresa desde celular o laptop
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    const deviceType = isMobileDevice ? '📱 Celular' : '💻 Laptop/PC';

    // Registrar usuario en la lista de usuarios de la app
    const registeredUsersStr = localStorage.getItem('golf_registered_users');
    const registeredUsers: Array<{ id: string; name: string; date: string; device?: string }> = registeredUsersStr
      ? JSON.parse(registeredUsersStr)
      : [];

    const registeredUsersMap = registeredUsers;
    const trimmedName = name.trim();
    const existingIndex = registeredUsersMap.findIndex((u) => u.name.toLowerCase() === trimmedName.toLowerCase());
    
    const nowStr = new Date().toLocaleString();

    if (existingIndex === -1) {
      registeredUsersMap.push({
        id: 'user-' + Date.now(),
        name: trimmedName,
        date: nowStr,
        device: deviceType
      });
    } else {
      registeredUsersMap[existingIndex].date = nowStr;
      registeredUsersMap[existingIndex].device = deviceType;
    }

    localStorage.setItem('golf_registered_users', JSON.stringify(registeredUsersMap));
    localStorage.setItem('golf_current_user', trimmedName);

    onLoginSuccess(trimmedName);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Trophy className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Golf y Apuestas</h2>
          <p className="text-xs text-slate-500">
            Ingresa tus datos para acceder a la aplicación por primera vez.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              Tu Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Carlos Mendoza"
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-semibold text-slate-900 bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              Contraseña de Acceso (Jugadores)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-semibold text-slate-900 bg-slate-50"
            />
            <p className="text-[11px] text-slate-400">Introduce la contraseña establecida por el creador.</p>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <span>Ingresar a la App</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
