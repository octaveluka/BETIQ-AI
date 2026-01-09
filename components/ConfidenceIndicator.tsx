
import React from 'react';
import { Confidence, Language } from '../types';

interface Props {
  level: Confidence;
  lang: Language;
}

export const ConfidenceIndicator: React.FC<Props> = ({ level, lang }) => {
  const colors = {
    [Confidence.HIGH]: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    [Confidence.MEDIUM]: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    [Confidence.LOW]: 'bg-rose-500 shadow-[0_0_8_rgba(244,63,94,0.5)]',
  };

  const labels = {
    FR: {
      [Confidence.HIGH]: 'Élevé',
      [Confidence.MEDIUM]: 'Moyen',
      [Confidence.LOW]: 'Faible',
    },
    EN: {
      [Confidence.HIGH]: 'High',
      [Confidence.MEDIUM]: 'Medium',
      [Confidence.LOW]: 'Low',
    }
  };

  const currentLabels = labels[lang] || labels.FR;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[level]}`}></div>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{currentLabels[level]}</span>
    </div>
  );
};
