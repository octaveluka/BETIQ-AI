
import { auth } from './services/firebase';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  HashRouter, 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  useNavigate, 
  Navigate 
} from 'react-router-dom';
import { 
  Crown, Lock, LayoutGrid, Settings, ChevronLeft, Search,
  Loader2, RefreshCw, Zap, BrainCircuit, Trophy, Target, 
  Globe, LogOut, ShieldCheck
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from "firebase/auth";

import { FootballMatch, Confidence, Language } from './types';
import { MatchCard } from './components/MatchCard';
import { VipSafeCard } from './components/VipSafeCard';
import { generatePredictionsAndAnalysis, AnalysisResult } from './services/geminiService';
import { fetchMatchesByDate } from './services/footballApiService';

const ADMIN_CODE = "20202020";
const PAYMENT_LINK = "https://bsbxsvng.mychariow.shop/prd_g3zdgh/checkout";

const VALID_CODES_ARRAY = [
  "BETIQ-5", "BETIQ-24", "BETIQ-55", "BETIQ-98", "BETIQ-153", "BETIQ-220", "BETIQ-299", "BETIQ-390", "BETIQ-493", "BETIQ-608", "BETIQ-735", "BETIQ-874", "BETIQ-1025", "BETIQ-1188", "BETIQ-1363", "BETIQ-1550", "BETIQ-1749", "BETIQ-1960", "BETIQ-2183", "BETIQ-2418", "BETIQ-2665", "BETIQ-2924", "BETIQ-3195", "BETIQ-3478", "BETIQ-3773", "BETIQ-4080", "BETIQ-4399", "BETIQ-4730", "BETIQ-5073", "BETIQ-5428", "BETIQ-5795", "BETIQ-6174", "BETIQ-6565", "BETIQ-6968", "BETIQ-7383", "BETIQ-7810", "BETIQ-8249", "BETIQ-8700", "BETIQ-9163", "BETIQ-9638", "BETIQ-10125", "BETIQ-10624", "BETIQ-11135", "BETIQ-11658", "BETIQ-12193", "BETIQ-12740", "BETIQ-13299", "BETIQ-13870", "BETIQ-14453", "BETIQ-15048", "BETIQ-15655", "BETIQ-16274", "BETIQ-16905", "BETIQ-17548", "BETIQ-18203", "BETIQ-18870", "BETIQ-19549", "BETIQ-20240", "BETIQ-20943", "BETIQ-21658", "BETIQ-22385", "BETIQ-23124", "BETIQ-23875", "BETIQ-24638", "BETIQ-25413", "BETIQ-26200", "BETIQ-26999", "BETIQ-27810", "BETIQ-28633", "BETIQ-29468", "BETIQ-30315", "BETIQ-31174", "BETIQ-32045", "BETIQ-32928", "BETIQ-33823", "BETIQ-34730", "BETIQ-35649", "BETIQ-36580", "BETIQ-37523", "BETIQ-38478", "BETIQ-39445", "BETIQ-40424", "BETIQ-41415", "BETIQ-42418", "BETIQ-43433", "BETIQ-44460", "BETIQ-45499", "BETIQ-46550", "BETIQ-47613", "BETIQ-48688", "BETIQ-49775", "BETIQ-50874", "BETIQ-51985", "BETIQ-53108", "BETIQ-54243", "BETIQ-55390", "BETIQ-56549", "BETIQ-57720", "BETIQ-58903", "BETIQ-60098", "BETIQ-61305", "BETIQ-62524", "BETIQ-63755", "BETIQ-64998", "BETIQ-66253", "BETIQ-67520", "BETIQ-68799", "BETIQ-70090", "BETIQ-71393", "BETIQ-72708", "BETIQ-74035", "BETIQ-75374", "BETIQ-76725", "BETIQ-78088", "BETIQ-79463", "BETIQ-80850", "BETIQ-82249", "BETIQ-83660", "BETIQ-85083", "BETIQ-86518", "BETIQ-87965", "BETIQ-89424", "BETIQ-90895", "BETIQ-92378", "BETIQ-93873", "BETIQ-95380", "BETIQ-96899", "BETIQ-98430", "BETIQ-99973", "BETIQ-101528", "BETIQ-103095", "BETIQ-104674", "BETIQ-106265", "BETIQ-107868", "BETIQ-109483", "BETIQ-111110", "BETIQ-112749", "BETIQ-114400", "BETIQ-116063", "BETIQ-117738", "BETIQ-119425", "BETIQ-121124", "BETIQ-122835", "BETIQ-124558", "BETIQ-126293", "BETIQ-128040", "BETIQ-129799", "BETIQ-131570", "BETIQ-133353", "BETIQ-135148", "BETIQ-136955", "BETIQ-138774", "BETIQ-140605", "BETIQ-142448", "BETIQ-144303", "BETIQ-146170", "BETIQ-148049", "BETIQ-149940", "BETIQ-151843", "BETIQ-153758", "BETIQ-155685", "BETIQ-157624", "BETIQ-159575", "BETIQ-138774", "BETIQ-26462098"
];

const VALID_USER_CODES = new Set(VALID_CODES_ARRAY);

const ELITE_TEAMS = ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Arsenal', 'Bayern Munich', 'PSG', 'Inter', 'AC Milan', 'Juventus', 'Dortmund', 'Chelsea', 'Atletico', 'Man Utd', 'Tottenham'];

const isPopularMatch = (match: FootballMatch) => {
  const eliteKeywords = ['Champions League', 'Europa League', 'Libertadores', 'CAN', 'Cup of Nations', 'World Cup', 'Euro', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];
  return ELITE_TEAMS.some(t => match.homeTeam.includes(t) || match.awayTeam.includes(t)) || 
         eliteKeywords.some(k => match.league.toLowerCase().includes(k.toLowerCase()));
};

const LeagueSelector: React.FC<{ selected: string, onSelect: (s: string) => void }> = ({ selected, onSelect }) => {
  const LEAGUE_BUTTONS = [
    { id: 'all', name: 'Tous', icon: <Globe size={12}/> },
    { id: 'ucl', name: 'Champions League', icon: <Trophy size={12}/> },
    { id: '152', name: 'Premier League', icon: <Target size={12}/> },
    { id: '302', name: 'La Liga', icon: <Target size={12}/> },
    { id: '207', name: 'Serie A', icon: <Target size={12}/> },
    { id: '175', name: 'Bundesliga', icon: <Target size={12}/> },
    { id: '168', name: 'Ligue 1', icon: <Target size={12}/> },
    { id: '28', name: 'CAN', icon: <Trophy size={12}/> },
    { id: 'copadelrey', name: 'Coupe du Roi', icon: <Trophy size={12}/> },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
      {LEAGUE_BUTTONS.map(cat => (
        <button key={cat.id} onClick={() => onSelect(cat.id)} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase border transition-all ${selected === cat.id ? 'bg-[#c18c32] border-[#c18c32] text-slate-950 shadow-lg' : 'bg-[#0b1121] border-white/5 text-slate-500'}`}>
          {cat.icon}{cat.name}
        </button>
      ))}
    </div>
  );
};

const filterMatches = (matches: FootballMatch[], leagueId: string) => {
  if (leagueId === 'all') return matches;
  const keywordMap: Record<string, string> = {
    ucl: 'champions league', copadelrey: 'coupe du roi'
  };
  const keyword = keywordMap[leagueId];
  if (keyword) return matches.filter(m => m.league.toLowerCase().includes(keyword));
  if (!isNaN(Number(leagueId))) return matches.filter(m => m.league_id === leagueId);
  return matches;
};

const FreePredictionsView: React.FC<any> = ({ matches, loading, language, isVip }) => {
  const navigate = useNavigate();
  // We take 3 low-tier matches for the free section
  const freeMatches = useMemo(() => {
    return matches.filter(m => !isPopularMatch(m)).slice(0, 3);
  }, [matches]);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10">
      <h2 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-3">
        <LayoutGrid className="text-blue-400" />
        PRÉDICTIONS <span className="text-blue-400">GRATUITES</span>
      </h2>
      <div className="space-y-4">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-400" /></div> : (
          freeMatches.map(m => (
            <MatchCard 
              key={m.id} 
              match={m} 
              isVipUser={true} // Free matches are always unlocked
              onClick={(match) => navigate(`/match/${match.id}`, { state: { match } })} 
            />
          ))
        )}
      </div>
    </div>
  );
};

const VipZoneView: React.FC<any> = ({ matches, loading, language, isVip, selectedDate, onDateChange }) => {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState('all');
  
  const dailySelections = useMemo(() => {
    // Top 3 most accurate matches for the day (Daily Winners Card)
    return matches.filter(isPopularMatch).slice(0, 3);
  }, [matches]);

  const allFilteredMatches = useMemo(() => {
    let list = filterMatches(matches, selectedLeague);
    // Popularity sorting
    return [...list].sort((a, b) => {
      const aPop = isPopularMatch(a) ? 1 : 0;
      const bPop = isPopularMatch(b) ? 1 : 0;
      return bPop - aPop;
    });
  }, [matches, selectedLeague]);

  const handleMatchClick = (m: FootballMatch, isSelection: boolean) => {
    if (!isVip) { navigate('/settings'); return; }
    navigate(`/match/${m.id}`, { state: { match: m, forceLock: true } });
  };

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Crown size={32} className="text-[#c18c32]" />
          <div>
            <h2 className="text-2xl font-black uppercase italic text-white">Zone <span className="text-[#c18c32]">ELITE VIP</span></h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Signaux 100% GAGNANTS</p>
          </div>
        </div>
      </header>

      <div className="mb-8 space-y-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
          <input type="text" placeholder="Chercher jours, ligues..." className="w-full bg-[#0b1121] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs text-white outline-none" />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[0,1,2,3,4,5,6,7].map(i => {
            const d = new Date(); d.setDate(d.getDate() + i);
            const iso = d.toISOString().split('T')[0];
            return (
              <button key={iso} onClick={() => onDateChange(iso)} className={`flex-shrink-0 min-w-[3.5rem] py-3 rounded-2xl border flex flex-col items-center gap-0.5 transition-all ${iso === selectedDate ? 'bg-[#c18c32] border-[#c18c32] text-slate-950' : 'bg-[#0b1121] border-white/5 text-slate-500'}`}>
                <span className="text-[7px] font-black uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                <span className="text-xs font-black">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        <section className="space-y-4">
          <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-4 rounded-2xl border-l-4 border-orange-500">
            <h3 className="text-xs font-black text-white uppercase italic">LES 3 SÉLECTIONS DU JOUR (TOP WINNERS)</h3>
          </div>
          <div className="space-y-4">
            {loading ? <Loader2 className="animate-spin text-orange-500 mx-auto" /> : dailySelections.map(m => (
              <VipSafeCard key={m.id} match={m} isLocked={!isVip} onClick={() => handleMatchClick(m, true)} />
            ))}
          </div>
        </section>

        <LeagueSelector selected={selectedLeague} onSelect={setSelectedLeague} />
      </div>

      <div className="space-y-4">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div> : (
          allFilteredMatches.map(m => (
            <MatchCard 
              key={m.id} 
              match={m} 
              isVipUser={isVip} 
              forceLock={isPopularMatch(m)} 
              onClick={(match) => {
                if (isPopularMatch(m) && !isVip) navigate('/settings');
                else navigate(`/match/${match.id}`, { state: { match } });
              }} 
            />
          ))
        )}
      </div>
    </div>
  );
};

const SettingsView: React.FC<any> = ({ isVip, setIsVip, userEmail }) => {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const activateVip = () => {
    if (VALID_USER_CODES.has(code) || code === ADMIN_CODE) {
      setIsVip(true);
      localStorage.setItem(`btq_vip_status_${userEmail}`, 'true');
      localStorage.setItem(`btq_vip_start_${userEmail}`, Date.now().toString());
      setMsg("VIP ACTIVÉ ! Redirection vers la zone gagnante...");
      setTimeout(() => navigate('/vip'), 1500);
    } else { setMsg("Code incorrect."); }
  };

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10">
      <h2 className="text-2xl font-black uppercase italic mb-8">Réglages</h2>
      <div className="space-y-6">
        <div className="bg-[#0b1121] p-6 rounded-[2rem] border border-orange-500/20">
          <h3 className="text-[10px] font-black text-orange-500 uppercase mb-4 flex items-center gap-2"><Crown size={12}/> STATUT VIP</h3>
          {!isVip ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Le VIP débloque les 3 sélections 100% gagnantes et toutes les analyses élites.</p>
              <a href={PAYMENT_LINK} target="_blank" rel="noreferrer" className="block text-center w-full bg-orange-500 text-slate-950 font-black py-4 rounded-xl text-xs uppercase">ACHETER ACCÈS VIP</a>
              <div className="flex gap-2">
                <input type="text" placeholder="Saisir code" value={code} onChange={e => setCode(e.target.value)} className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-4 text-xs outline-none" />
                <button onClick={activateVip} className="bg-white text-slate-950 px-6 py-4 rounded-xl font-black text-xs uppercase">OK</button>
              </div>
              {msg && <p className="text-[10px] font-bold text-center text-orange-500">{msg}</p>}
            </div>
          ) : <p className="text-xs text-emerald-500 font-bold uppercase italic">ABONNEMENT ELITE ACTIF</p>}
        </div>
        <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 text-rose-500 font-black uppercase text-xs p-6 bg-rose-500/5 rounded-[2rem] border border-rose-500/20"><LogOut size={16}/> Déconnexion</button>
      </div>
    </div>
  );
};

const MatchDetailView: React.FC<any> = ({ language }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const match = state?.match as FootballMatch;
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!match) { navigate('/'); return; }
    const getAnalysis = async () => {
      setLoading(true);
      const res = await generatePredictionsAndAnalysis(match, 'FR');
      setAnalysis(res);
      setLoading(false);
    };
    getAnalysis();
  }, [match, navigate]);

  if (!match) return null;

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
      <button onClick={() => navigate(-1)} className="p-3 bg-slate-900 rounded-2xl mb-6"><ChevronLeft size={20}/></button>
      <div className="bg-gradient-to-br from-[#0b1121] to-[#151c30] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <div className="text-center w-2/5"><img src={match.homeLogo} className="w-16 h-16 mx-auto object-contain mb-3" alt="home" /><p className="text-[10px] font-black uppercase text-white">{match.homeTeam}</p></div>
          <div className="text-xl font-black italic opacity-20 text-slate-600">VS</div>
          <div className="text-center w-2/5"><img src={match.awayLogo} className="w-16 h-16 mx-auto object-contain mb-3" alt="away" /><p className="text-[10px] font-black uppercase text-white">{match.awayTeam}</p></div>
        </div>
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-10"><Loader2 className="animate-spin text-orange-500" size={32} /><p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">ANALYSE TACTIQUE IA EN COURS...</p></div>
        ) : analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {analysis.predictions.map((p, i) => (
                <div key={i} className="bg-slate-950/60 p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">{p.type}</p><p className="text-sm font-black text-white">{p.recommendation}</p></div>
                  <div className="text-right"><p className="text-lg font-black text-blue-400">{p.probability}%</p></div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-500/5 p-6 rounded-2xl border border-blue-500/20">
              <h4 className="text-[10px] font-black text-blue-400 uppercase mb-3 flex items-center gap-2"><Target size={14}/> Analyse IA</h4>
              <p className="text-xs leading-relaxed text-slate-300 italic">{analysis.analysis}</p>
            </div>

            {analysis.vipInsight.detailedStats && (
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Statistiques de Signal</h4>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-bold">
                  <div className="flex justify-between"><span>Corners</span> <span className="text-orange-400">{analysis.vipInsight.detailedStats.corners}</span></div>
                  <div className="flex justify-between"><span>Cartons</span> <span className="text-orange-400">{analysis.vipInsight.detailedStats.yellowCards}</span></div>
                  <div className="flex justify-between"><span>Fautes</span> <span className="text-orange-400">{analysis.vipInsight.detailedStats.fouls}</span></div>
                  <div className="flex justify-between"><span>Tirs</span> <span className="text-orange-400">{analysis.vipInsight.detailedStats.shots}</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AuthView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 bg-[#0b1121] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="text-center">
          <BrainCircuit size={48} className="text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">BETI<span className="text-orange-500">Q</span></h2>
        </div>
        <div className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-sm outline-none" />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-sm outline-none" />
          {error && <p className="text-rose-500 text-[10px] font-bold uppercase">{error}</p>}
          <button onClick={handleAuth} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs">{isLogin ? 'Se connecter' : "S'inscrire"}</button>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-slate-500 text-[10px] font-bold uppercase tracking-widest">{isLogin ? "Inscription" : "Connexion"}</button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isVip, setIsVip] = useState<boolean>(false);
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email) {
        const status = localStorage.getItem(`btq_vip_status_${u.email}`) === 'true';
        if (status) {
          const startStr = localStorage.getItem(`btq_vip_start_${u.email}`);
          if (startStr && (Date.now() - parseInt(startStr) > 30 * 24 * 60 * 60 * 1000)) {
            setIsVip(false); localStorage.setItem(`btq_vip_status_${u.email}`, 'false');
          } else setIsVip(true);
        } else setIsVip(false);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchMatches = async (date: string) => {
    setLoading(true); try { 
      const data = await fetchMatchesByDate(date); 
      setMatches(data.map(m => ({ id: m.match_id, league: m.league_name, league_id: m.league_id, homeTeam: m.match_hometeam_name, awayTeam: m.match_awayteam_name, homeLogo: m.team_home_badge, awayLogo: m.team_away_badge, time: m.match_time, status: m.match_status, country_name: m.country_name, stats: { homeForm: [], awayForm: [], homeRank: 0, awayRank: 0, h2h: '' }, predictions: [] }))); 
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchMatches(selectedDate); }, [selectedDate, user]);

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-8"><BrainCircuit size={64} className="text-blue-400 animate-pulse" /></div>;
  if (!user) return <AuthView />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans">
      <Routes>
        <Route path="/" element={isVip ? <Navigate to="/vip" /> : <FreePredictionsView matches={matches} loading={loading} isVip={isVip} />} />
        <Route path="/vip" element={<VipZoneView matches={matches} loading={loading} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} />} />
        <Route path="/settings" element={<SettingsView isVip={isVip} setIsVip={setIsVip} userEmail={user.email} />} />
        <Route path="/match/:id" element={<MatchDetailView />} />
        <Route path="*" element={<Navigate to={isVip ? "/vip" : "/"} />} />
      </Routes>
      <nav className="fixed bottom-6 left-6 right-6 bg-[#0b1121]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-3 flex items-center justify-around z-50 shadow-2xl">
        {!isVip && (
          <Link to="/" className="flex flex-col items-center gap-1.5 p-3 text-slate-500 hover:text-blue-400 transition-colors">
            <LayoutGrid size={22} /><span className="text-[7px] font-black uppercase">GRATUIT</span>
          </Link>
        )}
        <Link to="/vip" className="flex flex-col items-center group relative px-4">
          <div className={`${isVip ? 'bg-[#c18c32] shadow-[#c18c32]/20' : 'bg-orange-500 shadow-orange-500/20'} p-3.5 rounded-full -mt-12 border-[6px] border-[#020617] shadow-xl transition-transform`}>
            {isVip ? <Crown size={26} className="text-slate-950" /> : <Lock size={24} className="text-slate-950" />}
          </div>
          <span className={`text-[8px] font-black mt-1.5 uppercase italic tracking-widest ${isVip ? 'text-[#c18c32]' : 'text-orange-500'}`}>VIP</span>
        </Link>
        <Link to="/settings" className="flex flex-col items-center gap-1.5 p-3 text-slate-500 hover:text-blue-400 transition-colors">
          <Settings size={22} /><span className="text-[7px] font-black uppercase">RÉGLAGES</span>
        </Link>
      </nav>
    </div>
  );
};

export default () => <HashRouter><App /></HashRouter>;
