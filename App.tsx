
import { auth } from './services/firebase';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Crown, Lock, LayoutGrid, Settings, ChevronLeft, Search,
  Loader2, BrainCircuit, Trophy, Target, 
  Globe, LogOut, ShieldCheck, Mail, Languages, ExternalLink,
  Info, BarChart3, CheckCircle2, XCircle, TrendingUp, Star,
  Menu, MessageSquare, Gift, Gamepad2, Banknote, ChevronRight,
  HelpCircle, RefreshCw, History, Calendar
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

const SLIDER_IMAGES = [
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
];

const DICTIONARY = {
  FR: {
    home: "Home",
    premium: "Premium",
    services: "Nos Services",
    freeCoupons: "Coupons Gratuits",
    vipCoupons: "Coupons VIP",
    freeAccount: "Compte gratuit",
    upgradeDesc: "Passez en Premium pour tout débloquer",
    profit: "Profiter",
    navigation: "Navigation",
    params: "Paramètres",
    accueil: "Accueil",
    guide: "Guide d'Utilisation",
    changeLang: "Changer la Langue",
    statusFree: "Utilisateur Gratuit",
    statusVip: "Membre ELITE VIP",
    logout: "Déconnexion",
    history: "Historique VIP",
    winnersOfDay: "Les 3 Gagnants du Jour"
  },
  EN: {
    home: "Home",
    premium: "Premium",
    services: "Our Services",
    freeCoupons: "Free Coupons",
    vipCoupons: "VIP Coupons",
    freeAccount: "Free Account",
    upgradeDesc: "Upgrade to Premium to unlock all",
    profit: "Enjoy",
    navigation: "Navigation",
    params: "Settings",
    accueil: "Home",
    guide: "User Guide",
    changeLang: "Change Language",
    statusFree: "Free User",
    statusVip: "ELITE VIP Member",
    logout: "Log Out",
    history: "VIP History",
    winnersOfDay: "Top 3 Winners Today"
  }
};

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void; user: FirebaseUser | null; isVip: boolean; lang: Language; setLanguage: (l: Language) => void }> = ({ isOpen, onClose, user, isVip, lang, setLanguage }) => {
  const t = DICTIONARY[lang];
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-4/5 max-w-[300px] bg-[#110524] h-full flex flex-col p-6 overflow-y-auto animate-slide-in shadow-2xl">
        <div className="flex flex-col items-center mb-10 pt-8">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-[6px] border-[#0d0118] shadow-2xl mb-4">
            <span className="text-4xl font-black text-white italic">Q</span>
          </div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">BETI<span className="text-orange-500">Q</span></h2>
          <div className="mt-4 px-6 py-2 bg-[#251b3a] rounded-full border border-white/5">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isVip ? t.statusVip : t.statusFree}</span>
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <p className="text-[10px] font-black text-orange-500 uppercase mb-4 tracking-[0.2em]">{t.navigation}</p>
            <div className="space-y-3">
              <SidebarItem icon={<div className="bg-orange-500 p-2 rounded-lg text-white"><LayoutGrid size={16}/></div>} title={t.accueil} desc="Retour à l'accueil" onClick={() => { navigate('/'); onClose(); }} />
              <SidebarItem icon={<div className="bg-orange-500 p-2 rounded-lg text-white"><History size={16}/></div>} title={t.history} desc="Derniers résultats" onClick={() => { navigate('/history'); onClose(); }} />
            </div>
          </section>

          <section>
            <p className="text-[10px] font-black text-orange-500 uppercase mb-4 tracking-[0.2em]">{t.params}</p>
            <div className="space-y-3">
              <SidebarItem icon={<div className="bg-blue-500 p-2 rounded-lg text-white"><Languages size={16}/></div>} title={t.changeLang} desc="Switch language" onClick={() => setLanguage(lang === 'FR' ? 'EN' : 'FR')} />
              <SidebarItem icon={<div className="bg-rose-500 p-2 rounded-lg text-white"><LogOut size={16}/></div>} title={t.logout} desc="Quitter l'application" onClick={() => signOut(auth)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, title, desc, onClick }: any) => (
  <button onClick={onClick} className="w-full bg-[#1c122e] border border-white/5 rounded-2xl p-4 flex items-center justify-between group active:scale-95 transition-all text-left">
    <div className="flex items-center gap-4">
      {icon}
      <div>
        <p className="text-xs font-black text-white">{title}</p>
        <p className="text-[9px] text-slate-500 font-bold">{desc}</p>
      </div>
    </div>
    <ChevronRight size={16} className="text-slate-700 group-hover:translate-x-1 transition-transform" />
  </button>
);

const HomeDashboard: React.FC<{ lang: Language; isVip: boolean }> = ({ lang, isVip }) => {
  const t = DICTIONARY[lang];
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
      <div className="relative h-64 w-full rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl group border border-white/5">
        {SLIDER_IMAGES.map((img, idx) => (
          <img 
            key={idx}
            src={img} 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-50' : 'opacity-0'}`} 
            alt="Soccer Analysis" 
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute bottom-10 left-8 right-8 z-10 text-center">
          <h3 className="text-2xl font-black text-white italic mb-2 tracking-tighter">BETI<span className="text-orange-500">Q</span> PREDICTIONS</h3>
          <p className="text-[10px] font-black text-slate-300 leading-relaxed uppercase opacity-80 tracking-widest">Intelligence Artificielle & Expertise Humaine</p>
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {SLIDER_IMAGES.map((_, i) => (
            <div key={i} className={`h-1.5 transition-all duration-300 rounded-full ${i === currentSlide ? 'bg-orange-500 w-6' : 'bg-white/30 w-1.5'}`} />
          ))}
        </div>
      </div>

      <div className="bg-[#1c1c1c] border border-white/5 p-4 rounded-3xl mb-10 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-xl"><Star className="text-orange-500" size={18} /></div>
          <div>
            <p className="text-xs font-black text-white">{t.freeAccount}</p>
            <p className="text-[9px] font-bold text-slate-500">{t.upgradeDesc}</p>
          </div>
        </div>
        <Link to="/premium" className="bg-orange-500 text-white font-black text-[11px] px-6 py-2.5 rounded-full uppercase tracking-tighter active:scale-95 transition-all shadow-lg shadow-orange-500/20">{t.profit}</Link>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ServiceCard emoji="🎁" title={t.freeCoupons} color="blue" onClick={() => navigate('/coupons-free')} />
        <ServiceCard emoji="🏆" title={t.vipCoupons} color="gold" isLocked={!isVip} onClick={() => navigate('/vip')} />
      </div>
      
      <button onClick={() => navigate('/history')} className="w-full mt-6 bg-[#1c122e] border border-white/5 p-5 rounded-[2rem] flex items-center justify-center gap-3 active:scale-95 transition-all group">
        <History size={18} className="text-orange-500 group-hover:rotate-12 transition-transform"/>
        <span className="text-xs font-black uppercase text-white tracking-widest">{t.history}</span>
      </button>
    </div>
  );
};

const ServiceCard = ({ emoji, title, color, isLocked, onClick }: any) => (
  <div onClick={onClick} className="bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center gap-4 shadow-xl active:scale-95 transition-all cursor-pointer relative group text-[#0d0118]">
    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-inner ${
      color === 'blue' ? 'bg-blue-50' : 'bg-orange-50'
    }`}>
      {emoji}
    </div>
    <span className="text-[11px] font-black uppercase tracking-tighter leading-tight">{title}</span>
    {isLocked && <div className="absolute top-4 right-4 bg-orange-500 p-1.5 rounded-full shadow-lg border-2 border-white"><Star size={10} className="text-white" fill="white" /></div>}
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'FR');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [dailyVip, setDailyVip] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const location = useLocation();
  const t = DICTIONARY[language];

  const refreshData = async () => {
    setLoading(true);
    const data = await fetchMatchesByDate(selectedDate);
    const mapped = data.map(m => ({
        id: m.match_id, league: m.league_name, homeTeam: m.match_hometeam_name, awayTeam: m.match_awayteam_name,
        homeLogo: m.team_home_badge, awayLogo: m.team_away_badge, time: m.match_time, status: m.match_status,
        predictions: [], stats: { homeForm: [], awayForm: [], homeRank: 0, awayRank: 0, h2h: '' }
    }));
    setMatches(mapped);
    
    // Sync avec le serveur pour les 3 VIP fixes
    const syncRes = await fetch('/api/vip-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, matches: mapped })
    });
    const syncData = await syncRes.json();
    setDailyVip(syncData.today);
    
    setLoading(false);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setIsVip(localStorage.getItem(`btq_vip_status_${u.email}`) === 'true');
    });
    return () => unsub();
  }, []);

  useEffect(() => { if (user) refreshData(); }, [selectedDate, user]);

  if (!user) return <AuthView lang={language} />;

  return (
    <div className="min-h-screen bg-[#0d0118] text-slate-100 font-sans">
      <header className="px-6 py-6 flex items-center justify-between border-b border-white/5 bg-[#0d0118]/80 backdrop-blur-xl sticky top-0 z-[60]">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-white"><Menu size={28}/></button>
        <h1 className="text-2xl font-black italic text-white tracking-tighter uppercase">BETI<span className="text-orange-500">Q</span></h1>
        <button className="p-2 text-orange-500"><MessageSquare size={24} fill="currentColor" className="opacity-80"/></button>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} isVip={isVip} lang={language} setLanguage={setLanguage} />

      <Routes>
        <Route path="/" element={<HomeDashboard lang={language} isVip={isVip} />} />
        <Route path="/coupons-free" element={<FreePredictionsView matches={matches} loading={loading} lang={language} />} />
        <Route path="/vip" element={<VipZoneView matches={dailyVip} loading={loading} isVip={isVip} lang={language} />} />
        <Route path="/history" element={<HistoryView lang={language} />} />
        <Route path="/premium" element={<SettingsView isVip={isVip} setIsVip={setIsVip} userEmail={user.email} language={language} />} />
        <Route path="/match/:id" element={<MatchDetailView language={language} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-[#110524]/95 backdrop-blur-2xl border-t border-white/10 py-4 px-8 flex items-center justify-around z-[70]">
        <NavLink to="/" icon={<LayoutGrid size={22}/>} label={t.home} active={location.pathname === '/'} />
        <NavLink to="/premium" icon={<Star size={22}/>} label={t.premium} active={location.pathname === '/premium'} />
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

const FreePredictionsView: React.FC<any> = ({ matches, loading, lang }) => {
  const navigate = useNavigate();
  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
       <button onClick={() => navigate(-1)} className="mb-6 p-2 bg-[#1c122e] rounded-xl text-white"><ChevronLeft size={20}/></button>
       <h2 className="text-2xl font-black italic text-white mb-8">Coupons Gratuits</h2>
       {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500"/></div> : (
          <div className="space-y-4">
             {matches.slice(0, 10).map((m: any) => <MatchCard key={m.id} match={m} isVipUser={false} lang={lang} onClick={(match: any) => navigate(`/match/${match.id}`, { state: { match } })} />)}
          </div>
       )}
    </div>
  );
};

const VipZoneView: React.FC<any> = ({ matches, loading, isVip, lang }) => {
  const navigate = useNavigate();
  const t = DICTIONARY[lang];
  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
       <button onClick={() => navigate(-1)} className="mb-6 p-2 bg-[#1c122e] rounded-xl text-white"><ChevronLeft size={20}/></button>
       <h2 className="text-2xl font-black italic text-orange-500 mb-8">{t.winnersOfDay}</h2>
       {loading ? <Loader2 className="animate-spin mx-auto text-orange-500"/> : (
          <div className="space-y-4">
             {matches.map((m: any) => (
                <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={!isVip} lang={lang} onClick={(match: any) => isVip ? navigate(`/match/${match.id}`, { state: { match } }) : navigate('/premium')} />
             ))}
          </div>
       )}
    </div>
  );
};

const HistoryView: React.FC<any> = ({ lang }) => {
  const [history, setHistory] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetch('/api/history').then(res => res.json()).then(data => { setHistory(data); setLoading(false); });
  }, []);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
      <button onClick={() => navigate(-1)} className="mb-6 p-2 bg-[#1c122e] rounded-xl text-white"><ChevronLeft size={20}/></button>
      <h2 className="text-2xl font-black italic text-white mb-8">Historique des Pronostics</h2>
      {loading ? <Loader2 className="animate-spin mx-auto text-orange-500"/> : (
        <div className="space-y-10">
          {Object.entries(history).map(([date, matches]: any) => (
            <div key={date}>
              <p className="text-[10px] font-black text-orange-500 uppercase mb-4 tracking-widest flex items-center gap-2"><Calendar size={14}/> {new Date(date).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <div className="space-y-4">
                {matches.map((m: any) => (
                  <MatchCard key={m.id} match={m} isVipUser={true} lang={lang} onClick={(match: any) => navigate(`/match/${match.id}`, { state: { match } })} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SettingsView: React.FC<any> = ({ isVip, setIsVip, userEmail, language }) => {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10">
      <h2 className="text-3xl font-black italic mb-10 text-white">Premium</h2>
      <div className="bg-[#1c122e] p-8 rounded-[3rem] border border-orange-500/20 shadow-2xl space-y-8 text-center">
        <div className="p-5 bg-orange-500/10 rounded-[1.5rem] text-orange-500 shadow-inner inline-block"><Crown size={40}/></div>
        <div>
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">ELITE VIP PASS</h3>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Accès aux 3 Gagnants du Jour</p>
        </div>
        {!isVip ? (
          <div className="space-y-4">
            <a href={PAYMENT_LINK} target="_blank" className="block w-full bg-orange-500 text-white font-black py-5 rounded-[1.5rem] text-xs uppercase shadow-xl shadow-orange-500/10 active:scale-95 transition-all">Acheter un code d'accès</a>
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Entrez votre code" value={code} onChange={e => setCode(e.target.value)} className="bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none focus:border-orange-500/50" />
              <button onClick={() => { if(VALID_USER_CODES.has(code) || code === ADMIN_CODE) { setIsVip(true); localStorage.setItem(`btq_vip_status_${userEmail}`, 'true'); } else setMsg('Invalide'); }} className="bg-white text-black py-4 rounded-2xl font-black text-xs uppercase active:scale-95 transition-transform">Vérifier</button>
            </div>
            {msg && <p className="text-rose-500 font-black text-[10px] uppercase">{msg}</p>}
          </div>
        ) : <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-[1.5rem] text-emerald-500 font-black text-xs uppercase flex items-center justify-center gap-3"><ShieldCheck size={18}/> Abonnement ELITE Actif</div>}
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
    if (!match) return;
    setLoading(true); generatePredictionsAndAnalysis(match, language).then(res => { setAnalysis(res); setLoading(false); });
  }, [match]);

  if (!match) return null;

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
      <button onClick={() => navigate(-1)} className="p-3 bg-[#110524] rounded-2xl mb-6 border border-white/5 text-white"><ChevronLeft size={20}/></button>
      <div className="bg-[#110524] rounded-[3rem] p-10 border border-white/5 shadow-2xl mb-8">
        <div className="flex justify-between items-center mb-12">
          <div className="text-center w-2/5 flex flex-col items-center gap-4">
             <div className="w-20 h-20 bg-black/30 rounded-full flex items-center justify-center p-4 border border-white/5"><img src={match.homeLogo} className="max-w-full max-h-full object-contain" /></div>
             <p className="text-[10px] font-black uppercase text-white tracking-tight">{match.homeTeam}</p>
          </div>
          <div className="text-2xl font-black italic text-slate-800 opacity-30">VS</div>
          <div className="text-center w-2/5 flex flex-col items-center gap-4">
             <div className="w-20 h-20 bg-black/30 rounded-full flex items-center justify-center p-4 border border-white/5"><img src={match.awayLogo} className="max-w-full max-h-full object-contain" /></div>
             <p className="text-[10px] font-black uppercase text-white tracking-tight">{match.awayTeam}</p>
          </div>
        </div>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-500" size={32}/></div> : analysis && (
          <div className="space-y-6">
            {analysis.predictions.map((p, i) => (
              <div key={i} className="bg-black/40 p-6 rounded-[2rem] border border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">{p.type}</p>
                  <p className="text-xs font-black text-white uppercase italic">{p.recommendation}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-orange-500 italic">{p.probability}%</p>
                  <ConfidenceIndicator level={p.confidence as Confidence} lang={language as Language} />
                </div>
              </div>
            ))}
            <div className="p-8 bg-orange-500/5 border border-orange-500/10 rounded-[2rem]">
              <h4 className="text-[9px] font-black text-orange-500 uppercase mb-3 tracking-widest flex items-center gap-2"><BrainCircuit size={14}/> ANALYSE IA GÉNÉRÉE</h4>
              <p className="text-[11px] leading-relaxed text-slate-300 font-medium italic">"{analysis.analysis}"</p>
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
      <div className="w-full max-w-md bg-[#110524] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-[6px] border-[#0d0118] shadow-2xl mx-auto mb-8">
          <span className="text-4xl font-black text-white italic">Q</span>
        </div>
        <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-10">BETI<span className="text-orange-500">Q</span></h2>
        <div className="space-y-5">
          <input type="email" placeholder="Adresse Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-[2rem] p-5 text-sm text-white outline-none" />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-[2rem] p-5 text-sm text-white outline-none" />
          <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20">{isLogin ? 'Connexion' : 'Inscription'}</button>
          <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black uppercase text-slate-500 mt-4 tracking-[0.2em]">{isLogin ? 'Créer un nouveau compte' : 'J\'ai déjà un compte'}</button>
        </div>
      </div>
    </div>
  );
};

export default () => <HashRouter><App /></HashRouter>;
