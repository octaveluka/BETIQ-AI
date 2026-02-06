
import { auth } from './services/firebase';
import React, { useState, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Crown, Lock, LayoutGrid, Settings, ChevronLeft, Search,
  Loader2, BrainCircuit, Trophy, Target, 
  Globe, LogOut, ShieldCheck, Mail, Languages, ExternalLink,
  Info, BarChart3, CheckCircle2, XCircle, TrendingUp, Star,
  Menu, MessageSquare, Gift, Gamepad2, Banknote, ChevronRight,
  HelpCircle
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
    home: "Home",
    promo: "Code Promo",
    premium: "Premium",
    invest: "Invest",
    services: "Nos Services",
    freeCoupons: "Coupons Gratuits",
    vipCoupons: "Coupons VIP",
    fifaEport: "Fifa & E-sport",
    bigGains: "Les Gros Gains",
    freeAccount: "Compte gratuit",
    upgradeDesc: "Passez en Premium pour tout débloquer",
    profit: "Profiter",
    navigation: "Navigation",
    params: "Paramètres",
    accueil: "Accueil",
    guide: "Guide d'Utilisation",
    contactUs: "Nous contacter",
    changeLang: "Changer la Langue",
    statusFree: "Utilisateur Gratuit",
    statusVip: "Membre ELITE VIP",
    logout: "Déconnexion"
  },
  EN: {
    home: "Home",
    promo: "Promo Code",
    premium: "Premium",
    invest: "Invest",
    services: "Our Services",
    freeCoupons: "Free Coupons",
    vipCoupons: "VIP Coupons",
    fifaEport: "Fifa & E-sport",
    bigGains: "Big Gains",
    freeAccount: "Free Account",
    upgradeDesc: "Upgrade to Premium to unlock all",
    profit: "Enjoy",
    navigation: "Navigation",
    params: "Settings",
    accueil: "Home",
    guide: "User Guide",
    contactUs: "Contact us",
    changeLang: "Change Language",
    statusFree: "Free User",
    statusVip: "ELITE VIP Member",
    logout: "Log Out"
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
          <h2 className="text-2xl font-black text-white italic tracking-tighter">BETI<span className="text-orange-500">Q</span></h2>
          <div className="mt-4 px-6 py-2 bg-[#251b3a] rounded-full border border-white/5">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isVip ? t.statusVip : t.statusFree}</span>
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <p className="text-[10px] font-black text-orange-500 uppercase mb-4 tracking-[0.2em]">{t.navigation}</p>
            <div className="space-y-3">
              <SidebarItem icon={<div className="bg-orange-500 p-2 rounded-lg text-white"><LayoutGrid size={16}/></div>} title={t.accueil} desc="Retour à l'accueil" onClick={() => { navigate('/'); onClose(); }} />
              <SidebarItem icon={<div className="bg-orange-500 p-2 rounded-lg text-white"><Info size={16}/></div>} title={t.guide} desc="Apprenez à utiliser l'app" />
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

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
      {/* Banner Slider */}
      <div className="relative h-64 w-full rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl group">
        <img src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80" className="absolute inset-0 w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-700" alt="Soccer Analysis" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute bottom-10 left-8 right-8">
          <h3 className="text-2xl font-black text-white italic mb-2">Analyse Approfondie</h3>
          <p className="text-[11px] font-medium text-slate-200 leading-relaxed uppercase opacity-80">Bénéficiez d'une analyse détaillée par une équipe de parieurs professionnels</p>
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {[0,1,2,3,4].map(i => <div key={i} className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-orange-500 w-3' : 'bg-white/30'}`} />)}
        </div>
      </div>

      {/* Promo Bar */}
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

      {/* Services Grid (White Cards Style) */}
      <h2 className="text-2xl font-black text-white italic mb-8 tracking-tighter">{t.services}</h2>
      <div className="grid grid-cols-2 gap-6">
        <ServiceCard emoji="🎁" title={t.freeCoupons} color="blue" onClick={() => navigate('/coupons-free')} />
        <ServiceCard emoji="🏆" title={t.vipCoupons} color="gold" isLocked={!isVip} onClick={() => navigate('/vip')} />
        <ServiceCard emoji="🎮" title={t.fifaEport} color="green" isLocked={true} />
        <ServiceCard emoji="💰" title={t.bigGains} color="purple" isLocked={true} />
      </div>
    </div>
  );
};

const ServiceCard = ({ emoji, title, color, isLocked, onClick }: any) => (
  <div onClick={onClick} className="bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center gap-4 shadow-xl active:scale-95 transition-all cursor-pointer relative group text-[#0d0118]">
    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-inner ${
      color === 'blue' ? 'bg-blue-50' : color === 'gold' ? 'bg-orange-50' : color === 'green' ? 'bg-emerald-50' : 'bg-purple-50'
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
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const location = useLocation();
  const t = DICTIONARY[language];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setIsVip(localStorage.getItem(`btq_vip_status_${u.email}`) === 'true');
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchMatchesByDate(selectedDate).then(data => {
        setMatches(data.map(m => ({
          id: m.match_id, league: m.league_name, homeTeam: m.match_hometeam_name, awayTeam: m.match_awayteam_name,
          homeLogo: m.team_home_badge, awayLogo: m.team_away_badge, time: m.match_time, status: m.match_status,
          predictions: [], stats: { homeForm: [], awayForm: [], homeRank: 0, awayRank: 0, h2h: '' }
        })));
        setLoading(false);
      });
    }
  }, [selectedDate, user]);

  if (!user) return <AuthView lang={language} />;

  return (
    <div className="min-h-screen bg-[#0d0118] text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between border-b border-white/5 bg-[#0d0118]/80 backdrop-blur-xl sticky top-0 z-[60]">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-white active:scale-90 transition-transform"><Menu size={28}/></button>
        <h1 className="text-2xl font-black italic text-white tracking-tighter">BETI<span className="text-orange-500">Q</span></h1>
        <button className="p-2 text-orange-500 active:scale-90 transition-transform"><MessageSquare size={24} fill="currentColor" className="opacity-80"/></button>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} isVip={isVip} lang={language} setLanguage={setLanguage} />

      <Routes>
        <Route path="/" element={<HomeDashboard lang={language} isVip={isVip} />} />
        <Route path="/coupons-free" element={<FreePredictionsView matches={matches} loading={loading} lang={language} />} />
        <Route path="/vip" element={<VipZoneView matches={matches} loading={loading} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} lang={language} />} />
        <Route path="/premium" element={<SettingsView isVip={isVip} setIsVip={setIsVip} userEmail={user.email} language={language} />} />
        <Route path="/match/:id" element={<MatchDetailView language={language} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {/* Footer Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#110524]/95 backdrop-blur-2xl border-t border-white/10 py-4 px-8 flex items-center justify-between z-[70] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <NavLink to="/" icon={<LayoutGrid size={22}/>} label={t.home} active={location.pathname === '/' || location.pathname === '/coupons-free'} />
        <NavLink to="/code-promo" icon={<Gift size={22}/>} label={t.promo} active={location.pathname === '/code-promo'} />
        <NavLink to="/premium" icon={<Star size={22}/>} label={t.premium} active={location.pathname === '/premium' || location.pathname === '/vip'} />
        <NavLink to="/invest" icon={<Banknote size={22}/>} label={t.invest} active={location.pathname === '/invest'} />
      </nav>
    </div>
  );
};

const NavLink = ({ to, icon, label, active }: any) => (
  <Link to={to} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-orange-500' : 'text-slate-500 hover:text-white'}`}>
    <div className={`transition-all duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' : ''}`}>{icon}</div>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </Link>
);

// --- VIEW COMPONENTS ---

const FreePredictionsView: React.FC<any> = ({ matches, loading, lang }) => {
  const navigate = useNavigate();
  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6 animate-fade-in">
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

const VipZoneView: React.FC<any> = ({ matches, loading, isVip, selectedDate, onDateChange, lang }) => {
  const navigate = useNavigate();
  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6 animate-fade-in">
       <button onClick={() => navigate(-1)} className="mb-6 p-2 bg-[#1c122e] rounded-xl text-white"><ChevronLeft size={20}/></button>
       <h2 className="text-2xl font-black italic text-orange-500 mb-8">Zone Elite VIP</h2>
       <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
             {[0,1,2,3,4,5,6].map(i => {
                const d = new Date(); d.setDate(d.getDate() + i);
                const iso = d.toISOString().split('T')[0];
                return (
                  <button key={iso} onClick={() => onDateChange(iso)} className={`flex-shrink-0 min-w-[3.5rem] py-4 rounded-2xl border transition-all flex flex-col items-center ${iso === selectedDate ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-[#1c122e] border-white/5 text-slate-500'}`}>
                    <span className="text-[8px] font-black uppercase opacity-60 mb-1">{d.toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { weekday: 'short' })}</span>
                    <span className="text-xs font-black">{d.getDate()}</span>
                  </button>
                );
             })}
          </div>
          {loading ? <Loader2 className="animate-spin mx-auto text-orange-500"/> : (
             <div className="space-y-4">
                {matches.length > 0 ? matches.slice(0, 8).map((m: any) => (
                   <MatchCard key={m.id} match={m} isVipUser={isVip} forceLock={!isVip} lang={lang} onClick={(match: any) => isVip ? navigate(`/match/${match.id}`, { state: { match } }) : navigate('/premium')} />
                )) : <p className="text-center text-slate-500 text-xs py-10 font-black uppercase tracking-widest">Aucun match disponible</p>}
             </div>
          )}
       </div>
    </div>
  );
};

const SettingsView: React.FC<any> = ({ isVip, setIsVip, userEmail, language }) => {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10 animate-fade-in">
      <h2 className="text-3xl font-black italic mb-10 text-white">Premium</h2>
      <div className="bg-[#1c122e] p-8 rounded-[3rem] border border-orange-500/20 shadow-2xl space-y-8">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-orange-500/10 rounded-[1.5rem] text-orange-500 shadow-inner"><Crown size={40}/></div>
          <div>
            <h3 className="text-xl font-black text-white italic">ELITE VIP PASS</h3>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Accès illimité aux algorithmes</p>
          </div>
        </div>
        {!isVip ? (
          <div className="space-y-4">
            <a href={PAYMENT_LINK} target="_blank" rel="noreferrer" className="block text-center w-full bg-orange-500 text-white font-black py-5 rounded-[1.5rem] text-xs uppercase shadow-xl shadow-orange-500/10 active:scale-95 transition-all">Acheter un code d'accès</a>
            <div className="flex gap-2">
              <input type="text" placeholder="Entrez votre code" value={code} onChange={e => setCode(e.target.value)} className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm text-white font-bold outline-none focus:border-orange-500/50 transition-colors" />
              <button onClick={() => { if(VALID_USER_CODES.has(code) || code === ADMIN_CODE) { setIsVip(true); localStorage.setItem(`btq_vip_status_${userEmail}`, 'true'); } else setMsg('Invalide'); }} className="bg-white text-black px-6 py-4 rounded-2xl font-black text-xs uppercase">Vérifier</button>
            </div>
            {msg && <p className="text-rose-500 text-center font-black text-[10px] uppercase animate-pulse">{msg}</p>}
          </div>
        ) : <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-[1.5rem] text-emerald-500 font-black text-center text-xs uppercase tracking-widest flex items-center justify-center gap-3"><ShieldCheck size={18}/> Abonnement ELITE Actif</div>}
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
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="p-3 bg-[#110524] rounded-2xl mb-6 border border-white/5 text-white active:scale-90 transition-transform"><ChevronLeft size={20}/></button>
      <div className="bg-[#110524] rounded-[3rem] p-10 border border-white/5 shadow-2xl mb-8">
        <div className="flex justify-between items-center mb-12">
          <div className="text-center w-2/5 flex flex-col items-center gap-4">
             <div className="w-24 h-24 bg-black/30 rounded-full flex items-center justify-center p-5 border border-white/5 shadow-inner"><img src={match.homeLogo} className="max-w-full max-h-full object-contain" alt="" /></div>
             <p className="text-xs font-black uppercase text-white tracking-tight">{match.homeTeam}</p>
          </div>
          <div className="text-3xl font-black italic text-slate-800 opacity-30">VS</div>
          <div className="text-center w-2/5 flex flex-col items-center gap-4">
             <div className="w-24 h-24 bg-black/30 rounded-full flex items-center justify-center p-5 border border-white/5 shadow-inner"><img src={match.awayLogo} className="max-w-full max-h-full object-contain" alt="" /></div>
             <p className="text-xs font-black uppercase text-white tracking-tight">{match.awayTeam}</p>
          </div>
        </div>

        {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-500" size={32}/></div> : analysis && (
          <div className="space-y-6">
            {analysis.predictions.map((p, i) => (
              <div key={i} className="bg-black/40 p-6 rounded-[2rem] border border-white/5 flex justify-between items-center shadow-lg">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-[0.2em]">{p.type}</p>
                  <p className="text-sm font-black text-white uppercase italic">{p.recommendation}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-orange-500 italic drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]">{p.probability}%</p>
                  <ConfidenceIndicator level={p.confidence as Confidence} lang={language as Language} />
                </div>
              </div>
            ))}
            <div className="p-8 bg-orange-500/5 border border-orange-500/10 rounded-[2rem]">
              <h4 className="text-[10px] font-black text-orange-500 uppercase mb-4 tracking-widest flex items-center gap-2"><BrainCircuit size={14}/> Analyse IA Intelligente</h4>
              <p className="text-xs leading-relaxed text-slate-300 font-medium italic">"{analysis.analysis}"</p>
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
          <input type="email" placeholder="Adresse Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-[2rem] p-5 text-sm text-white outline-none focus:border-orange-500/50 transition-all" />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-[2rem] p-5 text-sm text-white outline-none focus:border-orange-500/50 transition-all" />
          <button onClick={handleAuth} className="w-full bg-orange-500 text-white font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all">{isLogin ? 'Connexion' : 'Inscription'}</button>
          <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black uppercase text-slate-500 mt-4 tracking-[0.2em] hover:text-white transition-colors">{isLogin ? 'Créer un nouveau compte' : 'J\'ai déjà un compte'}</button>
        </div>
      </div>
    </div>
  );
};

export default () => <HashRouter><App /></HashRouter>;
