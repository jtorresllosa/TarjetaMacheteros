import React, { useState } from 'react';
import { Player } from '../types';
import { Users, Plus, Trash2, Edit3, Save, X, Award, Phone } from 'lucide-react';

interface PlayerManagerProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

export const PlayerManager: React.FC<PlayerManagerProps> = ({ players, setPlayers }) => {
  // Estado para el formulario de nuevo jugador
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [phone, setPhone] = useState('');
  const [handicapIndex, setHandicapIndex] = useState('14');

  // Estado para edición en modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editInitials, setEditInitials] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editHandicap, setEditHandicap] = useState('0');

  // Estado para confirmar eliminación
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedInitials = (initials.trim() || name.substring(0, 3)).toUpperCase().substring(0, 3);
    const hcp = parseInt(handicapIndex, 10);
    const finalHcp = isNaN(hcp) ? 0 : hcp;

    const newPlayer: Player = {
      id: 'player-' + Date.now(),
      name: name.trim(),
      initials: formattedInitials,
      phone: phone.trim(),
      handicapIndex: finalHcp
    };

    setPlayers((prev) => [...prev, newPlayer]);

    // Limpiar formulario
    setName('');
    setInitials('');
    setPhone('');
    setHandicapIndex('14');
  };

  const handleStartEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditInitials(player.initials || '');
    setEditPhone(player.phone || '');
    setEditHandicap(player.handicapIndex.toString());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;

    const formattedInitials = (editInitials.trim() || editName.substring(0, 3)).toUpperCase().substring(0, 3);
    const hcp = parseInt(editHandicap, 10);
    const finalHcp = isNaN(hcp) ? 0 : hcp;

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: editName.trim(),
              initials: formattedInitials,
              phone: editPhone.trim(),
              handicapIndex: finalHcp
            }
          : p
      )
    );

    setEditingId(null);
  };

  const executeDelete = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-2">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" />
          Gestión de Jugadores
        </h2>
        <p className="text-sm text-slate-500">
          Agrega nuevos jugadores o edita/elimina los existentes de forma inmediata.
        </p>
      </div>

      {/* Formulario para nuevo jugador */}
      <form onSubmit={handleCreatePlayer} className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Plus className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-base">Agregar Nuevo Jugador</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Nombre Completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Iniciales (3 letras)</label>
            <input
              type="text"
              maxLength={3}
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              placeholder="Ej. JPE"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Hándicap (Entero)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="-?[0-9]*"
              required
              value={handicapIndex}
              onChange={(e) => setHandicapIndex(e.target.value)}
              placeholder="Ej. 14 o -2"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-bold"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Teléfono (opcional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. +51 999 888 777"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      </form>

      {/* Lista de Jugadores */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider px-1">
          Jugadores Registrados ({players.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...players]
            .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
            .map((player) => (
            <div key={player.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden transition-all">
              <div className="p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-sm shadow-inner tracking-wider">
                    {player.initials || player.name.substring(0, 3).toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{player.name}</h4>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {player.initials}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        Hcp: {player.handicapIndex > 0 ? `+${player.handicapIndex}` : player.handicapIndex}
                      </span>
                      {player.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {player.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(player)}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                    title="Editar jugador"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(player.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar jugador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Confirmación de eliminación integrada */}
              {deleteConfirmId === player.id && (
                <div className="bg-rose-50 border-t border-rose-100 p-3.5 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-rose-900">¿Eliminar a {player.name}?</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => executeDelete(player.id)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-sm"
                    >
                      Sí, Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal Editar Jugador */}
      {editingId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Editar Jugador</h3>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Nombre del Jugador</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Iniciales (3 letras)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={editInitials}
                    onChange={(e) => setEditInitials(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Hándicap (Entero)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="-?[0-9]*"
                    required
                    value={editHandicap}
                    onChange={(e) => setEditHandicap(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
