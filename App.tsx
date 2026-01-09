import { auth } from './services/firebase';
import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  Crown, Lock, LayoutGrid, Settings, ChevronLeft, ShieldCheck,
  Loader2, RefreshCw, Zap, BrainCircuit, CheckCircle2,
  LogOut, UserCircle, ExternalLink, Info, TrendingUp, ChevronRight
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from "firebase/auth";

import { FootballMatch, Confidence, Language, BetType } from './types';
import { MatchCard } from './components/MatchCard';
import { VipSafeCard } from './components/VipSafeCard';
import { ConfidenceIndicator } from './components/ConfidenceIndicator';
import { generatePredictionsAndAnalysis, AnalysisResult } from './services/geminiService';
import { fetchMatchesByDate } from './services/footballApiService';

const { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } = ReactRouterDOM;

const ADMIN_CODE = "20202020";
const PAYMENT_LINK = "https://bsbxsvng.mychariow.shop/prd_g3zdgh/checkout";
const VALID_CODES_ARRAY = ["BETIQ-5", "BETIQ-24", "BETIQ-55", "BETIQ-98", "BETIQ-153", "BETIQ-26435803", "BETIQ-26455670"];
const VALID_USER_CODES = new Set(VALID_CODES_ARRAY);

const STRINGS: Record<Language, any> = {
  FR: {
    loading: "Analyse IA...",
    freeTitle: "PRONOSTICS GRATUITS",
    vipTitle: "SÉLECTION ELITE VIP",
    topVip: "LE TOP 3 DU JOUR",
    otherVip: "AUTRES MATCHS VIP",
    vipAccess: "MODE VIP ACTIVÉ",
    buyVip: "Devenir VIP (30 jours)",
    enterCode: "Code promo ou activation...",
    vipInsight: "ANALYSE PRÉCISION VIP",
    algoVerdict: "Verdict de l'IA",
    sources: "Sources de l'analyse"
  },
  EN: {
    loading: "AI Analysis...",
    freeTitle: "FREE PREDICTIONS",
    vipTitle: "ELITE VIP SELECTION",
    topVip: "TODAY'S TOP 3",
    otherVip: "OTHER VIP MATCHES",
    vipAccess: "VIP MODE ACTIVE",
    buyVip: "Get VIP Access",
    enterCode: "Enter Code...",
    vipInsight: "VIP PRECISION INSIGHT",
    algoVerdict: "AI Verdict",
    sources: "Data Sources"
  }
};

const ELITE_TEAMS = ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Arsenal', 'Bayern Munich', 'PSG', 'Inter', 'AC Milan', 'Juventus', 'Dortmund', 'Chelsea', 'Atletico', 'Man Utd', 'Tottenham'];
const isPopularMatch = (match: FootballMatch) => ELITE_TEAMS.some(t => match.homeTeam.includes(t) || match.awayTeam.includes(t));

const DateSelector: React.FC<{ selectedDate: string, onDateChange: (d: string) => void }> = ({ selectedDate, onDateChange }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
    {[0,1,2,3,4,5,6,7].map(i => {
      const d = new Date(); d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const isSel = iso === selectedDate;
      return (
        <button key={iso} onClick={() => onDateChange(iso)} className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-16 rounded-2xl border transition-all ${isSel ? 'bg-orange-500 border-orange-400 text-slate-950' : 'bg-[#0b1121] border-white/5 text-slate-500'}`}>
          <span className="text-[7px] font-black uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
          <span className="text-base font-black italic">{d.getDate()}</span>
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
      setError('Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
      <div className="mb-12 text-center">
        <div className="bg-[#0b1121] p-6 rounded-[2rem] border border-white/10 w-fit mx-auto mb-4 shadow-2xl">
          <BrainCircuit size={48} className="text-blue-400" />
        </div>
        <h1 className="text-5xl font-black italic tracking-tighter text-white">BETI<span className="text-orange-500">Q</span></h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-3">Intelligence Artificielle Football</p>
      </div>
      <div className="w-full max-w-sm bg-[#0b1121] border border-white/5 p-8 rounded-[3rem] shadow-2xl">
        <div className="flex bg-[#020617] p-1.5 rounded-2xl mb-8 border border-white/5">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all ${isLogin ? 'bg-orange-500 text-slate-950' : 'text-slate-500'}`}>Connexion</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all ${!isLogin ? 'bg-orange-500 text-slate-950' : 'text-slate-500'}`}>S'inscrire</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-2xl py-5 px-6 text-xs font-bold text-white outline-none focus:border-blue-500/50" />
          <input type="password" placeholder="Mot de passe" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-2xl py-5 px-6 text-xs font-bold text-white outline-none focus:border-blue-500/50" />
          {error && <div className="text-[10px] text-rose-500 font-black uppercase text-center">{error}</div>}
          <button disabled={loading} className="w-full bg-orange-500 text-slate-950 font-black py-5 rounded-2xl text-[11px] uppercase italic tracking-widest shadow-xl shadow-orange-500/30 active:scale-95 transition-transform">
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : (isLogin ? 'DÉCOLLER MAINTENANT' : 'CRÉER MON COMPTE')}
          </button>
        </form>
      </div>
    </div>
  );
};

const PredictionsView: React.FC<any> = ({ matches, loading, language, isVip, onRefresh }) => {
  const navigate = useNavigate();
  const S = STRINGS[language];

  // Logique Accueil : 2 VIP et 3 Gratuits
  const { vipHome, freeHome } = useMemo(() => {
    const vip = matches.filter(isPopularMatch).slice(0, 2);
    const free = matches.filter(m => !isPopularMatch(m)).slice(0, 3);
    return { vipHome: vip, freeHome: free };
  }, [matches]);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto">
      <header className="flex items-center justify-between py-10">
        <div className="flex items-center gap-3">
           <BrainCircuit size={32} className="text-blue-400" />
           <h1 className="text-3xl font-black italic tracking-tighter text-white">BETI<span className="text-orange-500">Q</span></h1>
        </div>
        <button onClick={onRefresh} className="p-3.5 bg-slate-900/50 rounded-2xl border border-white/5">
          <RefreshCw size={18} className={loading ? 'animate-spin text-orange-500' : 'text-slate-400'} />
        </button>
      </header>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="animate-spin text-orange-500 mx-auto mb-6" size={48} />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">{S.loading}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section VIP Home */}
          <section className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-500/20">
                  <Crown size={14} className="text-slate-950" />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{S.vipTitle}</h3>
              </div>
              <Link to="/vip" className="text-[8px] font-black text-orange-500 uppercase flex items-center gap-1">VOIR PLUS <ChevronRight size={10}/></Link>
            </div>
            <div className="grid grid-cols-1 gap-5">
              {vipHome.map(m => (
                <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={!isVip} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} />
              ))}
            </div>
          </section>

          {/* Section Gratuite Home */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5 px-1">
              <div className="bg-blue-500/20 p-1.5 rounded-lg border border-blue-500/20">
                <Zap size={14} className="text-blue-400" />
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{S.freeTitle}</h3>
            </div>
            <div className="grid grid-cols-1 gap-5">
              {freeHome.map(m => (
                <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={false} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: false } })} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const VipView: React.FC<any> = ({ matches, loading, language, isVip, selectedDate, onDateChange }) => {
  const navigate = useNavigate();
  const S = STRINGS[language];
  
  // VIP Page : Filtrer par date et popularité
  const elite = useMemo(() => matches.filter(isPopularMatch), [matches]);
  const top3 = useMemo(() => elite.slice(0, 3), [elite]);
  const others = useMemo(() => elite.slice(3), [elite]);

  return (
    <div className="p-6 pb-32 max-w-2xl mx-auto">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-orange-500 rounded-[1.5rem] shadow-2xl shadow-orange-500/30">
            <Crown size={32} className="text-slate-950" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">ESPACE VIP</h2>
            <p className="text-[8px] font-black text-orange-500/80 uppercase tracking-widest">Analyses IA Gemini 3 Pro</p>
          </div>
        </div>
      </header>

      <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />

      <div className="mt-10 space-y-10">
        {loading ? (
          <div className="py-24 text-center"><Loader2 className="animate-spin text-orange-500 mx-auto" size={40} /></div>
        ) : (
          <>
            {/* Top 3 Safe */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-[2px] w-8 bg-orange-500"></div>
                 <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-widest italic">{S.topVip}</h3>
              </div>
              <div className="space-y-4">
                {top3.length > 0 ? top3.map(m => (
                  <VipSafeCard 
                    key={m.id} 
                    match={m} 
                    isLocked={!isVip} 
                    onClick={() => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} 
                  />
                )) : (
                  <div className="py-10 text-center border border-dashed border-white/5 rounded-3xl text-slate-700 text-[10px] font-black uppercase">En attente de matchs...</div>
                )}
              </div>
            </section>

            {/* Autres VIP Matchs */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-[2px] w-8 bg-slate-700"></div>
                 <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">{S.otherVip}</h3>
              </div>
              <div className="grid grid-cols-1 gap-5">
                {others.map(m => (
                  <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={!isVip} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {!isVip && (
        <div className="mt-12 bg-gradient-to-br from-[#0b1121] to-[#020617] border border-orange-500/20 p-10 rounded-[3.5rem] text-center space-y-6 shadow-2xl">
          <Lock size={40} className="text-orange-500 mx-auto" />
          <p className="text-xs font-bold text-slate-300 italic px-4">Accédez aux scores exacts et analyses tactiques de l'IA sur tous les matchs Elite.</p>
          <button onClick={() => navigate('/settings')} className="w-full bg-orange-500 text-slate-950 font-black py-5 rounded-2xl text-[11px] uppercase shadow-2xl shadow-orange-500/30 active:scale-95 transition-transform">ACTIVER MON PASS VIP</button>
        </div>
      )}
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
    <div className="p-6 pb-32 space-y-8 max-w-xl mx-auto">
      <div className="bg-[#0b1121] p-10 rounded-[3rem] border border-white/5 space-y-8">
        <div className="flex items-center gap-5 border-b border-white/5 pb-8">
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20"><UserCircle size={36} className="text-blue-400" /></div>
          <div className="overflow-hidden">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Compte Connecté</p>
            <p className="text-base font-bold text-white truncate">{userEmail}</p>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase text-slate-600 tracking-widest">LANGUE D'ANALYSE</h2>
          <div className="flex gap-4">
            {['FR', 'EN'].map(l => (
              <button key={l} onClick={() => { setLanguage(l as Language); localStorage.setItem('lang', l); }} className={`flex-1 py-5 rounded-2xl text-xs font-black border transition-all ${language === l ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/20' : 'bg-[#020617] border-white/5 text-slate-700'}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {!isVip ? (
        <div className="bg-[#0b1121] p-12 rounded-[3.5rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 p-6 opacity-5"><Crown size={120} className="text-orange-500" /></div>
          <div className="space-y-3 relative z-10">
            <h2 className="text-[11px] font-black uppercase text-slate-500 tracking-widest italic">OFFRE PREMIUM</h2>
            <p className="text-2xl font-black text-white italic leading-tight">DÉBLOQUEZ L'ELITE</p>
          </div>
          <div className="space-y-4 relative z-10">
            <input type="text" value={code} onChange={(e) => checkCode(e.target.value)} placeholder={S.enterCode} className="w-full bg-[#020617] border border-white/10 rounded-2xl py-6 text-center font-black text-white uppercase outline-none focus:border-orange-500/50" />
            <div className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">OU</div>
            <button onClick={() => window.open(PAYMENT_LINK, '_blank')} className="w-full bg-orange-500 text-slate-950 font-black py-6 rounded-2xl text-[12px] uppercase shadow-2xl shadow-orange-500/30 active:scale-95 transition-transform">
              {S.buyVip}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/5 p-12 rounded-[3.5rem] border border-emerald-500/20 text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20"><CheckCircle2 size={40} className="text-slate-950" /></div>
          <span className="text-3xl font-black text-white italic block uppercase mb-2">{S.vipAccess}</span>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Accès VIP permanent actif</p>
        </div>
      )}

      <button onClick={() => signOut(auth)} className="w-full bg-rose-500/5 p-8 rounded-[2.5rem] border border-rose-500/10 flex items-center justify-center gap-4 hover:bg-rose-500/10 transition-colors">
        <LogOut size={24} className="text-rose-500" /><span className="text-xs font-black text-white uppercase italic">Déconnexion</span>
      </button>
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
  const S = STRINGS[language];

  useEffect(() => {
    if (match && (!forcedLock || isVip)) {
      setLoading(true);
      generatePredictionsAndAnalysis(match, language).then(res => {
        setData(res); setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [match, language, isVip, forcedLock]);

  if (!match) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-[#020617] pb-32">
      <nav className="p-6 sticky top-0 bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-between border-b border-white/5 z-50">
        <button onClick={() => navigate(-1)} className="p-3.5 bg-slate-900 rounded-2xl hover:bg-slate-800 transition-colors"><ChevronLeft size={22} /></button>
        <div className="text-center overflow-hidden">
          <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate block">{match.homeTeam} VS {match.awayTeam}</span>
          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em]">{match.league}</span>
        </div>
        <div className="w-10" />
      </nav>

      <div className="p-6 space-y-10 max-w-2xl mx-auto">
        <div className="bg-gradient-to-b from-[#0b1121] to-[#020617] p-12 rounded-[4rem] border border-white/5 flex items-center justify-around shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="text-center w-1/3 relative z-10">
             <div className="w-24 h-24 mx-auto mb-5 bg-slate-800/40 rounded-full p-5 flex items-center justify-center border border-white/10 shadow-inner">
               <img src={match.homeLogo} className="max-w-full max-h-full object-contain drop-shadow-2xl" alt="home" />
             </div>
             <p className="text-[13px] font-black text-white uppercase tracking-tighter leading-tight">{match.homeTeam}</p>
          </div>
          <div className="text-4xl font-black italic text-slate-800 relative z-10 px-4">VS</div>
          <div className="text-center w-1/3 relative z-10">
             <div className="w-24 h-24 mx-auto mb-5 bg-slate-800/40 rounded-full p-5 flex items-center justify-center border border-white/10 shadow-inner">
               <img src={match.awayLogo} className="max-w-full max-h-full object-contain drop-shadow-2xl" alt="away" />
             </div>
             <p className="text-[13px] font-black text-white uppercase tracking-tighter leading-tight">{match.awayTeam}</p>
          </div>
        </div>

        {forcedLock && !isVip ? (
          <div className="bg-[#0b1121] p-12 rounded-[4rem] border border-orange-500/20 text-center space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-orange-500/10 rounded-full blur-[100px]"></div>
            <Lock size={56} className="text-orange-500 mx-auto relative z-10" />
            <div className="space-y-4 relative z-10">
              <h2 className="text-3xl font-black text-white uppercase italic leading-none">ANALYSE VIP BLOQUÉE</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed px-4">Cette analyse haute-précision utilise des sources en temps réel pour déceler les meilleures opportunités.</p>
            </div>
            <button onClick={() => navigate('/settings')} className="w-full bg-orange-500 text-slate-950 font-black py-6 rounded-2xl text-[13px] uppercase shadow-2xl shadow-orange-500/30 active:scale-95 transition-transform">DÉVERROUILLER MAINTENANT</button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center py-28 gap-8">
            <div className="relative">
              <Loader2 className="animate-spin text-orange-500" size={64} />
              <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 opacity-60" size={28} />
            </div>
            <p className="text-[11px] font-black text-slate-500 uppercase italic tracking-[0.4em] text-center">{S.loading}</p>
          </div>
        ) : data && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 gap-6">
              {data.predictions.map((p: any, i: number) => (
                <div key={i} className="bg-[#0b1121] p-8 rounded-[3rem] border border-white/5 flex justify-between items-center shadow-xl">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block">{p.type}</span>
                    <div className="text-3xl font-black text-white italic uppercase tracking-tighter">{p.recommendation}</div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={18} className="text-emerald-500" />
                      <div className="text-4xl font-black text-white tabular-nums">{p.probability}%</div>
                    </div>
                    <ConfidenceIndicator level={p.confidence} />
                  </div>
                </div>
              ))}
            </div>

            {data.vipInsight && (
              <div className="bg-orange-500/5 p-10 rounded-[4rem] border border-orange-500/20 space-y-8">
                <div className="flex items-center gap-4">
                  <Crown size={20} className="text-orange-500" />
                  <span className="text-[12px] font-black text-orange-500 uppercase tracking-widest italic">{S.vipInsight}</span>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-[#020617]/80 p-8 rounded-[2.5rem] border border-white/5">
                     <p className="text-[10px] font-black text-slate-600 uppercase mb-5 tracking-widest">Scores IA Favoris :</p>
                     <div className="flex flex-wrap gap-4">
                        {data.vipInsight.exactScores.map((s: string, idx: number) => (
                          <div key={idx} className="bg-orange-500 text-slate-950 px-8 py-4 rounded-2xl text-2xl font-black italic shadow-2xl shadow-orange-500/20">{s}</div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-white/5 p-8 rounded-[2.5rem]">
                    <p className="text-[10px] font-black text-slate-600 uppercase mb-4 tracking-widest">Analyse Tactique Flash :</p>
                    <p className="text-sm font-bold text-white leading-relaxed italic uppercase tracking-tight">{data.vipInsight.keyFact}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#0b1121]/80 p-12 rounded-[4rem] border-l-8 border-blue-500 border border-white/5 shadow-inner relative overflow-hidden">
               <div className="absolute top-10 right-10 text-blue-500/10"><BrainCircuit size={100} /></div>
               <div className="flex items-center gap-4 mb-8 relative z-10">
                  <Zap size={20} className="text-blue-400" />
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest">{S.algoVerdict}</span>
               </div>
               <p className="text-[16px] text-slate-200 leading-relaxed font-bold italic tracking-tight uppercase relative z-10">{data.analysis}</p>
            </div>

            {data.sources.length > 0 && (
              <div className="space-y-5 px-2">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{S.sources}</h4>
                <div className="grid grid-cols-1 gap-3">
                  {data.sources.map((s, idx) => (
                    <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-[#0b1121] p-6 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-blue-500/5 hover:border-blue-500/20 transition-all">
                      <div className="flex items-center gap-4 max-w-[80%]">
                        <Info size={16} className="text-slate-600" />
                        <span className="text-[12px] font-bold text-blue-400 truncate">{s.title}</span>
                      </div>
                      <ExternalLink size={16} className="text-slate-700" />
                    </a>
                  ))}
                </div>
              </div>
            )}
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
        id: m.match_id, league: m.league_name, homeTeam: m.match_hometeam_name,
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
      <BrainCircuit size={80} className="text-blue-400 animate-pulse" />
      <p className="text-[12px] font-black text-slate-700 uppercase tracking-[0.5em]">SYNCHRONISATION BETIQ...</p>
    </div>
  );

  if (!user) return <AuthView />;

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#020617] text-slate-100">
        <Routes>
          <Route path="/" element={<PredictionsView matches={matches} loading={loading} language={language} isVip={isVip} onRefresh={() => fetchMatches(selectedDate)} />} />
          <Route path="/settings" element={<SettingsView language={language} setLanguage={setLanguage} isVip={isVip} setIsVip={setIsVip} userEmail={user.email} />} />
          <Route path="/match/:id" element={<MatchDetailView language={language} isVip={isVip} />} />
          <Route path="/vip" element={<VipView matches={matches} loading={loading} language={language} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <nav className="fixed bottom-8 left-8 right-8 bg-[#0b1121]/95 backdrop-blur-3xl border border-white/10 rounded-[3rem] py-4 px-6 flex items-center justify-around z-50 shadow-2xl">
          <Link to="/" className="flex flex-col items-center gap-2 p-3 text-slate-500 hover:text-blue-400 transition-all">
            <LayoutGrid size={24} /><span className="text-[9px] font-black uppercase tracking-tight">PRONOS</span>
          </Link>
          <Link to="/vip" className="flex flex-col items-center group relative px-4">
            <div className="bg-orange-500 p-3.5 rounded-full -mt-16 border-[8px] border-[#020617] shadow-[0_15px_40px_rgba(249,115,22,0.5)] group-active:scale-90 transition-transform">
              <Crown size={28} className="text-slate-950" />
            </div>
            <span className="text-[9px] font-black text-orange-500 mt-2 uppercase italic tracking-widest">ÉLITE VIP</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center gap-2 p-3 text-slate-500 hover:text-blue-400 transition-all">
            <Settings size={24} /><span className="text-[9px] font-black uppercase tracking-tight">PROFIL</span>
          </Link>
        </nav>
      </div>
    </HashRouter>
  );
};

export default App;
