
import React from 'react';
import { FootballMatch } from '../types';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { Crown, Lock, Star, Zap } from 'lucide-react';
import { isEliteMatch } from '../App';

interface Props {
  match: FootballMatch;
  isVipUser: boolean;
  onClick: (match: FootballMatch) => void;
}

export const MatchCard: React.FC<Props> = ({ match, isVipUser, onClick }) => {
  const mainPrediction = match.predictions && match.predictions.length > 0 ? match.predictions[0] : null;
  const isLive = match.status !== 'Upcoming' && match.status !== 'Finished' && !match.status.includes(':');
  
  // CRITICAL FIX: Ensure we only show predictions if they have real, non-zero data
  const hasRealPrediction = mainPrediction && mainPrediction.probability > 0;
  
  const isElite = isEliteMatch(match);
  const lang = localStorage.getItem('lang') || 'FR';
  
  const labels = {
    FR: { free: 'Analyse Gratuite', vip: 'Accès VIP', elite: 'Elite VIP' },
    EN: { free: 'Free Analysis', vip: 'VIP Access', elite: 'Elite VIP' }
  }[lang as 'FR' | 'EN'] || { free: 'Analyse Gratuite', vip: 'Accès VIP', elite: 'Elite VIP' };

  return (
    <div 
      onClick={() => onClick(match)}
      className={`relative border rounded-[2.5rem] p-6 cursor-pointer transition-all active:scale-[0.98] shadow-2xl group overflow-hidden ${
        isElite 
          ? 'bg-gradient-to-br from-slate-900/60 to-amber-950/20 border-amber-500/30 hover:border-amber-500/60 shadow-amber-500/5' 
          : 'bg-slate-900/40 border-slate-800/60 hover:border-indigo-500/50 shadow-black/10'
      }`}
    >
      {/* Dynamic Background Pattern */}
      <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-10 transition-opacity">
        <span className="text-7xl font-black italic select-none">{match.homeTeam.charAt(0)}</span>
      </div>
      
      {/* Decorative Glow for Elite Matches */}
      {isElite && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full"></div>
      )}

      {/* Header Info */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/5">{match.league}</span>
          {isElite && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-3 py-1.5 rounded-full border border-amber-400 shadow-lg shadow-amber-500/20">
               <Crown size={11} strokeWidth={3} />
               <span className="text-[9px] font-black uppercase tracking-tight">{labels.elite}</span>
            </div>
          )}
        </div>
        {isLive ? (
          <div className="flex items-center gap-1.5 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{match.status}</span>
          </div>
        ) : (
          <span className="text-[11px] font-black text-indigo-400/80 font-mono tracking-tighter bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10">{match.time}</span>
        )}
      </div>

      {/* Teams Info */}
      <div className="flex items-center justify-between mb-8 px-4 relative z-10">
        <div className="flex flex-col items-center gap-4 flex-1 text-center">
          <div className="relative group-hover:scale-110 transition-transform duration-500">
            <div className={`absolute inset-0 blur-2xl rounded-full ${isElite ? 'bg-amber-500/10' : 'bg-white/5'}`}></div>
            <img 
              src={match.homeLogo} 
              alt={match.homeTeam} 
              className="w-14 h-14 object-contain relative z-10 drop-shadow-2xl" 
              onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/64?text=?'} 
            />
          </div>
          <span className="text-[11px] font-black text-white leading-tight uppercase tracking-tighter truncate w-full px-1">{match.homeTeam}</span>
        </div>
        
        <div className="px-6 flex flex-col items-center">
          <div className="text-2xl font-black text-slate-800 italic select-none opacity-40">VS</div>
        </div>

        <div className="flex flex-col items-center gap-4 flex-1 text-center">
          <div className="relative group-hover:scale-110 transition-transform duration-500">
            <div className={`absolute inset-0 blur-2xl rounded-full ${isElite ? 'bg-amber-500/10' : 'bg-white/5'}`}></div>
            <img 
              src={match.awayLogo} 
              alt={match.awayTeam} 
              className="w-14 h-14 object-contain relative z-10 drop-shadow-2xl" 
              onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/64?text=?'} 
            />
          </div>
          <span className="text-[11px] font-black text-white leading-tight uppercase tracking-tighter truncate w-full px-1">{match.awayTeam}</span>
        </div>
      </div>

      {/* Prediction / Analysis Footer */}
      {hasRealPrediction ? (
        <div className={`flex items-center justify-between p-5 rounded-[1.8rem] border backdrop-blur-md shadow-inner ring-1 ring-white/5 relative z-10 ${
          isElite ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-950/60 border-white/5'
        }`}>
          <div>
            <div className={`text-[10px] uppercase font-black tracking-[0.2em] mb-1.5 ${isElite ? 'text-amber-400' : 'text-indigo-400'}`}>
              {mainPrediction.type}
            </div>
            <div className="text-xl font-black text-white">{mainPrediction.recommendation}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white leading-none mb-1.5">{mainPrediction.probability}%</div>
            <div className="flex justify-end">
              <ConfidenceIndicator level={mainPrediction.confidence} />
            </div>
          </div>
        </div>
      ) : (
        <div className={`flex items-center justify-center p-4 rounded-[1.8rem] border border-dashed transition-all relative z-10 ${
          isElite 
            ? 'bg-amber-500/5 border-amber-500/40 hover:bg-amber-500/10' 
            : 'bg-slate-950/20 border-slate-800 hover:bg-slate-950/40'
        }`}>
           <div className="flex items-center gap-2.5">
             {isElite ? (
               <>
                 <div className="p-1 bg-amber-500/20 rounded-md">
                   <Lock size={12} className="text-amber-500" />
                 </div>
                 <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.1em] italic">{labels.vip}</span>
               </>
             ) : (
               <>
                 <Zap size={13} className="text-indigo-500 animate-pulse" />
                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] italic">{labels.free}</span>
               </>
             )}
           </div>
        </div>
      )}
    </div>
  );
};
