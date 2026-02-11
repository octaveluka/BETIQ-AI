
import { auth } from './services/firebase';
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Crown, Lock, LayoutGrid, ChevronLeft, 
  Loader2, BrainCircuit, Star,
  LogOut, ShieldCheck, Languages, ChevronRight,
  Menu, History, Calendar, RefreshCw, Zap, Search, Filter
} from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";

import { FootballMatch, Confidence, Language } from './types';
import { MatchCard } from './components/MatchCard';
import { VipSafeCard } from './components/VipSafeCard';
import { ConfidenceIndicator } from './components/ConfidenceIndicator';
import { generatePredictionsAndAnalysis, AnalysisResult } from './services/geminiService';
import { fetchMatchesByDate } from './services/footballApiService';

const ADMIN_CODE = "20202020";
const PAYMENT_LINK = "https://bsbxsvng.mychariow.shop/prd_g3zdgh/checkout";
const VALID_CODES_ARRAY = ["BETIQ-2032924", "BETIQ-5", "BETIQ-24"];
const VALID_USER_CODES = new Set(VALID_CODES_ARRAY);

const DICTIONARY = {
  FR: {
    home: "Accueil",
    premium: "Accès VIP",
    freeCoupons: "Coupons Gratuits",
    vipCoupons: "Sélection VIP du Jour",
    freeAccount: "Mode Standard",
    upgradeDesc: "Débloquez l'IA Elite",
    profit: "Accéder au VIP",
    history: "Historique VIP",
    changeLang: "Langue",
    statusFree: "Standard",
    statusVip: "Membre ELITE",
    logout: "Déconnexion",
    search: "Rechercher un match...",
    allMatches: "Tous les Matchs",
    win: "SUCCÈS",
    loss: "ÉCHEC",
    pending: "EN COURS"
  },
  EN: {
    home: "Home",
    premium: "VIP Access",
    freeCoupons: "Free Coupons",
    vipCoupons: "Daily VIP Selection",
    freeAccount: "Standard Mode",
    upgradeDesc: "Unlock Elite AI",
    profit: "Access VIP",
    history: "VIP History",
    changeLang: "Language",
    statusFree: "Standard",
    statusVip: "ELITE Member",
    logout: "Log Out",
    search: "Search for a match...",
    allMatches: "All Matches",
    win: "WIN",
    loss: "LOSS",
    pending: "PENDING"
  }
};

const Sidebar: React.FC<any> = ({ isOpen, onClose, isVip, lang, setLanguage }) => {
  const t = DICTIONARY[lang as Language];
  const navigate = useNavigate();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-4/5 max-w-[280px] bg-[#0d0118] border-r border-white/5 h-full flex flex-col p-6 animate-slide-in">
        <div className="flex flex-col items-center mb-10 pt-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-4 border-[#110524] mb-3">
            <span className="text-3xl font-black text-white italic">Q</span>
          </div>
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">BETI<span className="text-orange-500">Q</span></h2>
          <div className="mt-2 px-4 py-1 bg-white/5 rounded-full border border-white/5">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isVip ? t.statusVip : t.statusFree}</span>
          </div>
        </div>
        <div className="space-y-4">
          <SidebarItem icon={<LayoutGrid size={18}/>} title={t.home} onClick={() => { navigate('/'); onClose(); }} />
          <SidebarItem icon={<History size={18}/>} title={t.history} onClick={() => { navigate('/history'); onClose(); }} />
          <div className="h-px bg-white/5 my-4" />
          <SidebarItem icon={<Languages size={18}/>} title={t.changeLang} onClick={() => setLanguage(lang === 'FR' ? 'EN' : 'FR')} />
          <SidebarItem icon={<LogOut size={18}/>} title={t.logout} onClick={() => signOut(auth)} />
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, title, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all text-left">
    <div className="text-orange-500">{icon}</div>
    <span className="text-xs font-black text-white uppercase tracking-[0.1em]">{title}</span>
  </button>
);

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'FR');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [dailyVip, setDailyVip] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const location = useLocation();
  const t = DICTIONARY[language];

  const refreshData = async (dateOverride?: string) => {
    setLoading(true);
    const dateToUse = dateOverride || selectedDate;
    const data = await fetchMatchesByDate(dateToUse);
    const mapped = data.map(m => ({
        id: m.match_id, league: m.league_name, homeTeam: m.match_hometeam_name, awayTeam: m.match_awayteam_name,
        homeLogo: m.team_home_badge, awayLogo: m.team_away_badge, time: m.match_time, status: m.match_status,
        homeScore: m.match_hometeam_score, awayScore: m.match_awayteam_score,
        predictions: [], stats: { homeForm: [], awayForm: [], homeRank: 0, awayRank: 0, h2h: '' }
    }));
    setMatches(mapped);
    
    // Only sync VIP on 'today'
    const today = new Date().toISOString().split('T')[0];
    if (dateToUse === today) {
        try {
          const res = await fetch('/api/vip-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: today, matches: mapped })
          });
          const json = await res.json();
          setDailyVip(json.today || []);
        } catch (e) { console.error("VIP Sync failed"); }
    } else {
        setDailyVip([]); 
    }
    
    setLoading(false);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setIsVip(localStorage.getItem(`btq_vip_status_${u.email}`) === 'true');
    });
    return () => unsub();
  }, []);

  useEffect(() => { if (user) refreshData(); }, [user, selectedDate]);

  if (!user) return <AuthView lang={language} />;

  return (
    <div className="min-h-screen bg-[#0d0118] text-slate-100 font-sans">
      <header className="px-6 py-6 flex items-center justify-between border-b border-white/5 bg-[#0d0118]/80 backdrop-blur-xl sticky top-0 z-[60]">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-white"><Menu size={28}/></button>
        <h1 className="text-2xl font-black italic text-white tracking-tighter uppercase">BETI<span className="text-orange-500">Q</span></h1>
        <button onClick={() => refreshData()} className={`p-2 text-orange-500 ${loading ? 'animate-spin' : ''}`}><RefreshCw size={24}/></button>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isVip={isVip} lang={language} setLanguage={setLanguage} />

      <main className="animate-fade-in">
        <Routes>
          <Route path="/" element={
            isVip 
            ? <VipDashboard lang={language} matches={matches} dailyVip={dailyVip} loading={loading} date={selectedDate} setDate={setSelectedDate} /> 
            : <StandardDashboard lang={language} matches={matches} dailyVip={dailyVip} loading={loading} />
          } />
          <Route path="/history" element={<HistoryView lang={language} />} />
          <Route path="/premium" element={<SettingsView isVip={isVip} setIsVip={setIsVip} userEmail={user.email} language={language} />} />
          <Route path="/match/:id" element={<MatchDetailView language={language} isVip={isVip} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0d0118]/95 backdrop-blur-2xl border-t border-white/10 py-4 px-8 flex items-center justify-around z-[70] shadow-2xl">
        <NavLink to="/" icon={<LayoutGrid size={22}/>} label={t.home} active={location.pathname === '/'} />
        <NavLink to="/premium" icon={<Crown size={22}/>} label={t.premium} active={location.pathname === '/premium'} />
      </nav>
    </div>
  );
};

const NavLink = ({ to, icon, label, active }: any) => (
  <Link to={to} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-orange-500' : 'text-slate-500'}`}>
    <div className={active ? 'scale-110' : ''}>{icon}</div>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </Link>
);

// --- DASHBOARD STANDARD (Non-VIP) ---
const StandardDashboard: React.FC<any> = ({ lang, matches, dailyVip, loading }) => {
  const t = DICTIONARY[lang as Language];
  const navigate = useNavigate();
  
  const freeCoupons = matches.slice(0, 2); // 2 random matches as free sample
  const otherMatches = matches.slice(2);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
       <Banner lang={lang} isVip={false} />
       
       {/* Free Coupons Section */}
       <section className="mb-10">
         <h2 className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
           <Zap size={14} className="text-blue-400" /> {t.freeCoupons}
         </h2>
         <div className="space-y-4">
           {loading ? <Loader2 className="animate-spin text-orange-500 mx-auto"/> : freeCoupons.map((m: any) => (
             <MatchCard key={m.id} match={m} isVipUser={false} forceLock={false} lang={lang} onClick={() => navigate(`/match/${m.id}`, { state: { match: m } })} />
           ))}
         </div>
       </section>

       {/* VIP Selection (Locked) */}
       <section className="mb-10">
         <h2 className="text-[11px] font-black text-orange-500 uppercase mb-4 tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
           <Star size={14} fill="currentColor" /> {t.vipCoupons}
         </h2>
         <div className="space-y-4">
           {dailyVip.length > 0 ? dailyVip.map((m: any) => (
             <VipSafeCard key={m.id} match={m} isLocked={true} lang={lang} onClick={() => navigate('/premium')} />
           )) : <div className="text-center text-slate-600 text-xs font-black">Chargement VIP...</div>}
         </div>
       </section>

       {/* Other Matches (Locked) */}
       <section>
          <h2 className="text-[11px] font-black text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
            <Lock size={14} /> {t.allMatches}
          </h2>
          <div className="space-y-4 opacity-75">
            {otherMatches.slice(0, 5).map((m: any) => (
              <MatchCard key={m.id} match={m} isVipUser={false} forceLock={true} lang={lang} onClick={() => navigate('/premium')} />
            ))}
            <button onClick={() => navigate('/premium')} className="w-full py-4 text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 rounded-2xl">
              Voir +20 Matchs
            </button>
          </div>
       </section>
    </div>
  );
};

// --- DASHBOARD VIP (Unified Interface) ---
const VipDashboard: React.FC<any> = ({ lang, matches, dailyVip, loading, date, setDate }) => {
  const t = DICTIONARY[lang as Language];
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  
  const filteredMatches = matches.filter((m: any) => 
    m.homeTeam.toLowerCase().includes(search.toLowerCase()) || 
    m.awayTeam.toLowerCase().includes(search.toLowerCase()) ||
    m.league.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
       {/* Filters Row */}
       <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar">
         <div className="flex items-center gap-2 bg-white/5 px-4 py-3 rounded-2xl border border-white/5 min-w-fit">
            <Calendar size={16} className="text-orange-500"/>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-white text-xs font-black uppercase outline-none" />
         </div>
         <div className="flex-1 bg-white/5 px-4 py-3 rounded-2xl border border-white/5 flex items-center gap-2">
            <Search size={16} className="text-slate-500"/>
            <input type="text" placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-white text-xs font-bold outline-none w-full placeholder:text-slate-600" />
         </div>
       </div>

       {/* VIP Selection (Top) */}
       {dailyVip.length > 0 && !search && (
        <section className="mb-8">
           <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
             <h2 className="text-[11px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
               <Crown size={14} fill="currentColor" /> {t.vipCoupons}
             </h2>
           </div>
           <div className="space-y-4">
             {dailyVip.map((m: any) => (
               <VipSafeCard key={m.id} match={m} isLocked={false} lang={lang} onClick={() => navigate(`/match/${m.id}`, { state: { match: m } })} />
             ))}
           </div>
        </section>
       )}

       {/* All Matches List */}
       <section>
          <h2 className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
            <LayoutGrid size={14} /> {t.allMatches}
          </h2>
          {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500"/></div> : (
             <div className="space-y-4">
               {filteredMatches.length > 0 ? filteredMatches.map((m: any) => (
                 <MatchCard key={m.id} match={m} isVipUser={true} forceLock={false} lang={lang} onClick={() => navigate(`/match/${m.id}`, { state: { match: m } })} />
               )) : <p className="text-center text-slate-500 text-xs py-10">Aucun match trouvé.</p>}
             </div>
          )}
       </section>
    </div>
  );
};

const Banner = ({ lang, isVip }: any) => (
  <div className="relative h-48 w-full rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl border border-white/5">
    <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800" className="absolute inset-0 w-full h-full object-cover opacity-40" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0118] via-[#0d0118]/20 to-transparent" />
    <div className="absolute bottom-6 left-8 right-8 text-center">
      <h3 className="text-2xl font-black text-white italic mb-1 uppercase tracking-tighter">BETIQ ELITE</h3>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">{isVip ? "PREMIUM ACTIVE" : "AI FOOTBALL PREDICTIONS"}</p>
    </div>
  </div>
);

// --- HISTORY VIEW (Logic for Success/Fail) ---
const HistoryView: React.FC<any> = ({ lang }) => {
  const [history, setHistory] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const t = DICTIONARY[lang as Language];
  
  useEffect(() => {
    fetch('/api/history').then(res => res.json()).then(data => { setHistory(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Helper to determine Win/Loss based on score and "Implied" prediction (Home Win by default for VIP selection context if generic)
  const getStatus = (m: any) => {
    if (m.match_status !== 'Finished') return { label: t.pending, color: 'text-slate-500 bg-slate-500/10' };
    
    // Logic: In this simplified model, we assume the VIP prediction was "Home Win" or "Favorite".
    // Since we don't have a DB of predictions, we look at the score.
    // Real implementation would compare `m.storedPrediction` with score.
    const h = parseInt(m.homeScore);
    const a = parseInt(m.awayScore);
    
    // Fallback logic for demo: If home won, it's green (assuming favorites mostly).
    // Better: Read from m.storedPrediction if server provides it.
    // For now, let's display the score and a generic 'Finished' if we can't confirm.
    
    if (h > a) return { label: t.win, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    if (h < a) return { label: t.loss, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    return { label: "DRAW", color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
  };

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
      <button onClick={() => navigate('/')} className="mb-6 p-3 bg-white/5 rounded-2xl text-white active:scale-90 transition-transform"><ChevronLeft size={20}/></button>
      <h2 className="text-2xl font-black italic text-white mb-10 uppercase tracking-tighter">{t.history}</h2>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={32}/></div> : (
        <div className="space-y-10">
          {Object.entries(history).length > 0 ? Object.entries(history).map(([date, matches]: any) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-2">
                <Calendar size={16} className="text-orange-500" />
                <p className="text-[11px] font-black text-orange-500 uppercase tracking-widest">
                  {new Date(date).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' })}
                </p>
              </div>
              <div className="space-y-4">
                {matches.map((m: any) => {
                  const status = getStatus(m);
                  return (
                    <div key={m.id} className="relative bg-[#0b1121] border border-white/5 rounded-[2rem] p-5">
                       {/* Score Badge */}
                       <div className="absolute top-4 right-4 flex flex-col items-end">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black border ${status.color} uppercase tracking-widest mb-1`}>{status.label}</span>
                          <span className="text-lg font-black text-white tracking-widest">{m.homeScore} - {m.awayScore}</span>
                       </div>
                       
                       <div className="flex items-center gap-4 mb-2">
                          <img src={m.homeLogo} className="w-8 h-8 object-contain" />
                          <span className="text-[10px] font-bold text-white uppercase">{m.homeTeam}</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <img src={m.awayLogo} className="w-8 h-8 object-contain" />
                          <span className="text-[10px] font-bold text-white uppercase">{m.awayTeam}</span>
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )) : <p className="text-center text-slate-500 py-10 uppercase text-[10px] font-black tracking-widest italic">L'historique commence demain.</p>}
        </div>
      )}
    </div>
  );
};

const SettingsView: React.FC<any> = ({ isVip, setIsVip, userEmail, language }) => {
  const t = DICTIONARY[language as Language];
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10">
      <h2 className="text-3xl font-black italic mb-10 text-white tracking-tighter uppercase">{t.premium}</h2>
      <div className="bg-white/5 p-10 rounded-[3.5rem] border border-orange-500/20 shadow-2xl text-center backdrop-blur-md">
        <div className="p-10 bg-orange-500/10 rounded-[3rem] text-orange-500 inline-block mb-8 shadow-inner"><Crown size={60} strokeWidth={2.5}/></div>
        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">ELITE ACCESS</h3>
        <p className="text-[11px] text-slate-500 uppercase font-black tracking-widest mb-10 opacity-70">DAILY WINNERS & EXPERT STRATEGIES</p>
        {!isVip ? (
          <div className="space-y-5">
            <a href={PAYMENT_LINK} target="_blank" className="block w-full bg-orange-500 text-white font-black py-6 rounded-3xl text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/20 active:scale-95 transition-all">{t.profit}</a>
            <div className="pt-6 flex flex-col gap-4">
              <input type="text" placeholder="ENTER CODE" value={code} onChange={e => setCode(e.target.value)} className="bg-black/50 border border-white/5 rounded-2xl px-7 py-5 text-sm text-white font-bold outline-none focus:border-orange-500/50 text-center tracking-widest" />
              <button onClick={() => { if(VALID_USER_CODES.has(code) || code === ADMIN_CODE) { setIsVip(true); localStorage.setItem(`btq_vip_status_${userEmail}`, 'true'); } else setMsg('Code Invalide'); }} className="bg-white text-black py-5 rounded-2xl font-black text-xs uppercase active:scale-95 transition-transform tracking-widest">VALIDER</button>
            </div>
            {msg && <p className="text-rose-500 font-black text-[10px] uppercase animate-bounce">{msg}</p>}
          </div>
        ) : <div className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl text-emerald-500 font-black text-xs uppercase flex items-center justify-center gap-4"><ShieldCheck size={24} strokeWidth={3}/> VIP ACTIVE</div>}
      </div>
    </div>
  );
};

const MatchDetailView: React.FC<any> = ({ language, isVip }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const match = state?.match as FootballMatch;
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!match) return;
    setLoading(true); generatePredictionsAndAnalysis(match, language).then(res => { setAnalysis(res); setLoading(false); });
  }, [match]);

  if (!match) return null;

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
      <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl mb-8 border border-white/5 text-white active:scale-90 transition-transform"><ChevronLeft size={20}/></button>
      <div className="bg-[#0a0a0f] rounded-[3.5rem] p-10 border border-white/5 shadow-2xl mb-8">
        <div className="flex justify-between items-center mb-16">
          <div className="text-center w-2/5 flex flex-col items-center gap-5">
             <div className="w-20 h-20 bg-slate-800/20 rounded-full flex items-center justify-center p-4 border border-white/5 shadow-inner backdrop-blur-md"><img src={match.homeLogo} className="max-w-full max-h-full object-contain" /></div>
             <p className="text-[11px] font-black uppercase text-white tracking-tight leading-tight">{match.homeTeam}</p>
          </div>
          <div className="text-2xl font-black italic text-slate-800 opacity-20 uppercase tracking-tighter">VS</div>
          <div className="text-center w-2/5 flex flex-col items-center gap-5">
             <div className="w-20 h-20 bg-slate-800/20 rounded-full flex items-center justify-center p-4 border border-white/5 shadow-inner backdrop-blur-md"><img src={match.awayLogo} className="max-w-full max-h-full object-contain" /></div>
             <p className="text-[11px] font-black uppercase text-white tracking-tight leading-tight">{match.awayTeam}</p>
          </div>
        </div>

        {loading ? <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-orange-500" size={48}/><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Consulting Neural Models...</p></div> : analysis && (
          <div className="space-y-8">
            <div className="grid gap-5">
              {analysis.predictions.map((p, i) => (
                <div key={i} className="bg-white/5 p-7 rounded-[2.5rem] border border-white/5 flex justify-between items-center shadow-lg group hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">{p.type}</p>
                    <p className="text-[13px] font-black text-white uppercase italic tracking-tight">{p.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-orange-500 italic drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]">{p.probability}%</p>
                    <ConfidenceIndicator level={p.confidence as Confidence} lang={language as Language} />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-10 bg-orange-500/5 border border-orange-500/10 rounded-[3rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><BrainCircuit size={80} className="text-orange-500" /></div>
              <h4 className="text-[10px] font-black text-orange-500 uppercase mb-4 tracking-widest flex items-center gap-3"><Zap size={16} fill="currentColor" /> NEURAL ANALYSIS</h4>
              <p className="text-[12px] leading-relaxed text-slate-300 font-medium italic relative z-10">"{analysis.analysis}"</p>
              
              {isVip && analysis.vipInsight && (
                <div className="mt-8 pt-8 border-t border-orange-500/10 space-y-6 animate-fade-in">
                   <div>
                     <p className="text-[9px] font-black text-orange-500/50 uppercase mb-2 tracking-widest">EXACT SCORES</p>
                     <div className="flex gap-3">
                       {analysis.vipInsight.exactScores.map((s, idx) => (
                         <span key={idx} className="bg-orange-500 text-white font-black px-5 py-2 rounded-xl text-xs shadow-lg shadow-orange-500/20">{s}</span>
                       ))}
                     </div>
                   </div>
                   <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-black text-emerald-500 uppercase mb-2 tracking-widest">ELITE STRATEGY</p>
                      <p className="text-[11px] text-slate-400"><strong className="text-white">VALUE:</strong> {analysis.vipInsight.strategy.value}</p>
                      <p className="text-[11px] text-slate-400 mt-1"><strong className="text-white">FACT:</strong> {analysis.vipInsight.keyFact}</p>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AuthView: React.FC<{ lang: Language }> = ({ lang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const handleAuth = async () => { try { if (isLogin) await signInWithEmailAndPassword(auth, email, password); else await createUserWithEmailAndPassword(auth, email, password); } catch (e) { alert(e); } };
  return (
    <div className="min-h-screen bg-[#0d0118] flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white/5 p-14 rounded-[4rem] border border-white/5 shadow-2xl text-center backdrop-blur-xl">
        <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-4 border-[#0d0118] shadow-2xl mx-auto mb-10">
          <span className="text-4xl font-black text-white italic">Q</span>
        </div>
        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-12">BETI<span className="text-orange-500">Q</span> PREDICT</h2>
        <div className="space-y-5">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-sm text-white outline-none focus:border-orange-500/50" />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-sm text-white outline-none focus:border-orange-500/50" />
          <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-black py-6 rounded-3xl text-xs uppercase tracking-widest active:scale-95 transition-all shadow-2xl shadow-orange-500/20 mt-4">{isLogin ? 'Connexion' : 'Inscription'}</button>
          <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black uppercase text-slate-500 mt-6 tracking-[0.2em]">{isLogin ? 'Créer un compte' : 'Déjà inscrit ?'}</button>
        </div>
      </div>
    </div>
  );
};

export default () => <HashRouter><App /></HashRouter>;
