import React, { useState } from 'react';
import { GolfCourse, Hole } from '../types';
import { Plus, Trash2, Edit3, MapPin, ChevronDown, ChevronUp, Save, X, Star } from 'lucide-react';

interface CourseManagerProps {
  courses: GolfCourse[];
  setCourses: React.Dispatch<React.SetStateAction<GolfCourse[]>>;
}

export const CourseManager: React.FC<CourseManagerProps> = ({ courses, setCourses }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const defaultHoles: Hole[] = Array.from({ length: 18 }, (_, i) => ({
    number: i + 1,
    par: 4,
    handicap: i + 1
  }));

  const [holes, setHoles] = useState<Hole[]>(defaultHoles);

  const handleOpenNew = () => {
    setEditingCourseId(null);
    setName('');
    setLocation('');
    setIsFavorite(courses.length === 0);
    setHoles(Array.from({ length: 18 }, (_, i) => ({
      number: i + 1,
      par: i === 2 || i === 5 || i === 11 || i === 16 ? 3 : i === 4 || i === 8 || i === 13 || i === 17 ? 5 : 4,
      handicap: i + 1
    })));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: GolfCourse) => {
    setEditingCourseId(course.id);
    setName(course.name);
    setLocation(course.location || '');
    setIsFavorite(course.isFavorite || false);
    setHoles([...course.holes]);
    setIsModalOpen(true);
  };

  const executeDelete = (id: string) => {
    setCourses((prevCourses) => {
      const filtered = prevCourses.filter((c) => c.id !== id);
      if (filtered.length > 0 && !filtered.some((c) => c.isFavorite)) {
        filtered[0].isFavorite = true;
      }
      return filtered;
    });
    setDeleteConfirmId(null);
  };

  const handleToggleFavorite = (id: string) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => ({
        ...c,
        isFavorite: c.id === id ? !c.isFavorite : false
      }))
    );
  };

  const handleHoleChange = (index: number, field: 'par' | 'handicap', value: number) => {
    const updated = [...holes];
    updated[index] = { ...updated[index], [field]: value };
    setHoles(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCourses((prevCourses) => {
      let updated = [...prevCourses];

      if (isFavorite) {
        updated = updated.map((c) => ({ ...c, isFavorite: false }));
      }

      if (editingCourseId) {
        return updated.map((c) =>
          c.id === editingCourseId
            ? { ...c, name: name.trim(), location: location.trim(), isFavorite, holes }
            : c
        );
      } else {
        const newCourse: GolfCourse = {
          id: 'course-' + Date.now(),
          name: name.trim(),
          location: location.trim(),
          isFavorite: isFavorite || updated.length === 0,
          holes
        };
        return [...updated, newCourse];
      }
    });

    setIsModalOpen(false);
  };

  const totalPar = holes.reduce((acc, h) => acc + h.par, 0);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            Gestión de Campos de Golf
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Administra los campos, sus pares, hándicaps y designa tu campo favorito (⭐).
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNew}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Campo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {courses.map((course) => {
          const coursePar = course.holes.reduce((sum, h) => sum + h.par, 0);
          const isExpanded = expandedCourseId === course.id;

          return (
            <div key={course.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden transition-all">
              <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(course.id)}
                      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        course.isFavorite
                          ? 'bg-amber-100 text-amber-500 hover:bg-amber-200'
                          : 'bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-slate-200'
                      }`}
                      title={course.isFavorite ? 'Campo Favorito' : 'Marcar como favorito'}
                    >
                      <Star className={`w-5 h-5 ${course.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <h3 className="text-lg font-bold text-slate-900">{course.name}</h3>
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                      Par {coursePar}
                    </span>
                    {course.isFavorite && (
                      <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
                        Favorito
                      </span>
                    )}
                  </div>
                  {course.location && (
                    <p className="text-sm text-slate-500 flex items-center gap-1 ml-9">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {course.location}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                    className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Ocultar Detalle' : 'Ver 18 Hoyos'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(course)}
                    className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                    title="Editar campo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(course.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar campo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Confirmación de eliminación integrada */}
              {deleteConfirmId === course.id && (
                <div className="bg-rose-50 border-t border-rose-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs font-bold text-rose-900">
                    ¿Estás seguro de eliminar el campo &quot;{course.name}&quot;?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => executeDelete(course.id)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                    >
                      Sí, Eliminar
                    </button>
                  </div>
                </div>
              )}

              {isExpanded && (
                <div className="bg-slate-50 border-t border-slate-100 p-4 sm:p-6 overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-2 font-semibold">Hoyo</th>
                        {course.holes.map((h) => (
                          <th key={h.number} className="pb-2 px-1.5 text-center font-medium">{h.number}</th>
                        ))}
                        <th className="pb-2 text-center font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2.5 font-semibold text-slate-700">Par</td>
                        {course.holes.map((h) => (
                          <td key={h.number} className="py-2.5 px-1.5 text-center font-medium text-slate-900">{h.par}</td>
                        ))}
                        <td className="py-2.5 text-center font-bold text-emerald-700">{coursePar}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-semibold text-slate-700">Hcp (Dificultad)</td>
                        {course.holes.map((h) => (
                          <td key={h.number} className="py-2.5 px-1.5 text-center text-slate-500 text-xs">{h.handicap}</td>
                        ))}
                        <td className="py-2.5 text-center text-slate-400">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCourseId ? 'Editar Campo de Golf' : 'Nuevo Campo de Golf'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Nombre del Campo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Club de Golf Las Lomas"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Ubicación (opcional)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej. Lima, Perú"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60">
                <input
                  type="checkbox"
                  id="isFavorite"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="isFavorite" className="text-sm font-semibold text-amber-900 cursor-pointer flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  Designar como Campo Favorito (Aparecerá por defecto al configurar rondas)
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Configuración de los 18 Hoyos (Par y Hcp)
                  </label>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    Par Total: {totalPar}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-6 gap-2 text-xs font-bold text-slate-500 px-2 pb-1 border-b border-slate-200">
                    <span className="col-span-2">Hoyo</span>
                    <span className="col-span-2 text-center">Par (3,4,5)</span>
                    <span className="col-span-2 text-center">Hcp (1-18)</span>
                  </div>

                  {holes.map((hole, index) => (
                    <div key={hole.number} className="grid grid-cols-6 gap-2 items-center bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                      <span className="col-span-2 text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
                          {hole.number}
                        </span>
                        Hoyo {hole.number}
                      </span>
                      <div className="col-span-2 flex justify-center">
                        <select
                          value={hole.par}
                          onChange={(e) => handleHoleChange(index, 'par', parseInt(e.target.value))}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value={3}>Par 3</option>
                          <option value={4}>Par 4</option>
                          <option value={5}>Par 5</option>
                        </select>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <select
                          value={hole.handicap}
                          onChange={(e) => handleHoleChange(index, 'handicap', parseInt(e.target.value))}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        >
                          {Array.from({ length: 18 }, (_, idx) => (
                            <option key={idx + 1} value={idx + 1}>
                              Hcp {idx + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Campo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
