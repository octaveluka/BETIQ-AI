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
  Loader2, RefreshCw, Zap, BrainCircuit, CheckCircle2,
  LogOut, UserCircle, Target, Activity, AlertCircle, Goal, AlertTriangle,
  Share2, TrendingUp, Globe, Trophy
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
import { generatePredictionsAndAnalysis, AnalysisResult } from './services/geminiService';
import { fetchMatchesByDate } from './services/footballApiService';

const ADMIN_CODE = "20202020";
const PAYMENT_LINK = "https://bsbxsvng.mychariow.shop/prd_g3zdgh/checkout";

const VALID_CODES_ARRAY = [
  "BETIQ-5", "BETIQ-24", "BETIQ-55", "BETIQ-98", "BETIQ-153", "BETIQ-220", "BETIQ-299", "BETIQ-390", "BETIQ-493", "BETIQ-608", "BETIQ-735", "BETIQ-874", "BETIQ-1025", "BETIQ-1188", "BETIQ-1363", "BETIQ-1550", "BETIQ-1749", "BETIQ-1960", "BETIQ-2183", "BETIQ-2418", "BETIQ-2665", "BETIQ-2924", "BETIQ-3195", "BETIQ-3478", "BETIQ-3773", "BETIQ-4080", "BETIQ-4399", "BETIQ-4730", "BETIQ-5073", "BETIQ-5428", "BETIQ-5795", "BETIQ-6174", "BETIQ-6565", "BETIQ-6968", "BETIQ-7383", "BETIQ-7810", "BETIQ-8249", "BETIQ-8700", "BETIQ-9163", "BETIQ-9638", "BETIQ-10125", "BETIQ-10624", "BETIQ-11135", "BETIQ-11658", "BETIQ-12193", "BETIQ-12740", "BETIQ-13299", "BETIQ-13870", "BETIQ-14453", "BETIQ-15048", "BETIQ-15655", "BETIQ-16274", "BETIQ-16905", "BETIQ-17548", "BETIQ-18203", "BETIQ-18870", "BETIQ-19549", "BETIQ-20240", "BETIQ-20943", "BETIQ-21658", "BETIQ-22385", "BETIQ-23124", "BETIQ-23875", "BETIQ-24638", "BETIQ-25413", "BETIQ-26200", "BETIQ-26999", "BETIQ-27810", "BETIQ-28633", "BETIQ-29468", "BETIQ-30315", "BETIQ-31174", "BETIQ-32045", "BETIQ-32928", "BETIQ-33823", "BETIQ-34730", "BETIQ-35649", "BETIQ-36580", "BETIQ-37523", "BETIQ-38478", "BETIQ-39445", "BETIQ-40424", "BETIQ-41415", "BETIQ-42418", "BETIQ-43433", "BETIQ-44460", "BETIQ-45499", "BETIQ-46550", "BETIQ-47613", "BETIQ-48688", "BETIQ-49775", "BETIQ-50874", "BETIQ-51985", "BETIQ-53108", "BETIQ-54243", "BETIQ-55390", "BETIQ-56549", "BETIQ-57720", "BETIQ-58903", "BETIQ-60098", "BETIQ-61305", "BETIQ-62524", "BETIQ-63755", "BETIQ-64998", "BETIQ-66253", "BETIQ-67520", "BETIQ-68799", "BETIQ-70090", "BETIQ-71393", "BETIQ-72708", "BETIQ-74035", "BETIQ-75374", "BETIQ-76725", "BETIQ-78088", "BETIQ-79463", "BETIQ-80850", "BETIQ-82249", "BETIQ-83660", "BETIQ-85083", "BETIQ-86518", "BETIQ-87965", "BETIQ-89424", "BETIQ-90895", "BETIQ-92378", "BETIQ-93873", "BETIQ-95380", "BETIQ-96899", "BETIQ-98430", "BETIQ-99973", "BETIQ-101528", "BETIQ-103095", "BETIQ-104674", "BETIQ-106265", "BETIQ-107868", "BETIQ-109483", "BETIQ-111110", "BETIQ-112749", "BETIQ-114400", "BETIQ-116063", "BETIQ-117738", "BETIQ-119425", "BETIQ-121124", "BETIQ-122835", "BETIQ-124558", "BETIQ-126293", "BETIQ-128040", "BETIQ-129799", "BETIQ-131570", "BETIQ-133353", "BETIQ-135148", "BETIQ-136955", "BETIQ-138774", "BETIQ-140605", "BETIQ-142448", "BETIQ-144303", "BETIQ-146170", "BETIQ-148049", "BETIQ-149940", "BETIQ-151843", "BETIQ-153758", "BETIQ-155685", "BETIQ-157624", "BETIQ-159575", "BETIQ-138774", "BETIQ-26462098"
];

const VALID_USER_CODES = new Set(VALID_CODES_ARRAY);

const STRINGS: Record<Language, any> = {
  FR: {
    loading: "ANALYSE SIGNAL IA...",
    vipTitle: "PRONOSTICS ELITE",
    topVip: "CONFIANCE MAX",
    vipInsight: "SCORES EXACTS (VIP)",
    algoVerdict: "ANALYSE TACTIQUE IA",
    searchPlaceholder: "Chercher un match...",
    enterCode: "Code d'activation..."
  },
  EN: {
    loading: "AI SIGNAL PROCESSING...",
    vipTitle: "TOP ELITE PREDICTIONS",
    topVip: "MAX CONFIDENCE",
    vipInsight: "EXACT SCORES (VIP)",
    algoVerdict: "AI TACTICAL ANALYSIS",
    searchPlaceholder: "Search match...",
    enterCode: "Enter Code..."
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
        <button key={iso} onClick={() => onDateChange(iso)} className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] h-14 rounded-2xl border transition-all ${isSel ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#0b1121] border-white/5 text-slate-500'}`}>
          <span className="text-[7px] font-black uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
          <span className="text-sm font-black italic">{d.getDate()}</span>
        </button>
      );
    })}
  </div>
);

const LeagueSelector: React.FC<{ selected: string, onSelect: (s: string) => void }> = ({ selected, onSelect }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
    {[
      { id: 'all', name: 'Tous', icon: <Globe size={12}/> },
      { id: 'top5', name: 'Top 5', icon: <TrendingUp size={12}/> },
      { id: 'can', name: 'CAN / AFRIQUE', icon: <Trophy size={12}/> },
      { id: 'others', name: 'Autres', icon: <LayoutGrid size={12}/> }
    ].map(cat => (
      <button key={cat.id} onClick={() => onSelect(cat.id)} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase border transition-all ${selected === cat.id ? 'bg-[#c18c32] border-[#c18c32] text-slate-950 shadow-lg shadow-[#c18c32]/20' : 'bg-[#0b1121] border-white/5 text-slate-500'}`}>
        {cat.icon}{cat.name}
      </button>
    ))}
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
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) { setError('Erreur d\'authentification.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center"><BrainCircuit size={48} className="text-blue-400 mx-auto mb-4" /><h1 className="text-4xl font-black italic text-white uppercase">BETI<span className="text-orange-500">Q</span></h1></div>
      <div className="w-full max-w-sm bg-[#0b1121] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
        <div className="flex bg-[#020617] p-1 rounded-2xl mb-8 border border-white/5">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${isLogin ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>CONNEXION</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${!isLogin ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>S'INSCRIRE</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 px-5 text-xs text-white outline-none" />
          <input type="password" placeholder="Mot de passe" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 px-5 text-xs text-white outline-none" />
          {error && <div className="text-[10px] text-rose-500 font-black text-center">{error}</div>}
          <button disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl text-[11px] uppercase">{loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'ACCÉDER'}</button>
        </form>
      </div>
    </div>
  );
};

const PredictionsView: React.FC<any> = ({ matches, loading, language, isVip, selectedDate, onDateChange, onRefresh }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const S = STRINGS[language];
  const filtered = useMemo(() => matches.filter(m => m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase())), [matches, searchTerm]);
  const vipHome = useMemo(() => filtered.filter(isPopularMatch).slice(0, 2), [filtered]);
  const freeHome = useMemo(() => filtered.filter(m => !isPopularMatch(m)).slice(0, 3), [filtered]);

  const handleMatchClick = (m: FootballMatch, locked: boolean) => {
    if (locked && !isVip) {
      navigate('/settings');
      return;
    }
    navigate(`/match/${m.id}`, { state: { match: m, forceLock: locked } });
  };

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto">
      <header className="flex items-center justify-between py-8">
        <div className="flex items-center gap-3"><BrainCircuit size={28} className="text-blue-400" /><h1 className="text-3xl font-black italic text-white uppercase">BETI<span className="text-orange-500">Q</span></h1></div>
        <button onClick={onRefresh} className="p-3 bg-slate-900/50 rounded-2xl border border-white/5"><RefreshCw size={16} className={loading ? 'animate-spin text-orange-500' : 'text-slate-400'} /></button>
      </header>
      <div className="mb-8 space-y-4">
        <div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" /><input type="text" placeholder={S.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0b1121] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs text-white outline-none" /></div>
        <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />
      </div>
      <div className="space-y-10">
        <section className="space-y-4"><div className="flex items-center gap-2"><Crown size={14} className="text-orange-500" /><h3 className="text-[10px] font-black text-slate-500 uppercase italic">MATCHS ELITE VIP</h3></div>
          <div className="grid grid-cols-1 gap-4">{vipHome.map(m => (<MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={true} onClick={(m) => handleMatchClick(m, true)} />))}</div>
        </section>
        <section className="space-y-4"><div className="flex items-center gap-2"><Zap size={14} className="text-blue-400" /><h3 className="text-[10px] font-black text-slate-500 uppercase italic">ANALYSES GRATUITES</h3></div>
          <div className="grid grid-cols-1 gap-4">{freeHome.map(m => (<MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={false} onClick={(m) => handleMatchClick(m, false)} />))}</div>
        </section>
      </div>
    </div>
  );
};

const VipZoneView: React.FC<any> = ({ matches, loading, language, isVip, selectedDate, onDateChange }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeagueType, setSelectedLeagueType] = useState('all');
  const S = STRINGS[language];

  const filtered = useMemo(() => {
    let base = matches.filter(m => m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedLeagueType === 'top5') return base.filter(m => m.league_id && ['152', '302', '207', '175', '168'].includes(m.league_id));
    if (selectedLeagueType === 'can') return base.filter(m => m.league_id === '28' || m.league.toLowerCase().includes('africa cup') || m.league.toLowerCase().includes('can') || m.country_name === 'Africa');
    if (selectedLeagueType === 'others') return base.filter(m => m.league_id && !['152', '302', '207', '175', '168'].includes(m.league_id) && m.league_id !== '28');
    return base;
  }, [matches, searchTerm, selectedLeagueType]);

  const winners3 = useMemo(() => filtered.filter(isPopularMatch).slice(0, 3), [filtered]);
  const others = useMemo(() => filtered.filter(m => !winners3.some(t => t.id === m.id)), [filtered, winners3]);

  const handleMatchClick = (m: FootballMatch, locked: boolean) => {
    if (locked && !isVip) {
      navigate('/settings');
      return;
    }
    navigate(`/match/${m.id}`, { state: { match: m, forceLock: locked } });
  };

  return (
    <div className="p-5 pb-32 max-w-2xl mx-auto space-y-6">
      <header className="flex items-center justify-between pt-4"><div className="flex items-center gap-3"><div className={`p-2.5 rounded-2xl ${isVip ? 'bg-[#c18c32]' : 'bg-orange-500'} shadow-lg`}><Crown size={28} className="text-slate-950" /></div><div><h2 className="text-2xl font-black italic text-white uppercase">{isVip ? 'PRONOSTICS ELITE' : 'ACCÈS VIP'}</h2><p className="text-[8px] font-black text-slate-500 uppercase">IA FONDAMENTALE</p></div></div></header>
      <div className="space-y-4">
        <div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" /><input type="text" placeholder={S.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0b1121] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs text-white outline-none" /></div>
        <LeagueSelector selected={selectedLeagueType} onSelect={setSelectedLeagueType} />
        <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />
      </div>
      {loading ? (<div className="py-24 text-center"><Loader2 className="animate-spin text-orange-500 mx-auto" size={40} /></div>) : (
        <div className="space-y-12">
          <section className="space-y-5"><h3 className="text-[11px] font-black text-orange-500 uppercase italic">CONFIANCE MAX</h3><div className="space-y-4">{winners3.map(m => (<VipSafeCard key={m.id} match={m} isLocked={!isVip} onClick={() => handleMatchClick(m, true)} />))}</div></section>
          <section className="space-y-5"><h3 className="text-[11px] font-black text-slate-600 uppercase italic">LISTE COMPLÈTE</h3><div className="grid grid-cols-1 gap-5">{others.map(m => (<MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={true} onClick={(m) => handleMatchClick(m, true)} />))}</div></section>
        </div>
      )}
      {!isVip && (<div className="mt-8 bg-[#0b1121] border border-orange-500/20 p-10 rounded-[3rem] text-center space-y-6"><Lock size={40} className="text-orange-500 mx-auto" /><p className="text-xs font-bold text-slate-300 italic uppercase">Scores exacts, Corners et Buteurs Élite.</p><button onClick={() => navigate('/settings')} className="w-full bg-orange-500 text-slate-950 font-black py-5 rounded-2xl text-[11px] uppercase">PASSER VIP</button></div>)}
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
    setLoading(true); setData(null); setError(null);
    try {
      const res = await generatePredictionsAndAnalysis(m, language);
      setData(res);
    } catch (e) { setError("Erreur d'analyse."); } finally { setLoading(false); }
  };

  useEffect(() => { if (match) prepareAndAnalyze(match); }, [match, language]);
  if (!match) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-[#020617] pb-40">
      <nav className="p-6 sticky top-0 bg-[#020617]/90 backdrop-blur-2xl flex items-center justify-between z-50 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-3 bg-[#0b1121] rounded-2xl text-slate-400"><ChevronLeft size={22} /></button>
        <span className="text-[11px] font-black uppercase text-white italic truncate max-w-[200px]">{match.homeTeam} VS {match.awayTeam}</span>
        <button className="p-3 bg-[#0b1121] rounded-2xl text-slate-400"><Share2 size={20} /></button>
      </nav>
      <div className="px-6 py-8 space-y-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-2.5"><Activity size={14} className="text-blue-500" /><span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">SIGNAL IA</span></div>
        {loading ? (<div className="flex flex-col items-center py-24 gap-6"><Loader2 className="animate-spin text-blue-500" size={56} /><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{S.loading}</p></div>) : data && (
          <div className="space-y-8">
            <div className="space-y-4">
              {data.predictions.map((p, i) => (
                <div key={i} className="bg-[#0b1121] p-8 rounded-[2.5rem] flex justify-between items-center shadow-xl border border-white/5 overflow-hidden relative">
                  <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500"></div>
                  <div><span className="text-[11px] font-bold text-blue-400 uppercase block mb-1">{p.type}</span><div className="text-2xl font-black text-white italic uppercase tracking-tight">{p.recommendation}</div></div>
                  <div className="text-right"><div className="text-4xl font-black text-white">{p.probability}%</div><div className="flex items-center justify-end gap-1.5 mt-1"><div className={`w-2.5 h-2.5 rounded-full ${p.confidence === 'HIGH' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'}`}></div><span className="text-[10px] font-black text-slate-500 uppercase">{p.confidence === 'HIGH' ? 'ÉLEVÉ' : 'MOYEN'}</span></div></div>
                </div>
              ))}
            </div>

            {data.vipInsight.detailedStats && (
              <div className="bg-[#0b1121] p-8 rounded-[3rem] border border-white/5 space-y-6">
                <div className="flex items-center gap-3"><Activity size={18} className="text-blue-400" /><span className="text-[12px] font-black text-white uppercase italic">INDICATEURS DE JEU IA</span></div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'CORNERS', value: data.vipInsight.detailedStats.corners, icon: <Goal size={14}/> },
                    { label: 'CARTONS JAUNES', value: data.vipInsight.detailedStats.yellowCards, icon: <AlertTriangle size={14}/> },
                    { label: 'HORS-JEU', value: data.vipInsight.detailedStats.offsides, icon: <Activity size={14}/> },
                    { label: 'FAUTES', value: data.vipInsight.detailedStats.fouls, icon: <Activity size={14}/> },
                    { label: 'TIRS TOTAUX', value: data.vipInsight.detailedStats.shots, icon: <Activity size={14}/> },
                    { label: 'TIRS CADRÉS', value: data.vipInsight.detailedStats.shotsOnTarget, icon: <Target size={14}/> }
                  ].map((stat, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2.5"><span className="text-blue-400 opacity-50">{stat.icon}</span><span className="text-[10px] font-bold text-slate-500 uppercase">{stat.label}</span></div>
                      <span className="text-xs font-black text-white italic">{stat.value}</span>
                    </div>
                  ))}
                </div>
                {data.vipInsight.detailedStats.scorers && data.vipInsight.detailedStats.scorers.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2.5 mb-4"><Zap size={14} className="text-orange-400" /><span className="text-[10px] font-bold text-slate-500 uppercase">PROBABILITÉS BUTEURS</span></div>
                    <div className="flex flex-wrap gap-3">
                      {data.vipInsight.detailedStats.scorers.map((s, i) => (
                        <div key={i} className="bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                          <span className="text-[11px] font-black text-white italic uppercase">{s.name}</span>
                          <span className="text-[11px] font-black text-orange-500">{s.probability}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#0b1121]/40 p-8 rounded-[3rem] border border-white/5 space-y-6">
              <div className="flex items-center gap-3"><Target size={16} className="text-[#c18c32]" /><span className="text-[11px] font-black text-slate-400 uppercase italic">{S.vipInsight}</span></div>
              <div className="grid grid-cols-2 gap-4">{data.vipInsight.exactScores.map((s, idx) => (<div key={idx} className="bg-[#151c30] text-white p-7 rounded-[2rem] text-center text-4xl font-black italic shadow-inner">{s}</div>))}</div>
            </div>
            <div className="bg-[#0b1121] p-10 rounded-[3.5rem] border-l-8 border-blue-500 shadow-2xl relative"><span className="text-[10px] font-black uppercase text-slate-500 block mb-4 italic">{S.algoVerdict}</span><p className="text-[15px] text-slate-200 leading-relaxed font-bold italic uppercase">{data.analysis}</p></div>
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
    const trimmed = val.trim().toUpperCase(); setCode(trimmed);
    if (trimmed === ADMIN_CODE || VALID_USER_CODES.has(trimmed)) {
      setIsVip(true); if (userEmail) { localStorage.setItem(`btq_vip_status_${userEmail}`, 'true'); if (trimmed !== ADMIN_CODE) localStorage.setItem(`btq_vip_start_${userEmail}`, Date.now().toString()); }
    }
  };

  return (
    <div className="p-6 pb-40 space-y-6 max-w-xl mx-auto">
      <div className="bg-[#0b1121] p-8 rounded-[2.5rem] border border-white/5"><div className="flex items-center gap-4 mb-8"><UserCircle size={32} className="text-blue-400" /><div><p className="text-sm font-bold text-white truncate">{userEmail}</p></div></div>
        <div className="space-y-4"><h2 className="text-[9px] font-black uppercase text-slate-600">Langue</h2><div className="flex gap-4">{['FR', 'EN'].map(l => (<button key={l} onClick={() => { setLanguage(l as Language); localStorage.setItem('lang', l); }} className={`flex-1 py-4 rounded-xl text-[10px] font-black border transition-all ${language === l ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#020617] border-white/5 text-slate-700'}`}>{l}</button>))}</div></div>
      </div>
      {!isVip ? (<div className="bg-[#0b1121] p-10 rounded-[3rem] border border-white/5 space-y-8 text-center relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div><Crown size={48} className="text-orange-500 mx-auto" /><input type="text" value={code} onChange={(e) => checkCode(e.target.value)} placeholder={S.enterCode} className="w-full bg-[#020617] border border-white/10 rounded-2xl py-5 text-center font-black text-white uppercase outline-none" /><button onClick={() => window.open(PAYMENT_LINK, '_blank')} className="w-full bg-orange-500 text-slate-950 font-black py-5 rounded-2xl text-[11px] uppercase">ACTIVER MON PASS VIP (30J)</button></div>) 
      : (<div className="bg-[#c18c32]/5 p-12 rounded-[3.5rem] border border-[#c18c32]/20 text-center shadow-2xl"><CheckCircle2 size={48} className="text-[#c18c32] mx-auto mb-4" /><span className="text-3xl font-black text-white italic block uppercase">PASS VIP ACTIF</span></div>)}
      <button onClick={() => signOut(auth)} className="w-full bg-rose-500/5 p-7 rounded-[2.5rem] border border-rose-500/10 flex items-center justify-center gap-4 text-rose-500 uppercase font-black text-xs italic"><LogOut size={22} />Déconnexion</button>
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
        const status = localStorage.getItem(`btq_vip_status_${u.email}`) === 'true';
        if (status) {
          const startStr = localStorage.getItem(`btq_vip_start_${u.email}`);
          if (startStr && (Date.now() - parseInt(startStr) > 30 * 24 * 60 * 60 * 1000)) {
            setIsVip(false); localStorage.setItem(`btq_vip_status_${u.email}`, 'false');
          } else setIsVip(true);
        } else setIsVip(false);
      } else setIsVip(false);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchMatches = async (date: string) => {
    setLoading(true); try { const data = await fetchMatchesByDate(date); setMatches(data.map(m => ({ id: m.match_id, league: m.league_name, league_id: m.league_id, homeTeam: m.match_hometeam_name, awayTeam: m.match_awayteam_name, homeLogo: m.team_home_badge, awayLogo: m.team_away_badge, time: m.match_time, status: m.match_status, country_name: m.country_name, stats: { homeForm: [], awayForm: [], homeRank: 0, awayRank: 0, h2h: '' }, predictions: [] }))); } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchMatches(selectedDate); }, [selectedDate, user]);

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-8"><BrainCircuit size={64} className="text-blue-400 animate-pulse" /></div>;
  if (!user) return <AuthView />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans">
      <Routes>
        <Route path="/" element={<PredictionsView matches={matches} loading={loading} language={language} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} onRefresh={() => fetchMatches(selectedDate)} />} />
        <Route path="/settings" element={<SettingsView language={language} setLanguage={setLanguage} isVip={isVip} setIsVip={setIsVip} userEmail={user.email} />} />
        <Route path="/match/:id" element={<MatchDetailView language={language} isVip={isVip} />} />
        <Route path="/vip" element={<VipZoneView matches={matches} loading={loading} language={language} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <nav className="fixed bottom-6 left-6 right-6 bg-[#0b1121]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-3 flex items-center justify-around z-50 shadow-2xl">
        {/* Standard User sees DIRECT, VIP User ONLY sees VIP & SETTINGS */}
        {!isVip && (
          <Link to="/" className="flex flex-col items-center gap-1.5 p-3 text-slate-500 hover:text-blue-400"><LayoutGrid size={22} /><span className="text-[8px] font-black uppercase">DIRECT</span></Link>
        )}
        
        <Link to="/vip" className="flex flex-col items-center group relative px-4">
          <div className={`${isVip ? 'bg-[#c18c32] shadow-[#c18c32]/20' : 'bg-orange-500 shadow-orange-500/20'} p-3.5 rounded-full -mt-12 border-[6px] border-[#020617] shadow-xl group-active:scale-90 transition-transform`}>
            {isVip ? <Crown size={26} className="text-slate-950" /> : <Lock size={24} className="text-slate-950" />}
          </div>
          <span className={`text-[9px] font-black mt-1.5 uppercase italic tracking-widest ${isVip ? 'text-[#c18c32]' : 'text-orange-500'}`}>VIP</span>
        </Link>
        
        <Link to="/settings" className="flex flex-col items-center gap-1.5 p-3 text-slate-500 hover:text-blue-400"><Settings size={22} /><span className="text-[8px] font-black uppercase">RÉGLAGES</span></Link>
      </nav>
    </div>
  );
};

export default () => <HashRouter><App /></HashRouter>;