
import React from 'react';
import { FootballMatch } from '../types';
import { ChevronRight } from 'lucide-react';

interface Props {
  match: FootballMatch;
  isLocked: boolean;
  onClick: () => void;
}

export const VipSafeCard: React.FC<Props> = ({ match, isLocked, onClick }) => {
  const lang = localStorage.getItem('lang') || 'FR';
  return (
    <div 
      onClick={onClick}
      className="bg-[#0a1229] border border-white/5 rounded-[2.5rem] p-5 mb-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-[#0f1a3a]"
    >
      <div className="flex items-center gap-4">
        <div className="flex -space-x-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/50 p-2 border-2 border-[#0a1229] flex items-center justify-center overflow-hidden">
            <img src={match.homeLogo} alt={match.homeTeam} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-800/50 p-2 border-2 border-[#0a1229] flex items-center justify-center overflow-hidden">
            <img src={match.awayLogo} alt={match.awayTeam} className="max-w-full max-h-full object-contain" />
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold text-base tracking-tight">{match.homeTeam} - {match.awayTeam}</h4>
          <p className="text-[#c18c32] text-[10px] font-black uppercase tracking-[0.15em] mt-0.5">{lang === 'FR' ? 'CONFIANCE MAX' : 'MAX CONFIDENCE'}</p>
        </div>
      </div>
      
      <ChevronRight className="text-[#c18c32]" size={20} strokeWidth={3} />
    </div>
  );
};
