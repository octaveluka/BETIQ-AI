import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  Crown, Lock, LayoutGrid, Settings, ChevronLeft, Share2, TrendingUp, ShieldCheck,
  Loader2, RefreshCw, ChevronRight, Zap, Search, ArrowRight, BrainCircuit, Activity, 
  AlertTriangle, Star, LogOut, Mail, UserCircle, Key, CheckCircle2
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  signInWithPopup,
  User as FirebaseUser 
} from "firebase/auth";
import { auth, googleProvider } from './services/firebase';

import { FootballMatch, Confidence, Prediction, VipInsight, Language, BetType } from './types';
import { MatchCard } from './components/MatchCard';
import { ConfidenceIndicator } from './components/ConfidenceIndicator';
import { generatePredictionsAndAnalysis } from './services/geminiService';
import { fetchMatchesByDate } from './services/footballApiService';

const { HashRouter, Routes, Route, Link, useLocation, useNavigate } = ReactRouterDOM;

const ADMIN_CODE = "20202020";
const PAYMENT_LINK = "https://bsbxsvng.mychariow.shop/prd_g3zdgh/checkout";

const VALID_CODES_ARRAY = ["BETIQ-5", "BETIQ-24", "BETIQ-55", "BETIQ-98", "BETIQ-153", "BETIQ-26435803", "BETIQ-26455670"];
const VALID_USER_CODES = new Set(VALID_CODES_ARRAY);

const STRINGS: Record<Language, any> = {
  FR: {
    loading: "Analyse IA en cours...",
    disclaimer: "Jouer comporte des risques : endettement, isolement. Appelez le 09 74 75 13 13.",
    signal: "SIGNAUX PRÉDICTIFS",
    analysis: "EXPERTISE TACTIQUE",
    language: "LANGUE"
  },
  EN: {
    loading: "AI Analysis in progress...",
    disclaimer: "Gambling involves risks. Play responsibly.",
    signal: "PREDICTIVE SIGNALS",
    analysis: "TACTICAL EXPERTISE",
    language: "LANGUAGE"
  }
};

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
      if (err.code === 'auth/unauthorized-domain') {
        setError("Domaine non autorisé. Ajoutez ce domaine dans la console Firebase (Authentification > Paramètres > Domaines autorisés).");
      } else {
        setError(err.message.includes('auth/invalid-credential') ? 'Identifiants invalides' : 'Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError("Domaine non autorisé. Ajoutez ce domaine dans la console Firebase.");
      } else {
        setError("Erreur lors de la connexion Google");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <div className="bg-[#0b1121] p-4 rounded-3xl border border-white/10 w-fit mx-auto mb-4 shadow-2xl">
          <BrainCircuit size={40} className="text-blue-400" />
        </div>
        <h1 className="text-3xl font-black italic tracking-tighter text-white">BETI<span className="text-orange-500">Q</span></h1>
      </div>

      <div className="w-full max-w-sm bg-[#0b1121] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
        <div className="flex bg-[#020617] p-1 rounded-2xl mb-8 border border-white/5">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${isLogin ? 'bg-orange-500 text-slate-950' : 'text-slate-500'}`}>Connexion</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!isLogin ? 'bg-orange-500 text-slate-950' : 'text-slate-500'}`}>Inscription</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 pl-12 text-xs text-white outline-none focus:border-orange-500/50" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input type="password" placeholder="Mot de passe" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 pl-12 text-xs text-white outline-none focus:border-orange-500/50" />
          </div>
          {error && <p className="text-[10px] text-rose-500 font-bold text-center leading-tight bg-rose-500/10 p-2 rounded-lg">{error}</p>}
          <button disabled={loading} className="w-full bg-orange-500 text-slate-950 font-black py-4 rounded-xl text-[11px] uppercase italic tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : (isLogin ? 'ENTRER' : 'CRÉER COMPTE')}
          </button>
        </form>

        <div className="relative flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-white/5"></div>
          <span className="text-[8px] font-black text-slate-700 uppercase">OU</span>
          <div className="flex-1 h-px bg-white/5"></div>
        </div>

        <button onClick={handleGoogleSignIn} className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          Google
        </button>
      </div>
    </div>
  );
};

const MatchDetailView: React.FC<{ language: Language, isVip: boolean }> = ({ language, isVip }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const match = state?.match as FootballMatch;
  const forcedLock = state?.forceLock as boolean;
  const S = STRINGS[language];
  const [data, setData] = useState<{ predictions: Prediction[], analysis: string | null, vipInsight: VipInsight | null }>({ predictions: [], analysis: null, vipInsight: null });
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (match) {
      if (!isVip && forcedLock) { setIsLocked(true); return; }
      const cacheKey = `betiq_v4_cache_${match.id}_${language}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setData(JSON.parse(cached)); return; }
      setLoading(true);
      generatePredictionsAndAnalysis(match, language).then(res => {
        setData(res); setLoading(false); localStorage.setItem(cacheKey, JSON.stringify(res));
      });
    }
  }, [match, language, isVip, forcedLock]);

  if (!match) return null;

  return (
    <div className="min-h-screen bg-[#020617] pb-32">
      <nav className="sticky top-0 bg-[#020617]/90 backdrop-blur-2xl p-4 flex items-center justify-between z-30 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-900 rounded-lg"><ChevronLeft size={18} /></button>
        <span className="text-[10px] font-bold text-white uppercase">{match.homeTeam} VS {match.awayTeam}</span>
        <button className="p-2 bg-slate-900 rounded-lg"><Share2 size={16} /></button>
      </nav>

      <div className="p-5 space-y-6 max-w-2xl mx-auto">
        {/* Header Match */}
        <div className="bg-gradient-to-br from-[#0b1121] to-[#020617] p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-around shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none"></div>
          <div className="text-center w-1/3">
             <img src={match.homeLogo} className="w-16 h-16 mx-auto mb-2 object-contain" alt="home" />
             <p className="text-[10px] font-black text-white uppercase">{match.homeTeam}</p>
          </div>
          <div className="text-2xl font-black italic text-slate-800">VS</div>
          <div className="text-center w-1/3">
             <img src={match.awayLogo} className="w-16 h-16 mx-auto mb-2 object-contain" alt="away" />
             <p className="text-[10px] font-black text-white uppercase">{match.awayTeam}</p>
          </div>
        </div>

        {isLocked ? (
          <div className="bg-[#0b1121] p-10 rounded-[2.5rem] border border-orange-500/20 text-center space-y-6 shadow-2xl">
            <Lock size={40} className="text-orange-500 mx-auto" />
            <h2 className="text-xl font-black text-white uppercase italic">PRONOSTIC ÉLITE</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Abonnez-vous pour débloquer les scores exacts et l'analyse buteurs.</p>
            <button onClick={() => navigate('/settings')} className="w-full bg-orange-500 text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">S'ABONNER</button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest italic">{S.loading}</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-700">
            {/* 1X2 / OVER-UNDER / BTTS Grid */}
            <div className="grid grid-cols-1 gap-4">
               {data.predictions.map((p, i) => (
                 <div key={i} className="bg-[#0b1121] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center group hover:border-orange-500/30 transition-all">
                    <div className="space-y-1">
                       <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">{p.type}</span>
                       <p className="text-xl font-black text-white italic uppercase tracking-tighter">{p.recommendation}</p>
                    </div>
                    <div className="text-right">
                       <div className="text-2xl font-black text-white mb-1">{p.probability}%</div>
                       <ConfidenceIndicator level={p.confidence as Confidence} />
                    </div>
                 </div>
               ))}
            </div>

            {/* Tactical Analysis */}
            <div className="bg-[#0b1121]/50 p-6 rounded-[2rem] border-l-4 border-orange-600 border-r border-t border-b border-white/5 space-y-4">
               <div className="flex items-center gap-2">
                 <ShieldCheck size={16} className="text-orange-400" />
                 <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">{S.analysis}</h3>
               </div>
               <p className="text-[11px] text-slate-300 leading-relaxed font-medium uppercase italic tracking-tight">{data.analysis}</p>
            </div>
            
            {/* VIP Insights Extra */}
            {data.vipInsight && (
              <div className="bg-[#0b1121] p-6 rounded-[2rem] border border-orange-500/10 space-y-6 shadow-2xl">
                 <div className="flex items-center gap-2">
                    <Star size={14} className="text-orange-500 fill-orange-500" />
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">INSIGHTS VIP</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                       <span className="text-[8px] font-black text-slate-600 uppercase block mb-2">Scores Exacts</span>
                       <div className="flex gap-2">
                          {data.vipInsight.exactScores.map((s, idx) => (
                            <span key={idx} className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-lg text-xs font-black">{s}</span>
                          ))}
                       </div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                       <span className="text-[8px] font-black text-slate-600 uppercase block mb-2">Fait Clé</span>
                       <p className="text-[9px] text-white font-bold leading-tight uppercase italic">{data.vipInsight.keyFact}</p>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
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

  const filteredMatches = useMemo(() => {
    return matches.filter(m => 
      m.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.awayTeam.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [matches, searchQuery]);

  const ELITE_TEAMS = ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'PSG', 'Bayern Munich', 'Arsenal', 'Inter'];
  const isElite = (m: FootballMatch) => ELITE_TEAMS.some(t => m.homeTeam.includes(t) || m.awayTeam.includes(t));

  const freeMatches = filteredMatches.filter(m => !isElite(m)).slice(0, 5);
  const eliteMatches = filteredMatches.filter(isElite).slice(0, 3);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
           <BrainCircuit size={24} className="text-blue-400" />
           <h1 className="text-2xl font-black italic tracking-tighter">BETI<span className="text-orange-500">Q</span></h1>
        </div>
        <button onClick={onRefresh} className="p-2 bg-slate-900 rounded-xl"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
      </header>

      <DatePicker selectedDate={selectedDate} onDateSelect={onDateChange} />

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Chercher un match..." className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[10px] text-white font-bold uppercase outline-none" />
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-orange-500" size={32} />
          <p className="text-[8px] font-black text-slate-700 uppercase">{S.loading}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {eliteMatches.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-1">
                <Crown size={12} className="text-orange-500" />
                <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">ÉLITE VIP PRÉDICTIONS</h3>
              </div>
              {eliteMatches.map(m => (
                <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={!isVip} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} />
              ))}
            </>
          )}

          <div className="flex items-center gap-2 px-1">
            <Zap size={12} className="text-blue-400" />
            <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">ANALYSES GRATUITES</h3>
          </div>
          {freeMatches.map(m => (
            <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={false} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: false } })} />
          ))}
        </div>
      )}
    </div>
  );
};

const Logo: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div className="flex items-center gap-2">
    <div className="bg-[#0b1121] p-1.5 rounded-xl border border-white/10">
      <BrainCircuit size={size} className="text-blue-400" />
    </div>
    <div className="flex flex-col leading-none">
      <h1 className="text-xl font-black italic tracking-tighter">
        <span className="text-white">BETI</span><span className="text-[#f97316]">Q</span>
      </h1>
      <span className="text-[6px] font-black text-blue-400 uppercase tracking-widest mt-0.5">IA ANALYTICS</span>
    </div>
  </div>
);

const DatePicker: React.FC<{ selectedDate: string, onDateSelect: (date: string) => void }> = ({ selectedDate, onDateSelect }) => {
  const dates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-2 -mx-1 px-1">
      {dates.map((d) => {
        const isSelected = d === selectedDate;
        const dateObj = new Date(d);
        const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase().replace('.', '');
        const dayNum = dateObj.getDate();
        
        return (
          <button
            key={d}
            onClick={() => onDateSelect(d)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl border transition-all ${
              isSelected 
                ? 'bg-orange-500 border-orange-400 text-slate-950 shadow-lg shadow-orange-500/20' 
                : 'bg-slate-900/50 border-white/5 text-slate-500'
            }`}
          >
            <span className={`text-[7px] font-black tracking-tighter ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{dayName}</span>
            <span className="text-sm font-black italic">{dayNum}</span>
          </button>
        );
      })}
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
  const handleLogout = async () => { await signOut(auth); };

  const checkCode = (val: string) => {
    const trimmed = val.trim().toUpperCase();
    setCode(trimmed);
    if (!userEmail) return;
    if (trimmed === ADMIN_CODE || VALID_USER_CODES.has(trimmed)) {
      setIsVip(true); 
      localStorage.setItem(`btq_isVip_${userEmail}`, 'true'); 
    }
  };

  return (
    <div className="p-6 pb-32 space-y-6 max-w-xl mx-auto">
      <div className="bg-[#0b1121] p-6 rounded-[1.8rem] border border-white/5 space-y-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-900 rounded-full"><UserCircle size={28} className="text-slate-600" /></div>
          <div>
            <p className="text-[8px] font-black text-slate-600 uppercase">Utilisateur</p>
            <p className="text-xs font-bold text-white">{userEmail}</p>
          </div>
        </div>
        <h2 className="text-[8px] font-black uppercase text-slate-600 tracking-widest">{S.language}</h2>
        <div className="flex gap-2">
          {['FR', 'EN'].map(l => (
            <button key={l} onClick={() => setLanguage(l as Language)} className={`flex-1 py-3 rounded-lg text-[9px] font-black border transition-all ${language === l ? 'bg-orange-600 border-orange-400 text-white' : 'bg-[#020617] border-white/5 text-slate-700'}`}>{l}</button>
          ))}
        </div>
      </div>

      {!isVip ? (
        <div className="bg-[#0b1121] p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
          <h2 className="text-[8px] font-black uppercase text-slate-600 tracking-widest text-center">ACTIVER L'ACCÈS VIP</h2>
          <input type="text" value={code} onChange={(e) => checkCode(e.target.value)} placeholder="Code d'activation..." className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 text-center font-black text-lg outline-none text-white uppercase placeholder:text-slate-800" />
          <button onClick={() => window.open(PAYMENT_LINK, '_blank')} className="w-full bg-orange-500 text-slate-950 font-black py-4 rounded-xl text-[11px] uppercase italic tracking-widest shadow-xl active:scale-95 transition-all">Acheter un accès (30j)</button>
        </div>
      ) : (
        <div className="bg-orange-500/10 p-8 rounded-[1.8rem] border border-orange-500/20 text-center">
          <CheckCircle2 size={32} className="text-orange-400 mx-auto mb-2" />
          <span className="text-lg font-black text-white italic block uppercase">ACCÈS VIP ACTIF</span>
        </div>
      )}

      <button onClick={handleLogout} className="w-full bg-rose-500/10 p-5 rounded-[1.5rem] border border-rose-500/20 flex items-center justify-center gap-3 group hover:bg-rose-500/20 transition-all">
        <LogOut size={20} className="text-rose-500" />
        <span className="text-xs font-black text-white uppercase italic">Déconnexion</span>
      </button>
    </div>
  );
};

const VipView: React.FC<{ matches: FootballMatch[], loading: boolean, language: Language, isVip: boolean }> = ({ matches, loading, language, isVip }) => {
  const navigate = useNavigate();
  const ELITE_TEAMS = ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'PSG', 'Bayern Munich', 'Arsenal', 'Inter'];
  const eliteMatches = matches.filter(m => ELITE_TEAMS.some(t => m.homeTeam.includes(t) || m.awayTeam.includes(t)));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-orange-400" size={32} />
      <span className="text-[8px] font-black text-slate-700 uppercase">Chargement Élite...</span>
    </div>
  );

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto">
      <header className="py-8">
        <div className="flex items-center gap-2 mb-1">
           <Crown size={18} className="text-orange-500" />
           <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">ESPACE VIP</h2>
        </div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ANALYSES TACTIQUES & SCORES EXACTS</p>
      </header>

      <div className="space-y-4">
        {eliteMatches.map((match) => (
          <MatchCard key={match.id} match={match} isVipUser={isVip} forceLock={!isVip} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} />
        ))}
        {eliteMatches.length === 0 && <p className="text-center text-slate-500 uppercase text-[10px] py-10">Aucun match Élite aujourd'hui</p>}
      </div>
    </div>
  );
};

const SplashScreen: React.FC = () => (
  <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center">
    <div className="bg-[#0b1121] p-6 rounded-[3rem] border border-white/5 shadow-2xl scale-125">
      <BrainCircuit size={60} className="text-blue-400 animate-pulse" />
    </div>
    <div className="text-center mt-8 space-y-2">
      <h1 className="text-4xl font-black italic tracking-tighter text-white">BETI<span className="text-orange-500">Q</span></h1>
      <p className="text-[8px] font-black text-blue-500/50 uppercase tracking-[0.8em]">Neural Engine v4.0</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'FR');
  const [isVip, setIsVip] = useState<boolean>(false);
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email) {
        setIsVip(localStorage.getItem(`btq_isVip_${u.email}`) === 'true');
      }
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
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) fetchMatches(selectedDate);
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, [selectedDate, user]);

  if (showSplash || authLoading) return <SplashScreen />;
  if (!user) return <AuthView />;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#020617] text-slate-100">
        <Routes>
          <Route path="/" element={<PredictionsView matches={matches} loading={loading} language={language} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} onRefresh={() => fetchMatches(selectedDate)} />} />
          <Route path="/settings" element={<SettingsView language={language} setLanguage={setLanguage} isVip={isVip} setIsVip={setIsVip} userEmail={user.email} />} />
          <Route path="/match/:id" element={<MatchDetailView language={language} isVip={isVip} />} />
          <Route path="/vip" element={<VipView matches={matches} loading={loading} language={language} isVip={isVip} />} />
          <Route path="*" element={<ReactRouterDOM.Navigate to="/" />} />
        </Routes>
        <nav className="fixed bottom-4 left-8 right-8 bg-[#0b1121]/95 backdrop-blur-3xl border border-white/10 rounded-full py-2 px-6 flex items-center justify-around z-50 shadow-2xl">
          <Link to="/" className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-orange-400">
            <LayoutGrid size={16} /><span className="text-[7px] font-black uppercase">PRONOS</span>
          </Link>
          <Link to="/vip" className="flex flex-col items-center group relative">
            <div className="bg-orange-500 p-1.5 rounded-full -mt-7 border-[3px] border-[#020617] shadow-xl">
              <Crown size={16} className="text-slate-950" />
            </div>
            <span className="text-[7px] font-black text-orange-500 mt-1 uppercase">VIP</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-orange-400">
            <Settings size={16} /><span className="text-[7px] font-black uppercase">COMPTE</span>
          </Link>
        </nav>
      </div>
    </HashRouter>
  );
};

export default App;