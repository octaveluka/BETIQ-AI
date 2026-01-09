
import React from 'react';
import { FootballMatch, Language } from '../types';
import { Crown, Lock, Zap, ShieldCheck, Shield } from 'lucide-react';

interface Props {
  match: FootballMatch;
  isVipUser: boolean;
  forceLock?: boolean;
  lang: Language;
  onClick: (match: FootballMatch) => void;
}

export const MatchCard: React.FC<Props> = ({ match, isVipUser, forceLock = false, lang, onClick }) => {
  const isActuallyLocked = forceLock && !isVipUser;

  return (
    <div 
      onClick={() => onClick(match)}
      className={`relative border rounded-[2.2rem] p-6 cursor-pointer transition-all active:scale-[0.97] group overflow-hidden ${
        isActuallyLocked ? 'bg-gradient-to-br from-slate-950 to-orange-950/20 border-orange-500/20 shadow-xl' : 'bg-[#0b1121]/60 border-white/5 hover:border-blue-500/30 shadow-lg'
      }`}
    >
      <div className="flex justify-between items-center mb-5 relative z-10">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] bg-[#151c30] px-3 py-1.5 rounded-lg border border-white/5">{match.league}</span>
        {isActuallyLocked ? (
           <div className="flex items-center gap-1.5 bg-orange-500 text-slate-950 px-3 py-1.5 rounded-full shadow-lg shadow-orange-500/20 animate-pulse">
             <Crown size={11} strokeWidth={3} />
             <span className="text-[9px] font-black uppercase tracking-tighter">ELITE VIP</span>
           </div>
        ) : (
          <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <ShieldCheck size={12} className="text-blue-400" strokeWidth={3} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-around mb-8 relative z-10">
        <div className="text-center w-2/5 flex flex-col items-center gap-3">
          <div className="w-14 h-14 relative flex items-center justify-center bg-slate-800/40 rounded-full border border-white/5">
            <img 
              src={match.homeLogo} 
              className="max-w-full max-h-full mx-auto object-contain drop-shadow-2xl group-hover:scale-110 transition-transform" 
              alt="home" 
            />
            <Shield size={24} className="absolute text-slate-700 -z-10" />
          </div>
          <span className="text-[11px] font-black truncate block text-white uppercase tracking-tighter w-full">{match.homeTeam}</span>
        </div>
        
        <div className="text-sm font-black italic opacity-20 text-slate-600">VS</div>
        
        <div className="text-center w-2/5 flex flex-col items-center gap-3">
          <div className="w-14 h-14 relative flex items-center justify-center bg-slate-800/40 rounded-full border border-white/5">
            <img 
              src={match.awayLogo} 
              className="max-w-full max-h-full mx-auto object-contain drop-shadow-2xl group-hover:scale-110 transition-transform" 
              alt="away" 
            />
            <Shield size={24} className="absolute text-slate-700 -z-10" />
          </div>
          <span className="text-[11px] font-black truncate block text-white uppercase tracking-tighter w-full">{match.awayTeam}</span>
        </div>
      </div>

      <div className={`flex items-center justify-center py-4 rounded-[1.5rem] border border-dashed relative z-10 transition-colors ${
        isActuallyLocked ? 'bg-orange-500/5 border-orange-500/30 text-orange-500' : 'bg-slate-950/40 border-slate-800 text-slate-500 group-hover:border-blue-500/30'
      }`}>
        {isActuallyLocked ? (
          <div className="flex items-center gap-2.5">
            <Lock size={13} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest italic">{lang === 'FR' ? 'DÉBLOQUER VIP' : 'UNLOCK VIP'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Zap size={13} className="text-blue-400" strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest italic">{lang === 'FR' ? 'IA ANALYSE OK' : 'AI ANALYSIS OK'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
