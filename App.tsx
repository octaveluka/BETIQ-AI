
import { auth } from './services/firebase';
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

import { FootballMatch, Confidence, Prediction, VipInsight, Language, BetType } from './types';
import { MatchCard } from './components/MatchCard';
import { VipSafeCard } from './components/VipSafeCard';
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
    loading: "Intelligence Artificielle...",
    freeTitle: "PRONOSTICS GRATUITS",
    vipTitle: "SÉLECTION VIP SAFE",
    search: "Match ou Ligue...",
    logout: "Se déconnecter",
    vipAccess: "MODE VIP ACTIVÉ",
    buyVip: "Devenir VIP (30 jours)",
    enterCode: "Code promo ou activation...",
    vipInsight: "ANALYSE PRÉCISION VIP",
    algoVerdict: "Verdict de l'Algorithme"
  },
  EN: {
    loading: "AI Processing...",
    freeTitle: "FREE PREDICTIONS",
    vipTitle: "VIP SAFE SELECTION",
    search: "Search Match...",
    logout: "Logout",
    vipAccess: "VIP MODE ACTIVE",
    buyVip: "Get VIP Access",
    enterCode: "Enter Code...",
    vipInsight: "VIP PRECISION INSIGHT",
    algoVerdict: "Algorithm Verdict"
  }
};

const ELITE_TEAMS = ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Arsenal', 'Bayern Munich', 'PSG', 'Inter', 'AC Milan', 'Juventus', 'Dortmund', 'Chelsea', 'Atletico', 'Man Utd', 'Tottenham'];
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
      setError('Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <div className="bg-[#0b1121] p-4 rounded-3xl border border-white/10 w-fit mx-auto mb-4 shadow-2xl">
          <BrainCircuit size={48} className="text-blue-400" />
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter text-white">BETI<span className="text-orange-500">Q</span></h1>
      </div>
      <div className="w-full max-w-sm bg-[#0b1121] border border-white/5 p-8 rounded-[3rem] shadow-2xl">
        <div className="flex bg-[#020617] p-1 rounded-2xl mb-8 border border-white/5">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${isLogin ? 'bg-orange-500 text-slate-950' : 'text-slate-500'}`}>Connexion</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!isLogin ? 'bg-orange-500 text-slate-950' : 'text-slate-500'}`}>S'inscrire</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 px-5 text-xs font-bold text-white outline-none focus:border-blue-500/50" />
          <input type="password" placeholder="Mot de passe" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 px-5 text-xs font-bold text-white outline-none focus:border-blue-500/50" />
          {error && <div className="text-[10px] text-rose-500 font-black uppercase text-center">{error}</div>}
          <button disabled={loading} className="w-full bg-orange-500 text-slate-950 font-black py-4 rounded-xl text-[11px] uppercase italic tracking-widest shadow-xl shadow-orange-500/30">
            {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : (isLogin ? 'ACCÉDER AUX PRONOSTICS' : 'CRÉER MON COMPTE')}
          </button>
        </form>
      </div>
    </div>
  );
};

const DateSelector: React.FC<{ selectedDate: string, onDateChange: (d: string) => void }> = ({ selectedDate, onDateChange }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
    {[0,1,2,3,4,5,6,7].map(i => {
      const d = new Date(); d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const isSel = iso === selectedDate;
      return (
        <button key={iso} onClick={() => onDateChange(iso)} className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-[1.2rem] border transition-all ${isSel ? 'bg-orange-500 border-orange-400 text-slate-950' : 'bg-[#0b1121] border-white/5 text-slate-500'}`}>
          <span className="text-[7px] font-black uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
          <span className="text-base font-black italic">{d.getDate()}</span>
        </button>
      );
    })}
  </div>
);

const PredictionsView: React.FC<any> = ({ matches, loading, language, isVip, selectedDate, onDateChange, onRefresh }) => {
  const navigate = useNavigate();
  const S = STRINGS[language];

  const { vipHome, freeHome } = useMemo(() => {
    const vip = matches.filter(isPopularMatch).slice(0, 2);
    const free = matches.filter(m => !isPopularMatch(m)).slice(0, 3);
    return { vipHome: vip, freeHome: free };
  }, [matches]);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto">
      <header className="flex items-center justify-between py-8">
        <div className="flex items-center gap-3">
           <BrainCircuit size={28} className="text-blue-400" />
           <h1 className="text-3xl font-black italic tracking-tighter text-white">BETI<span className="text-orange-500">Q</span></h1>
        </div>
        <button onClick={onRefresh} className="p-3 bg-slate-900/50 rounded-2xl"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </header>

      <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="animate-spin text-orange-500 mx-auto mb-4" size={40} />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{S.loading}</p>
        </div>
      ) : (
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-1">
                <Crown size={14} className="text-orange-500" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{S.vipTitle}</h3>
              </div>
              <Link to="/vip" className="text-[8px] font-black text-orange-500 uppercase">VOIR TOUT</Link>
            </div>
            {vipHome.map(m => (
              <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={!isVip} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} />
            ))}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Zap size={14} className="text-blue-400" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{S.freeTitle}</h3>
            </div>
            {freeHome.map(m => (
              <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={false} onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m, forceLock: false } })} />
            ))}
          </section>
        </div>
      )}
    </div>
  );
};

const VipView: React.FC<any> = ({ matches, loading, language, isVip, selectedDate, onDateChange }) => {
  const navigate = useNavigate();
  const S = STRINGS[language];
  
  const eliteMatches = useMemo(() => matches.filter(isPopularMatch), [matches]);

  return (
    <div className="p-6 pb-32 max-w-2xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
            <Crown size={28} className="text-slate-950" />
          </div>
          <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">{S.vipTitle}</h2>
        </div>
      </header>

      <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />

      <div className="bg-[#0b1121] p-6 rounded-[3rem] border border-white/5 space-y-4 shadow-2xl relative">
        <div className="flex items-center gap-2 mb-4 px-1">
          <Star className="text-orange-500 fill-orange-500" size={14} />
          <h3 className="text-[11px] font-black text-white/80 uppercase tracking-widest italic">{S.vipTitle}</h3>
        </div>

        {loading ? (
          <div className="py-12 text-center"><Loader2 className="animate-spin text-orange-500 mx-auto" /></div>
        ) : eliteMatches.length > 0 ? (
          eliteMatches.map(m => (
            <VipSafeCard 
              key={m.id} 
              match={m} 
              isLocked={!isVip} 
              onClick={() => navigate(`/match/${m.id}`, { state: { match: m, forceLock: !isVip } })} 
            />
          ))
        ) : (
          <div className="py-20 text-center text-slate-700 text-[10px] font-black uppercase italic">Aucun choc majeur détecté.</div>
        )}
      </div>
      
      {!isVip && (
        <div className="mt-8 bg-orange-500/5 border border-orange-500/20 p-8 rounded-[2.5rem] text-center space-y-4">
          <Lock size={32} className="text-orange-500 mx-auto" />
          <p className="text-xs font-bold text-slate-400 italic">Accédez à l'intégralité des analyses IA d'élite.</p>
          <button onClick={() => navigate('/settings')} className="w-full bg-orange-500 text-slate-950 font-black py-4 rounded-2xl text-[10px] uppercase">ACTIVER L'ACCÈS VIP</button>
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
      <div className="bg-[#0b1121] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20"><UserCircle size={32} className="text-blue-400" /></div>
          <div className="overflow-hidden">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Utilisateur</p>
            <p className="text-sm font-bold text-white truncate">{userEmail}</p>
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-[9px] font-black uppercase text-slate-600 tracking-widest">LANGUE</h2>
          <div className="flex gap-3">
            {['FR', 'EN'].map(l => (
              <button key={l} onClick={() => { setLanguage(l as Language); localStorage.setItem('lang', l); }} className={`flex-1 py-4 rounded-xl text-[10px] font-black border transition-all ${language === l ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#020617] border-white/5 text-slate-700'}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {!isVip ? (
        <div className="bg-[#0b1121] p-10 rounded-[3rem] border border-white/5 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <h2 className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">ABONNEMENT PREMIUM</h2>
          </div>
          <input type="text" value={code} onChange={(e) => checkCode(e.target.value)} placeholder={S.enterCode} className="w-full bg-[#020617] border border-white/10 rounded-2xl py-5 text-center font-black text-white uppercase outline-none focus:border-orange-500/50" />
          <button onClick={() => window.open(PAYMENT_LINK, '_blank')} className="w-full bg-orange-500 text-slate-950 font-black py-5 rounded-2xl text-[11px] uppercase shadow-2xl shadow-orange-500/30">
            {S.buyVip}
          </button>
        </div>
      ) : (
        <div className="bg-emerald-500/10 p-10 rounded-[3rem] border border-emerald-500/20 text-center shadow-xl">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={32} className="text-slate-950" /></div>
          <span className="text-2xl font-black text-white italic block uppercase mb-2">{S.vipAccess}</span>
        </div>
      )}

      <button onClick={() => signOut(auth)} className="w-full bg-rose-500/5 p-6 rounded-[2rem] border border-rose-500/10 flex items-center justify-center gap-4">
        <LogOut size={22} className="text-rose-500" /><span className="text-xs font-black text-white uppercase italic">Déconnexion</span>
      </button>
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
      }).catch(() => setLoading(false));
    }
  }, [match, language, isVip, forcedLock]);

  if (!match) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-[#020617] pb-32">
      <nav className="p-5 sticky top-0 bg-[#020617]/90 backdrop-blur-2xl flex items-center justify-between border-b border-white/5 z-50">
        <button onClick={() => navigate(-1)} className="p-3 bg-slate-900 rounded-2xl"><ChevronLeft size={20} /></button>
        <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[200px]">{match.homeTeam} VS {match.awayTeam}</span>
        <div className="w-10" />
      </nav>

      <div className="p-6 space-y-8 max-w-2xl mx-auto">
        <div className="bg-[#0b1121] p-10 rounded-[3.5rem] border border-white/5 flex items-center justify-around shadow-2xl relative">
          <div className="text-center w-1/3">
             <img src={match.homeLogo} className="w-16 h-16 mx-auto mb-4 object-contain" alt="home" />
             <p className="text-[10px] font-black text-white uppercase truncate">{match.homeTeam}</p>
          </div>
          <div className="text-2xl font-black italic text-slate-800">VS</div>
          <div className="text-center w-1/3">
             <img src={match.awayLogo} className="w-16 h-16 mx-auto mb-4 object-contain" alt="away" />
             <p className="text-[10px] font-black text-white uppercase truncate">{match.awayTeam}</p>
          </div>
        </div>

        {forcedLock && !isVip ? (
          <div className="bg-[#0b1121] p-12 rounded-[3.5rem] border border-orange-500/20 text-center space-y-8 shadow-2xl">
            <Lock size={48} className="text-orange-500 mx-auto" />
            <h2 className="text-2xl font-black text-white uppercase italic">ANALYSE ÉLITE BLOQUÉE</h2>
            <button onClick={() => navigate('/settings')} className="w-full bg-orange-500 text-slate-950 font-black py-5 rounded-2xl text-xs uppercase shadow-2xl shadow-orange-500/30">DÉVERROUILLER VIP</button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center py-24 gap-6">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-[10px] font-black text-slate-700 uppercase italic tracking-[0.2em]">{S.loading}</p>
          </div>
        ) : data && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-5">
              {data.predictions.map((p: any, i: number) => (
                <div key={i} className="bg-[#0b1121] p-7 rounded-[2.5rem] border border-white/5 flex justify-between items-center shadow-xl">
                  <div>
                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-2">{p.type}</span>
                    <div className="text-2xl font-black text-white italic uppercase tracking-tighter">{p.recommendation}</div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-3xl font-black text-white tabular-nums">{p.probability}%</div>
                    <ConfidenceIndicator level={p.confidence as Confidence} />
                  </div>
                </div>
              ))}
            </div>

            {isVip && data.vipInsight && (
              <div className="bg-orange-500/5 p-8 rounded-[3rem] border border-orange-500/20 space-y-6">
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

            <div className="bg-[#0b1121]/50 p-10 rounded-[3.5rem] border-l-4 border-blue-500 border border-white/5 shadow-inner">
               <div className="flex items-center gap-3 mb-6">
                  <BrainCircuit size={20} className="text-blue-400" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{S.algoVerdict}</span>
               </div>
               <p className="text-[13px] text-slate-300 leading-relaxed font-bold italic tracking-tight uppercase">{data.analysis}</p>
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
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
      <BrainCircuit size={64} className="text-blue-400 animate-pulse" />
      <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em]">Chargement...</p>
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
          <Route path="/vip" element={<VipView matches={matches} loading={loading} language={language} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <nav className="fixed bottom-6 left-6 right-6 bg-[#0b1121]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-3 px-4 flex items-center justify-around z-50 shadow-2xl">
          <Link to="/" className="flex flex-col items-center gap-1.5 p-3 text-slate-600 hover:text-blue-400 transition-all">
            <LayoutGrid size={22} /><span className="text-[8px] font-black uppercase tracking-tight">Pronos</span>
          </Link>
          <Link to="/vip" className="flex flex-col items-center group relative p-3">
            <div className="bg-orange-500 p-2.5 rounded-full -mt-12 border-[5px] border-[#020617] shadow-2xl">
              <Crown size={22} className="text-slate-950" />
            </div>
            <span className="text-[8px] font-black text-orange-500 mt-1 uppercase italic">Élite VIP</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center gap-1.5 p-3 text-slate-600 hover:text-blue-400 transition-all">
            <Settings size={22} /><span className="text-[8px] font-black uppercase tracking-tight">Profil</span>
          </Link>
        </nav>
      </div>
    </HashRouter>
  );
};

export default App;
