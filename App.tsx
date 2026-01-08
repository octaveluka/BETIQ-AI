import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  Crown, Lock, LayoutGrid, Settings, ChevronLeft, ShieldCheck,
  Loader2, RefreshCw, Zap, Search, BrainCircuit, CheckCircle2,
  Clock, LogOut, Mail, UserCircle, Star
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from "firebase/auth";
import { auth } from './services/firebase';

import { FootballMatch, Confidence, Prediction, VipInsight, Language, BetType } from './types';
import { MatchCard } from './components/MatchCard';
import { ConfidenceIndicator } from './components/ConfidenceIndicator';
import { generatePredictionsAndAnalysis } from './services/geminiService';
import { fetchMatchesByDate } from './services/footballApiService';

const { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } = ReactRouterDOM;

const ADMIN_CODE = "20202020";
const PAYMENT_LINK = "https://bsbxsvng.mychariow.shop/prd_g3zdgh/checkout";

const VALID_CODES_ARRAY = ["BETIQ-5", "BETIQ-24", "BETIQ-55", "BETIQ-98", "BETIQ-153", "BETIQ-26435803", "BETIQ-26455670"];
const VALID_USER_CODES = new Set(VALID_CODES_ARRAY);

const STRINGS: Record<Language, any> = {
  FR: {
    loading: "Calcul des probabilités IA...",
    freeTitle: "PRONOSTICS GRATUITS",
    vipTitle: "SÉLECTION ÉLITE VIP",
    search: "Chercher un match ou une ligue...",
    logout: "Se déconnecter",
    vipAccess: "ACCÈS VIP ILLIMITÉ",
    buyVip: "Devenir VIP (30 jours)",
    enterCode: "Code d'activation...",
    vipInsight: "ANALYSE PRÉCISION VIP",
    algoVerdict: "Verdict des Algorithmes"
  },
  EN: {
    loading: "AI Probability Calculation...",
    freeTitle: "FREE PREDICTIONS",
    vipTitle: "ELITE VIP SELECTION",
    search: "Search match or league...",
    logout: "Log Out",
    vipAccess: "UNLIMITED VIP ACCESS",
    buyVip: "Get VIP (30 Days)",
    enterCode: "Activation Code...",
    vipInsight: "VIP PRECISION INSIGHT",
    algoVerdict: "Algorithmic Verdict"
  }
};

const ELITE_TEAMS = ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Arsenal', 'Bayern Munich', 'PSG', 'Inter', 'AC Milan', 'Juventus', 'Dortmund', 'Chelsea'];
const isPopularMatch = (match: FootballMatch) => ELITE_TEAMS.some(t => match.homeTeam.includes(t) || match.awayTeam.includes(t));

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Identifiants incorrects.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email déjà utilisé.');
      } else {
        setError('Erreur de connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center animate-in fade-in zoom-in duration-700">
        <div className="bg-[#0b1121] p-4 rounded-3xl border border-white/10 w-fit mx-auto mb-4 shadow-2xl ring-1 ring-blue-500/20">
          <BrainCircuit size={48} className="text-blue-400" />
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter text-white">BETI<span className="text-orange-500">Q</span></h1>
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em] mt-2">Intelligence Artificielle</p>
      </div>

      <div className="w-full max-w-sm bg-[#0b1121] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-orange-500 to-blue-500 opacity-50"></div>
        <div className="flex bg-[#020617] p-1 rounded-2xl mb-8 border border-white/5">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${isLogin ? 'bg-orange-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}>Connexion</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!isLogin ? 'bg-orange-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}>S'inscrire</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-all" />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input type="password" placeholder="Mot de passe" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-all" />
          </div>
          {error && <div className="text-[10px] text-rose-500 font-black uppercase text-center bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">{error}</div>}
          <button disabled={loading} className="w-full bg-orange-500 text-slate-950 font-black py-4 rounded-xl text-[11px] uppercase italic tracking-widest shadow-xl shadow-orange-500/30 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={16} /> : (isLogin ? 'ACCÉDER AUX PRONOSTICS' : 'CRÉER MON COMPTE')}
          </button>
        </form>
      </div>
    </div>
  );
};

const PredictionsView: React.FC<{ 
  matches: FootballMatch[], 
  loading: boolean, 
  language: Language, 
  isVip: boolean, 
  selectedDate: string,
  onDateChange: (date: string) => void,
  onRefresh: () => void 
}> = ({ matches, loading, language, isVip, selectedDate, onDateChange, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const S = STRINGS[language];

  const { freeMatches, eliteMatchesPreview } = useMemo(() => {
    const filtered = matches.filter(m => 
      m.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.league.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      freeMatches: filtered.filter(m => !isPopularMatch(m)).slice(0, 15),
      eliteMatchesPreview: filtered.filter(isPopularMatch).slice(0, 5)
    };
  }, [matches, searchQuery]);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex items-center justify-between py-8">
        <div className="flex items-center gap-3">
           <BrainCircuit size={28} className="text-blue-400" />
           <h1 className="text-3xl font-black italic tracking-tighter text-white">BETI<span className="text-orange-500">Q</span></h1>
        </div>
        <button onClick={onRefresh} className="p-3 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-slate-800 transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-4 -mx-1 px-1">
        {[0,1,2,3,4,5,6,7].map(i => {
          const d = new Date(); d.setDate(d.getDate() + i);
          const iso = d.toISOString().split('T')[0];
          const isSel = iso === selectedDate;
          return (
            <button key={iso} onClick={() => onDateChange(iso)} className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-[1.5rem] border transition-all ${isSel ? 'bg-orange-500 border-orange-400 text-slate-950 shadow-xl shadow-orange-500/20 scale-105' : 'bg-[#0b1121] border-white/5 text-slate-500 hover:border-slate-700'}`}>
              <span className={`text-[8px] font-black uppercase mb-1 ${isSel ? 'text-slate-900' : 'text-slate-600'}`}>{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
              <span className="text-lg font-black italic">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-8 relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={S.search} className="w-full bg-[#0b1121] border border-white/10 rounded-[1.8rem] py-5 pl-14 pr-6 text-xs font-bold text-white outline-none focus:border-blue-500/40 transition-all shadow-inner" />
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 className="animate-spin text-orange-500" size={48} />
            <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
          </div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">{S.loading}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {eliteMatchesPreview.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2.5">
                  <Star size={14} className="text-orange-500 fill-orange-500 animate-pulse" />
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{S.vipTitle}</h3>
                </div>
                <Link to="/vip" className="text-[9px] font-black text-orange-500 uppercase hover:text-orange-400">VOIR TOUT</Link>
              </div>
              {eliteMatchesPreview.map(m => (
                <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={!isVip} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} />
              ))}
            </div>
          )}

          <div className="space-y-5">
            <div className="flex items-center gap-2.5 px-2">
              <Zap size={14} className="text-blue-400" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{S.freeTitle}</h3>
            </div>
            {freeMatches.length > 0 ? (
              freeMatches.map(m => (
                <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={false} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: false } })} />
              ))
            ) : (
              <div className="text-center py-16 bg-[#0b1121]/50 rounded-[2.5rem] border border-white/5">
                <p className="text-[10px] font-black text-slate-700 uppercase italic">Aucun match détecté pour cette période.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsView: React.FC<{ 
  language: Language, 
  setLanguage: (l: Language) => void, 
  isVip: boolean, 
  setIsVip: (v: boolean) => void, 
  userEmail: string | null 
}> = ({ language, setLanguage, isVip, setIsVip, userEmail }) => {
  const S = STRINGS[language];
  const [code, setCode] = useState('');

  const checkCode = (val: string) => {
    const trimmed = val.trim().toUpperCase();
    setCode(trimmed);
    if (!userEmail) return;
    if (trimmed === ADMIN_CODE || VALID_USER_CODES.has(trimmed)) {
      setIsVip(true); 
      localStorage.setItem(`btq_vip_status_${userEmail}`, 'true'); 
    }
  };

  return (
    <div className="p-6 pb-32 space-y-8 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0b1121] p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <UserCircle size={32} className="text-blue-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Compte Utilisateur</p>
            <p className="text-sm font-bold text-white truncate">{userEmail}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-[9px] font-black uppercase text-slate-600 tracking-widest">PRÉFÉRENCES DE LANGUE</h2>
          <div className="flex gap-3">
            {['FR', 'EN'].map(l => (
              <button key={l} onClick={() => { setLanguage(l as Language); localStorage.setItem('lang', l); }} className={`flex-1 py-4 rounded-xl text-[10px] font-black border transition-all ${language === l ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30' : 'bg-[#020617] border-white/5 text-slate-700 hover:border-slate-800'}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {!isVip ? (
        <div className="bg-[#0b1121] p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-6 -right-6 opacity-5 rotate-12"><Crown size={120} /></div>
          <div className="text-center space-y-2">
            <h2 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">ACCÈS PREMIUM</h2>
            <p className="text-xs font-bold text-slate-400 italic">Débloquez les analyses IA les plus performantes.</p>
          </div>
          
          <div className="space-y-4">
            <input type="text" value={code} onChange={(e) => checkCode(e.target.value)} placeholder={S.enterCode} className="w-full bg-[#020617] border border-white/10 rounded-2xl py-5 text-center font-black text-xl text-white uppercase outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-800" />
            <button onClick={() => window.open(PAYMENT_LINK, '_blank')} className="w-full bg-orange-500 text-slate-950 font-black py-5 rounded-2xl text-[11px] uppercase italic tracking-widest shadow-2xl shadow-orange-500/30 active:scale-95 transition-all">
              {S.buyVip}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/5 p-10 rounded-[3rem] border border-emerald-500/20 text-center shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
              <CheckCircle2 size={32} className="text-slate-950" />
            </div>
            <span className="text-2xl font-black text-white italic block uppercase tracking-tighter mb-2">{S.vipAccess}</span>
            <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">Abonnement actif et synchronisé</p>
          </div>
        </div>
      )}

      <button onClick={() => signOut(auth)} className="w-full bg-rose-500/5 p-6 rounded-[2rem] border border-rose-500/10 flex items-center justify-center gap-4 hover:bg-rose-500/10 transition-all group">
        <LogOut size={22} className="text-rose-500 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black text-white uppercase italic tracking-widest">{S.logout}</span>
      </button>
    </div>
  );
};

const VipView: React.FC<{ matches: FootballMatch[], loading: boolean, language: Language, isVip: boolean }> = ({ matches, loading, language, isVip }) => {
  const navigate = useNavigate();
  const elite = matches.filter(isPopularMatch);
  return (
    <div className="p-6 pb-32 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="mb-10 flex items-center gap-4 py-4">
        <div className="p-3 bg-orange-500 rounded-2xl shadow-xl shadow-orange-500/20">
          <Crown size={32} className="text-slate-950" />
        </div>
        <div>
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">ÉLITE VIP</h2>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Neural Predictions v4.0</p>
        </div>
      </header>
      <div className="space-y-6">
        {elite.length > 0 ? (
          elite.map(m => (
            <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={!isVip} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} />
          ))
        ) : (
          <div className="bg-[#0b1121] p-16 rounded-[3rem] border border-white/5 text-center flex flex-col items-center gap-4">
            <Clock size={48} className="text-slate-800" />
            <p className="text-[11px] font-black text-slate-700 uppercase italic tracking-widest">En attente de chocs européens...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MatchDetailView: React.FC<any> = ({ language, isVip }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const match = state?.match as FootballMatch;
  const forcedLock = state?.forceLock as boolean;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const S = STRINGS[language];

  useEffect(() => {
    if (match && (!forcedLock || isVip)) {
      setLoading(true);
      generatePredictionsAndAnalysis(match, language).then(res => {
        setData(res); setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [match, language, isVip, forcedLock]);

  if (!match) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-[#020617] pb-32">
      <nav className="p-5 sticky top-0 bg-[#020617]/90 backdrop-blur-2xl flex items-center justify-between border-b border-white/5 z-50">
        <button onClick={() => navigate(-1)} className="p-3 bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all"><ChevronLeft size={20} /></button>
        <span className="text-[11px] font-black text-white uppercase tracking-tighter max-w-[200px] truncate">{match.homeTeam} VS {match.awayTeam}</span>
        <div className="w-10" />
      </nav>

      <div className="p-6 space-y-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-600">
        <div className="bg-[#0b1121] p-10 rounded-[3.5rem] border border-white/5 flex items-center justify-around shadow-2xl relative overflow-hidden ring-1 ring-white/5">
          <div className="absolute inset-0 bg-blue-500/5 blur-[100px] opacity-30"></div>
          <div className="text-center w-1/3 z-10">
             <img src={match.homeLogo} className="w-20 h-20 mx-auto mb-4 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" alt="home" />
             <p className="text-[11px] font-black text-white uppercase tracking-tight">{match.homeTeam}</p>
          </div>
          <div className="text-4xl font-black italic text-slate-800 z-10 px-4">VS</div>
          <div className="text-center w-1/3 z-10">
             <img src={match.awayLogo} className="w-20 h-20 mx-auto mb-4 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" alt="away" />
             <p className="text-[11px] font-black text-white uppercase tracking-tight">{match.awayTeam}</p>
          </div>
        </div>

        {forcedLock && !isVip ? (
          <div className="bg-[#0b1121] p-12 rounded-[3.5rem] border border-orange-500/20 text-center space-y-8 shadow-2xl animate-pulse">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-orange-500/5">
              <Lock size={36} className="text-orange-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">PRÉDICTIONS ÉLITE BLOQUÉES</h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed px-4">Les scores exacts et l'analyse technico-tactique sont réservés aux membres Premium.</p>
            </div>
            <button onClick={() => navigate('/settings')} className="w-full bg-orange-500 text-slate-950 font-black py-5 rounded-2xl text-xs uppercase shadow-2xl shadow-orange-500/30 active:scale-95 transition-all">DÉVERROUILLER L'ACCÈS VIP</button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center py-24 gap-6">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-[10px] font-black text-slate-700 uppercase italic tracking-[0.2em]">{S.loading}</p>
          </div>
        ) : data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-1 gap-5">
              {data.predictions.map((p: any, i: number) => (
                <div key={i} className="bg-[#0b1121] p-7 rounded-[2.5rem] border border-white/5 flex justify-between items-center group hover:bg-slate-900/50 transition-all shadow-xl">
                  <div>
                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-[0.3em] block mb-2">{p.type}</span>
                    <div className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{p.recommendation}</div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-4xl font-black text-white tabular-nums drop-shadow-sm">{p.probability}%</div>
                    <ConfidenceIndicator level={p.confidence as Confidence} />
                  </div>
                </div>
              ))}
            </div>

            {isVip && data.vipInsight && (
              <div className="bg-orange-500/5 p-8 rounded-[3rem] border border-orange-500/20 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Crown size={48} /></div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
                  <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest italic">{S.vipInsight}</span>
                </div>
                <div className="bg-[#020617]/60 p-6 rounded-3xl border border-white/5">
                   <p className="text-[9px] font-black text-slate-600 uppercase mb-4 tracking-tighter">Scores Exacts IA :</p>
                   <div className="flex flex-wrap gap-4">
                      {data.vipInsight.exactScores.map((s: string, idx: number) => (
                        <div key={idx} className="bg-orange-500 text-slate-950 px-6 py-3 rounded-2xl text-lg font-black italic shadow-lg shadow-orange-500/10">{s}</div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            <div className="bg-[#0b1121]/50 p-10 rounded-[3.5rem] border-l-4 border-blue-500 border border-white/5 relative shadow-inner group">
               <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldCheck size={80} /></div>
               <div className="flex items-center gap-3 mb-6">
                  <BrainCircuit size={20} className="text-blue-400" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{S.algoVerdict}</span>
               </div>
               <p className="text-[13px] text-slate-300 leading-relaxed font-bold uppercase tracking-tight italic relative z-10">{data.analysis}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'FR');
  const [isVip, setIsVip] = useState<boolean>(false);
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // onAuthStateChanged utilise l'instance 'auth' importée qui est déjà initialisée
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email) {
        const savedVip = localStorage.getItem(`btq_vip_status_${u.email}`) === 'true';
        setIsVip(savedVip);
      } else {
        setIsVip(false);
      }
      setAuthLoading(false);
    }, (error) => {
      console.error("Auth Listener Error:", error);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchMatches = async (date: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await fetchMatchesByDate(date);
      setMatches(data.map(m => ({
        id: m.match_id, league: m.league_name, homeTeam: m.match_hometeam_name,
        awayTeam: m.match_awayteam_name, homeLogo: m.team_home_badge,
        awayLogo: m.team_away_badge, time: m.match_time, status: m.match_status,
        stats: { homeForm: [], awayForm: [], homeRank: 0, awayRank: 0, h2h: '' },
        predictions: []
      })));
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) fetchMatches(selectedDate);
  }, [selectedDate, user]);

  if (authLoading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="p-8 bg-[#0b1121] rounded-[2.5rem] border border-white/5 shadow-2xl">
          <BrainCircuit size={64} className="text-blue-400 animate-pulse" />
        </div>
        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div>
      </div>
      <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] animate-pulse">Initialisation Sécurisée...</p>
    </div>
  );

  if (!user) return <AuthView />;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/20">
        <Routes>
          <Route path="/" element={<PredictionsView matches={matches} loading={loading} language={language} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} onRefresh={() => fetchMatches(selectedDate)} />} />
          <Route path="/settings" element={<SettingsView language={language} setLanguage={setLanguage} isVip={isVip} setIsVip={setIsVip} userEmail={user.email} />} />
          <Route path="/match/:id" element={<MatchDetailView language={language} isVip={isVip} />} />
          <Route path="/vip" element={<VipView matches={matches} loading={loading} language={language} isVip={isVip} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <nav className="fixed bottom-6 left-6 right-6 bg-[#0b1121]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-3 px-4 flex items-center justify-around z-50 shadow-2xl ring-1 ring-white/5">
          <Link to="/" className="flex flex-col items-center gap-1.5 p-3 text-slate-600 hover:text-blue-400 transition-all active:scale-90">
            <LayoutGrid size={22} /><span className="text-[8px] font-black uppercase tracking-tight">Pronos</span>
          </Link>
          <Link to="/vip" className="flex flex-col items-center group relative p-3">
            <div className="bg-orange-500 p-2.5 rounded-full -mt-12 border-[5px] border-[#020617] shadow-2xl group-active:scale-110 transition-transform ring-1 ring-orange-500/50">
              <Crown size={22} className="text-slate-950" />
            </div>
            <span className="text-[8px] font-black text-orange-500 mt-1 uppercase italic tracking-tighter">Élite VIP</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center gap-1.5 p-3 text-slate-600 hover:text-blue-400 transition-all active:scale-90">
            <Settings size={22} /><span className="text-[8px] font-black uppercase tracking-tight">Mon Profil</span>
          </Link>
        </nav>
      </div>
    </HashRouter>
  );
};

export default App;