import React from 'react';
import { GolfCourse, Player, Round } from '../types';
import { ArrowLeft, Trophy, Users, Sparkles, Swords, DollarSign, Calculator } from 'lucide-react';

interface BettingModuleViewProps {
  moduleName: string;
  round: Round;
  course: GolfCourse;
  roundPlayers: Player[];
  onBack: () => void;
}

export const BettingModuleView: React.FC<BettingModuleViewProps> = ({
  moduleName,
  round,
  course,
  roundPlayers,
  onBack
}) => {
  const getModuleDetails = () => {
    switch (moduleName) {
      case 'sindicato':
        return {
          title: 'Sindicato (Puntos por Hoyo)',
          description: 'Cálculo de puntos estables, skins o puntos netos acumulados por hoyo.',
          icon: <Trophy className="w-8 h-8 text-amber-500" />
        };
      case 'parejas':
        return {
          title: 'Parejas (Equipos / Foursome)',
          description: 'Configuración y resultados para juegos por parejas (mejor bola, scramble o suma).',
          icon: <Users className="w-8 h-8 text-emerald-600" />
        };
      case 'individuales':
        return {
          title: 'Apuestas Individuales (Nassau)',
          description: 'Apuestas cara a cara (Frente, Vuelta y Total de la ronda).',
          icon: <Sparkles className="w-8 h-8 text-purple-600" />
        };
      case 'match':
        return {
          title: 'Match Play',
          description: 'Seguimiento de hoyos arriba / abajo entre competidores.',
          icon: <Swords className="w-8 h-8 text-rose-600" />
        };
      case 'perifericos':
        return {
          title: 'Periféricos (Greenies & Extras)',
          description: 'Control de tiros cercanos al green (greenies), águilas, birdies y skins especiales.',
          icon: <DollarSign className="w-8 h-8 text-emerald-600" />
        };
      case 'liquidacion':
        return {
          title: 'Liquidación (Saldos Finales)',
          description: 'Balance financiero y resumen de pagos entre los jugadores según las apuestas.',
          icon: <Calculator className="w-8 h-8 text-blue-600" />
        };
      default:
        return {
          title: 'Módulo de Apuestas',
          description: 'Gestión de apuestas de golf.',
          icon: <Trophy className="w-8 h-8 text-emerald-600" />
        };
    }
  };

  const details = getModuleDetails();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-end">
        <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold">
          {course.name}
        </span>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto shadow-inner">
          {details.icon}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900">{details.title}</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">{details.description}</p>
        </div>

        <div className="pt-6 border-t border-slate-100 max-w-lg mx-auto text-left space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Participantes en esta sección:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roundPlayers.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">{p.name}</span>
                <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  {p.initials}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs mt-4">
          ✨ Este módulo interactivo utiliza los scores ingresados en la tarjeta de puntajes para calcular los resultados automáticos.
        </div>
      </div>
    </div>
  );
};
