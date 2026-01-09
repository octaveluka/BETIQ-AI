import { auth } from './services/firebase';
import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  Crown, Lock, LayoutGrid, Settings, ChevronLeft, Search,
  Loader2, RefreshCw, Zap, BrainCircuit, CheckCircle2,
  LogOut, UserCircle, Target, Activity, AlertCircle, Goal, AlertTriangle
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from "firebase/auth";

import { FootballMatch, Confidence, Language, BetType, TeamStats } from './types';
import { MatchCard } from './components/MatchCard';
import { VipSafeCard } from './components/VipSafeCard';
import { ConfidenceIndicator } from './components/ConfidenceIndicator';
import { generatePredictionsAndAnalysis, AnalysisResult } from './services/geminiService';
import { fetchMatchesByDate, fetchStandings } from './services/footballApiService';

const { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } = ReactRouterDOM;

const ADMIN_CODE = "20202020";
const PAYMENT_LINK = "https://bsbxsvng.mychariow.shop/prd_g3zdgh/checkout";
const VALID_CODES_ARRAY = ["BETIQ-5", "BETIQ-24", "BETIQ-55", "BETIQ-98", "BETIQ-153", "BETIQ-26435803", "BETIQ-26455670"];
const VALID_USER_CODES = new Set(VALID_CODES_ARRAY);

const STRINGS: Record<Language, any> = {
  FR: {
    loading: "Calcul IA Fondamentale...",
    error: "Erreur d'analyse IA",
    freeTitle: "SECONDE ZONE",
    vipTitle: "CHOCS DU JOUR",
    topVip: "LES 3 GAGNANTS DU JOUR",
    allVip: "TOUS LES PRONOSTICS",
    vipAccess: "MODE VIP ACTIVÉ",
    buyVip: "Passer VIP (30 jours)",
    enterCode: "Code d'activation...",
    vipInsight: "STATISTIQUES & SCORES",
    algoVerdict: "Analyse Tactique IA",
    searchPlaceholder: "Rechercher un match ou une ligue..."
  },
  EN: {
    loading: "AI Analysis in Progress...",
    error: "AI Analysis Error",
    freeTitle: "SECOND ZONE",
    vipTitle: "TODAY'S CLASHES",
    topVip: "TOP 3 WINNERS",
    allVip: "ALL PREDICTIONS",
    vipAccess: "VIP MODE ACTIVE",
    buyVip: "Get VIP Access",
    enterCode: "Activation Code...",
    vipInsight: "STATS & SCORES",
    algoVerdict: "AI Tactical Analysis",
    searchPlaceholder: "Search match or league..."
  }
};

const ELITE_TEAMS = ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Arsenal', 'Bayern Munich', 'PSG', 'Inter', 'AC Milan', 'Juventus', 'Dortmund', 'Chelsea', 'Atletico', 'Man Utd', 'Tottenham'];
const isPopularMatch = (match: FootballMatch) => ELITE_TEAMS.some(t => match.homeTeam.includes(t) || match.awayTeam.includes(t));

const DateSelector: React.FC<{ selectedDate: string, onDateChange: (d: string) => void }> = ({ selectedDate, onDateChange }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar py-3">
    {[0,1,2,3,4,5,6,7].map(i => {
      const d = new Date(); d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const isSel = iso === selectedDate;
      return (
        <button key={iso} onClick={() => onDateChange(iso)} className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-14 rounded-2xl border transition-all ${isSel ? 'bg-orange-500 border-orange-400 text-slate-950' : 'bg-[#0b1121] border-white/5 text-slate-500'}`}>
          <span className="text-[7px] font-black uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
          <span className="text-sm font-black italic">{d.getDate()}</span>
        </button>
      );
    })}
  </div>
);

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
      setError('Erreur d\'authentification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <div className="bg-[#0b1121] p-6 rounded-3xl border border-white/10 w-fit mx-auto mb-4 shadow-2xl">
          <BrainCircuit size={48} className="text-blue-400" />
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">BETI<span className="text-orange-500">Q</span></h1>
      </div>
      <div className="w-full max-w-sm bg-[#0b1121] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
        <div className="flex bg-[#020617] p-1 rounded-2xl mb-8 border border-white/5">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${isLogin ? 'bg-orange-500 text-slate-950' : 'text-slate-500'}`}>CONNEXION</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!isLogin ? 'bg-orange-500 text-slate-950' : 'text-slate-500'}`}>S'INSCRIRE</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 px-5 text-xs text-white outline-none focus:border-blue-500/50" />
          <input type="password" placeholder="Mot de passe" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 px-5 text-xs text-white outline-none focus:border-blue-500/50" />
          {error && <div className="text-[10px] text-rose-500 font-black text-center">{error}</div>}
          <button disabled={loading} className="w-full bg-orange-500 text-slate-950 font-black py-4 rounded-xl text-[11px] uppercase shadow-lg shadow-orange-500/20">
            {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : (isLogin ? 'ACCÉDER' : 'CRÉER COMPTE')}
          </button>
        </form>
      </div>
    </div>
  );
};

const PredictionsView: React.FC<any> = ({ matches, loading, language, isVip, selectedDate, onDateChange, onRefresh }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const S = STRINGS[language];

  const filtered = useMemo(() => {
    return matches.filter(m => 
      m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  const { vipHome, freeHome } = useMemo(() => {
    const vip = filtered.filter(isPopularMatch).slice(0, 2);
    const free = filtered.filter(m => !isPopularMatch(m)).slice(0, 3);
    return { vipHome: vip, freeHome: free };
  }, [filtered]);

  useEffect(() => {
    if (isVip) navigate('/vip');
  }, [isVip, navigate]);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto">
      <header className="flex items-center justify-between py-8">
        <div className="flex items-center gap-3">
           <BrainCircuit size={28} className="text-blue-400" />
           <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">BETI<span className="text-orange-500">Q</span></h1>
        </div>
        <button onClick={onRefresh} className="p-3 bg-slate-900/50 rounded-2xl border border-white/5">
          <RefreshCw size={16} className={loading ? 'animate-spin text-orange-500' : 'text-slate-400'} />
        </button>
      </header>

      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text" 
            placeholder={S.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b1121] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs text-white outline-none focus:border-blue-500/30"
          />
        </div>
        <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />
      </div>

      <div className="space-y-10">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown size={14} className="text-orange-500" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{S.vipTitle}</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {vipHome.map(m => (
              <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={!isVip} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-blue-400" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{S.freeTitle}</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {freeHome.map(m => (
              <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={false} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: false } })} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const VipZoneView: React.FC<any> = ({ matches, loading, language, isVip, selectedDate, onDateChange }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const S = STRINGS[language];
  
  const filtered = useMemo(() => {
    return matches.filter(m => 
      m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  const winners3 = useMemo(() => filtered.filter(isPopularMatch).slice(0, 3), [filtered]);
  const others = useMemo(() => filtered.filter(m => !winners3.some(t => t.id === m.id)), [filtered, winners3]);

  return (
    <div className="p-5 pb-32 max-w-2xl mx-auto space-y-6">
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${isVip ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-orange-500 shadow-orange-500/20'} shadow-lg`}>
            <Crown size={28} className="text-slate-950" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">{isVip ? 'PRONOSTICS ELITE' : 'ACCÈS VIP'}</h2>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">IA FONDAMENTALE</p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text" 
            placeholder={S.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b1121] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs text-white outline-none focus:border-blue-500/30"
          />
        </div>
        <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />
      </div>

      {loading ? (
        <div className="py-24 text-center"><Loader2 className="animate-spin text-orange-500 mx-auto" size={40} /></div>
      ) : (
        <div className="space-y-12">
          <section className="space-y-5">
            <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-widest italic">{S.topVip}</h3>
            <div className="space-y-4">
              {winners3.map(m => (
                <VipSafeCard key={m.id} match={m} isLocked={!isVip} onClick={() => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} />
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic">LISTE COMPLÈTE</h3>
            <div className="grid grid-cols-1 gap-5">
              {others.map(m => (
                <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={!isVip} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} />
              ))}
            </div>
          </section>
        </div>
      )}

      {!isVip && (
        <div className="mt-8 bg-[#0b1121] border border-orange-500/20 p-10 rounded-[3rem] text-center space-y-6 shadow-2xl">
          <Lock size={40} className="text-orange-500 mx-auto" />
          <p className="text-xs font-bold text-slate-300 italic uppercase">Scores exacts, Corners et Buteurs Élite.</p>
          <button onClick={() => navigate('/settings')} className="w-full bg-orange-500 text-slate-950 font-black py-5 rounded-2xl text-[11px] uppercase shadow-orange-500/20">PASSER VIP</button>
        </div>
      )}
    </div>
  );
};

const MatchDetailView: React.FC<any> = ({ language, isVip }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const match = state?.match as FootballMatch;
  const forcedLock = state?.forceLock as boolean;
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const S = STRINGS[language];

  const prepareAndAnalyze = async (m: FootballMatch) => {
    // Vérification du Cache Local pour la Persistence
    const cacheKey = `betiq_analysis_${m.id}_${language}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        setData(JSON.parse(cachedData));
        return; // On arrête là si on a déjà l'analyse en mémoire
      } catch (e) {
        console.warn("Cache parsing error", e);
      }
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Récupération des stats réelles
      if (m.league_id) {
        const standings = await fetchStandings(m.league_id);
        if (Array.isArray(standings)) {
          const h = standings.find(s => s.team_name.includes(m.homeTeam) || m.homeTeam.includes(s.team_name));
          const a = standings.find(s => s.team_name.includes(m.awayTeam) || m.awayTeam.includes(s.team_name));
          if (h) m.homeTeamStats = { standing: parseInt(h.overall_league_position), points: parseInt(h.overall_league_PTS), recentForm: h.overall_league_WDLW ? h.overall_league_WDLW.split('') : [] };
          if (a) m.awayTeamStats = { standing: parseInt(a.overall_league_position), points: parseInt(a.overall_league_PTS), recentForm: a.overall_league_WDLW ? a.overall_league_WDLW.split('') : [] };
        }
      }
      
      // 2. Appel IA
      const res = await generatePredictionsAndAnalysis(m, language);
      if (!res || !res.predictions) throw new Error("No data returned");
      
      // 3. Sauvegarde dans le cache pour les fois prochaines
      localStorage.setItem(cacheKey, JSON.stringify(res));
      setData(res);
    } catch (e) { 
      console.error("AI Analysis Error:", e);
      setError("Impossible de générer l'analyse. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (match && (!forcedLock || isVip)) {
      prepareAndAnalyze(match);
    }
  }, [match, language, isVip, forcedLock]);

  if (!match) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-[#020617] pb-32">
      <nav className="p-5 sticky top-0 bg-[#020617]/95 backdrop-blur-xl flex items-center justify-between border-b border-white/5 z-50">
        <button onClick={() => navigate(-1)} className="p-3 bg-slate-900 rounded-xl"><ChevronLeft size={20} /></button>
        <span className="text-[10px] font-black uppercase text-white truncate px-4">{match.homeTeam} VS {match.awayTeam}</span>
        <div className="w-10" />
      </nav>

      <div className="p-5 space-y-8 max-w-2xl mx-auto">
        <div className="bg-[#0b1121] p-10 rounded-[3.5rem] border border-white/5 flex items-center justify-around shadow-2xl">
          <div className="text-center w-1/3">
             <img src={match.homeLogo} className="w-20 h-20 mx-auto mb-4 object-contain" alt="home" />
             <p className="text-[12px] font-black text-white uppercase tracking-tighter">{match.homeTeam}</p>
          </div>
          <div className="text-3xl font-black italic text-slate-800 opacity-20 uppercase">VS</div>
          <div className="text-center w-1/3">
             <img src={match.awayLogo} className="w-20 h-20 mx-auto mb-4 object-contain" alt="away" />
             <p className="text-[12px] font-black text-white uppercase tracking-tighter">{match.awayTeam}</p>
          </div>
        </div>

        {forcedLock && !isVip ? (
          <div className="bg-[#0b1121] p-12 rounded-[3.5rem] border border-orange-500/20 text-center shadow-2xl space-y-8">
            <Lock size={48} className="text-orange-500 mx-auto" />
            <h2 className="text-2xl font-black text-white uppercase italic">ANALYSE ÉLITE BLOQUÉE</h2>
            <button onClick={() => navigate('/settings')} className="w-full bg-orange-500 text-slate-950 font-black py-5 rounded-2xl text-[10px] uppercase">PASSER VIP MAINTENANT</button>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 p-10 rounded-[3rem] border border-rose-500/20 text-center space-y-4">
            <AlertTriangle size={40} className="text-rose-500 mx-auto" />
            <p className="text-xs font-black text-rose-500 uppercase">{error}</p>
            <button onClick={() => prepareAndAnalyze(match)} className="px-6 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase">Réessayer</button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center py-24 gap-6">
            <Loader2 className="animate-spin text-orange-500" size={56} />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] text-center">{S.loading}</p>
          </div>
        ) : data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="grid grid-cols-1 gap-4">
              {data.predictions.map((p: any, i: number) => (
                <div key={i} className="bg-[#0b1121] p-7 rounded-[2.5rem] border border-white/5 flex justify-between items-center shadow-xl">
                  <div>
                    <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest block mb-1">{p.type}</span>
                    <div className="text-2xl font-black text-white italic uppercase">{p.recommendation}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white">{p.probability}%</div>
                    <ConfidenceIndicator level={p.confidence} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-orange-500/5 p-10 rounded-[3.5rem] border border-orange-500/20 space-y-8 shadow-xl">
              <div className="flex items-center gap-3">
                <Crown size={18} className="text-orange-500" />
                <span className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] italic">{S.vipInsight}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {data.vipInsight.exactScores.map((s, idx) => (
                  <div key={idx} className="bg-orange-500 text-slate-950 p-5 rounded-[1.5rem] text-center text-2xl font-black italic">{s}</div>
                ))}
              </div>

              {data.vipInsight.detailedStats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <Activity size={14} className="text-blue-400 mb-2" />
                    <span className="text-[8px] font-black text-slate-600 uppercase block">Corners</span>
                    <span className="text-sm font-bold text-white uppercase">{data.vipInsight.detailedStats.corners}</span>
                  </div>
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <AlertCircle size={14} className="text-yellow-500 mb-2" />
                    <span className="text-[8px] font-black text-slate-600 uppercase block">Cartons</span>
                    <span className="text-sm font-bold text-white uppercase">{data.vipInsight.detailedStats.yellowCards}</span>
                  </div>
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <Target size={14} className="text-emerald-500 mb-2" />
                    <span className="text-[8px] font-black text-slate-600 uppercase block">Tirs Cadrés</span>
                    <span className="text-sm font-bold text-white uppercase">{data.vipInsight.detailedStats.shotsOnTarget}</span>
                  </div>
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <Goal size={14} className="text-rose-500 mb-2" />
                    <span className="text-[8px] font-black text-slate-600 uppercase block">Fautes</span>
                    <span className="text-sm font-bold text-white uppercase">{data.vipInsight.detailedStats.fouls}</span>
                  </div>
                </div>
              )}

              {data.vipInsight.detailedStats?.scorers && (
                <div className="bg-white/5 p-8 rounded-[2.5rem] space-y-4">
                  <p className="text-[9px] font-black text-slate-600 uppercase text-center tracking-widest">BUTEURS PROBABLES (%)</p>
                  <div className="space-y-3">
                    {data.vipInsight.detailedStats.scorers.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-200 uppercase">{s.name}</span>
                        <span className="font-black text-blue-400">{s.probability}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#0b1121] p-10 rounded-[3.5rem] border-l-8 border-blue-500 shadow-2xl">
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-4 italic">{S.algoVerdict}</span>
               <p className="text-[15px] text-slate-200 leading-relaxed font-bold italic uppercase">{data.analysis}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsView: React.FC<any> = ({ language, setLanguage, isVip, setIsVip, userEmail }) => {
  const [code, setCode] = useState('');
  const S = STRINGS[language];

  const checkCode = (val: string) => {
    const trimmed = val.trim().toUpperCase();
    setCode(trimmed);
    if (trimmed === ADMIN_CODE || VALID_USER_CODES.has(trimmed)) {
      setIsVip(true);
      if (userEmail) localStorage.setItem(`btq_vip_status_${userEmail}`, 'true');
    }
  };

  return (
    <div className="p-6 pb-32 space-y-6 max-w-xl mx-auto">
      <div className="bg-[#0b1121] p-8 rounded-[2.5rem] border border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20"><UserCircle size={32} className="text-blue-400" /></div>
          <div><p className="text-sm font-bold text-white truncate">{userEmail}</p></div>
        </div>
        <div className="space-y-4">
          <h2 className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Langue de l'IA</h2>
          <div className="flex gap-4">
            {['FR', 'EN'].map(l => (
              <button key={l} onClick={() => { setLanguage(l as Language); localStorage.setItem('lang', l); }} className={`flex-1 py-4 rounded-xl text-[10px] font-black border transition-all ${language === l ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#020617] border-white/5 text-slate-700'}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {!isVip ? (
        <div className="bg-[#0b1121] p-10 rounded-[3rem] border border-white/5 space-y-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
          <Crown size={48} className="text-orange-500 mx-auto" />
          <input type="text" value={code} onChange={(e) => checkCode(e.target.value)} placeholder={S.enterCode} className="w-full bg-[#020617] border border-white/10 rounded-2xl py-5 text-center font-black text-white uppercase outline-none focus:border-orange-500/50" />
          <div className="text-[8px] font-black text-slate-700 uppercase">OU</div>
          <button onClick={() => window.open(PAYMENT_LINK, '_blank')} className="w-full bg-orange-500 text-slate-950 font-black py-5 rounded-2xl text-[11px] uppercase active:scale-95 transition-transform">ACTIVER MON PASS VIP (30J)</button>
        </div>
      ) : (
        <div className="bg-emerald-500/5 p-12 rounded-[3.5rem] border border-emerald-500/20 text-center shadow-2xl">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <span className="text-3xl font-black text-white italic block uppercase">PASS VIP ACTIF</span>
          <p className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest mt-2">Accès Illimité Elite</p>
        </div>
      )}

      <button onClick={() => signOut(auth)} className="w-full bg-rose-500/5 p-7 rounded-[2.5rem] border border-rose-500/10 flex items-center justify-center gap-4 text-rose-500 transition-colors hover:bg-rose-500/10">
        <LogOut size={22} /><span className="text-xs font-black uppercase italic">Déconnexion</span>
      </button>
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
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email) {
        const savedVip = localStorage.getItem(`btq_vip_status_${u.email}`) === 'true';
        setIsVip(savedVip);
      } else { setIsVip(false); }
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
        id: m.match_id, league: m.league_name, league_id: m.league_id, homeTeam: m.match_hometeam_name,
        awayTeam: m.match_awayteam_name, homeLogo: m.team_home_badge,
        awayLogo: m.team_away_badge, time: m.match_time, status: m.match_status,
        stats: { homeForm: [], awayForm: [], homeRank: 0, awayRank: 0, h2h: '' },
        predictions: []
      })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchMatches(selectedDate); }, [selectedDate, user]);

  if (authLoading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-8">
      <BrainCircuit size={64} className="text-blue-400 animate-pulse" />
      <p className="text-[12px] font-black text-slate-700 uppercase tracking-[0.5em]">SYNC BETIQ IA...</p>
    </div>
  );

  if (!user) return <AuthView />;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#020617] text-slate-100">
        <Routes>
          <Route path="/" element={<PredictionsView matches={matches} loading={loading} language={language} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} onRefresh={() => fetchMatches(selectedDate)} />} />
          <Route path="/settings" element={<SettingsView language={language} setLanguage={setLanguage} isVip={isVip} setIsVip={setIsVip} userEmail={user.email} />} />
          <Route path="/match/:id" element={<MatchDetailView language={language} isVip={isVip} />} />
          <Route path="/vip" element={<VipZoneView matches={matches} loading={loading} language={language} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <nav className="fixed bottom-6 left-6 right-6 bg-[#0b1121]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-3 flex items-center justify-around z-50 shadow-2xl">
          {!isVip && (
            <Link to="/" className="flex flex-col items-center gap-1.5 p-3 text-slate-500 hover:text-blue-400">
              <LayoutGrid size={22} /><span className="text-[8px] font-black uppercase tracking-tighter">ACCUEIL</span>
            </Link>
          )}
          
          <Link to="/vip" className="flex flex-col items-center group relative px-4">
            <div className={`${isVip ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-orange-500 shadow-orange-500/20'} p-3.5 rounded-full -mt-12 border-[6px] border-[#020617] shadow-xl group-active:scale-90 transition-transform`}>
              {isVip ? <Crown size={26} className="text-slate-950" /> : <Lock size={24} className="text-slate-950" />}
            </div>
            <span className={`text-[9px] font-black mt-1.5 uppercase italic tracking-widest ${isVip ? 'text-emerald-500' : 'text-orange-500'}`}>
              {isVip ? 'PRONOSTICS' : 'VIP'}
            </span>
          </Link>
          
          <Link to="/settings" className="flex flex-col items-center gap-1.5 p-3 text-slate-500 hover:text-blue-400">
            <Settings size={22} /><span className="text-[8px] font-black uppercase tracking-tighter">PROFIL</span>
          </Link>
        </nav>
      </div>
    </HashRouter>
  );
};

export default App;