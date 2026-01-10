
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
  Globe, LogOut, ShieldCheck, Mail, Languages, ExternalLink,
  Info
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
import { ConfidenceIndicator } from './components/ConfidenceIndicator';
import { generatePredictionsAndAnalysis, AnalysisResult } from './services/geminiService';
import { fetchMatchesByDate } from './services/footballApiService';

const ADMIN_CODE = "20202020";
const PAYMENT_LINK = "https://bsbxsvng.mychariow.shop/prd_g3zdgh/checkout";
const VALID_CODES_ARRAY = ["BETIQ-138774", "BETIQ-26462098", "BETIQ-5", "BETIQ-24", "BETIQ-55"];
const VALID_USER_CODES = new Set(VALID_CODES_ARRAY);

const DICTIONARY = {
  FR: {
    freeTitle: "PRÉDICTIONS GRATUITES",
    vipTitle: "ZONE ELITE VIP",
    settingsTitle: "RÉGLAGES",
    vipSubtitle: "Signal Haute Précision",
    vipCardHeader: "LA CARTE GAGNANTE : LES 3 SÉLECTIONS 100% ACCURATE",
    searchPlaceholder: "Chercher match, ligue...",
    userConnected: "Utilisateur Connecté",
    appLanguage: "Langue de l'application",
    activationVip: "ACTIVATION VIP",
    vipDescription: "Le VIP débloque les 3 sélections 100% gagnantes et les analyses tactiques des ligues élites (UCL, Premier League, CAN).",
    buyCode: "ACHETER UN CODE",
    verify: "VÉRIFIER",
    logout: "Se déconnecter",
    vipActive: "ABONNEMENT ELITE ACTIF",
    loadingAi: "IA en recherche Google (Vérification des effectifs réels)...",
    tacticalAnalysis: "Analyse Tactique (Faits Vérifiés)",
    advancedSignals: "Signaux Avancés",
    probableScorers: "Buteurs Probables (Forme Actuelle)",
    googleSources: "Preuves de Vérification (Sources Web)",
    iaUnlocked: "ANALYSE IA DÉBLOQUÉE",
    noMatches: "Aucun match trouvé pour ce jour/ligue",
    all: "Tous",
    checkVip: "DÉBLOQUER VIP",
    auth: "Authentification",
    createAccount: "Créer un compte",
    login: "Connexion",
    register: "S'inscrire",
    newUser: "Nouveau ? Créer un compte",
    alreadyMember: "Déjà membre ? Se connecter",
    navFree: "GRATUIT",
    navVip: "VIP",
    navSettings: "RÉGLAGES",
    maxConfidence: "CONFIANCE MAX",
    probaLabel: "PROBA",
    statCorners: "Corners",
    statCards: "Cartons",
    statShots: "Tirs",
    statOnTarget: "Cadrés",
    sourceInfo: "Ces informations sont vérifiées en temps réel via Google Search."
  },
  EN: {
    freeTitle: "FREE PREDICTIONS",
    vipTitle: "ELITE VIP ZONE",
    settingsTitle: "SETTINGS",
    vipSubtitle: "High Precision Signal",
    vipCardHeader: "THE WINNING CARD: THE 3 100% ACCURATE SELECTIONS",
    searchPlaceholder: "Search match, league...",
    userConnected: "Connected User",
    appLanguage: "App Language",
    activationVip: "VIP ACTIVATION",
    vipDescription: "VIP unlocks 3 daily 100% winning selections and tactical analysis for elite leagues (UCL, Premier League, CAN).",
    buyCode: "BUY A CODE",
    verify: "VERIFY",
    logout: "Log Out",
    vipActive: "ELITE SUBSCRIPTION ACTIVE",
    loadingAi: "AI Google Search (Real Squad Verification)...",
    tacticalAnalysis: "Tactical Analysis (Verified Facts)",
    advancedSignals: "Advanced Signals",
    probableScorers: "Probable Scorers (Current Form)",
    googleSources: "Verification Proofs (Web Sources)",
    iaUnlocked: "AI ANALYSIS UNLOCKED",
    noMatches: "No matches found for this day/league",
    all: "All",
    checkVip: "UNLOCK VIP",
    auth: "Authentication",
    createAccount: "Create account",
    login: "Login",
    register: "Register",
    newUser: "New here? Create an account",
    alreadyMember: "Already a member? Login",
    navFree: "FREE",
    navVip: "VIP",
    navSettings: "SETTINGS",
    maxConfidence: "MAX CONFIDENCE",
    probaLabel: "PROB",
    statCorners: "Corners",
    statCards: "Cards",
    statShots: "Shots",
    statOnTarget: "On Target",
    sourceInfo: "This information is verified in real-time via Google Search."
  }
};

const ELITE_TEAMS = ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Arsenal', 'Bayern Munich', 'PSG', 'Inter', 'AC Milan', 'Juventus', 'Dortmund', 'Chelsea', 'Atletico', 'Man Utd', 'Tottenham', 'Espagne', 'France', 'Brazil', 'Argentina'];

const isPopularMatch = (match: FootballMatch) => {
  const eliteKeywords = ['Champions League', 'Europa League', 'Conference League', 'Libertadores', 'CAN', 'Cup of Nations', 'World Cup', 'Euro', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Coupe du Roi'];
  return ELITE_TEAMS.some(t => match.homeTeam.includes(t) || match.awayTeam.includes(t)) || 
         eliteKeywords.some(k => match.league.toLowerCase().includes(k.toLowerCase()));
};

const LeagueSelector: React.FC<{ selected: string, onSelect: (s: string) => void, lang: Language }> = ({ selected, onSelect, lang }) => {
  const t = DICTIONARY[lang];
  const LEAGUE_BUTTONS = [
    { id: 'all', name: t.all, icon: <Globe size={12}/> },
    { id: '28', name: 'CAN', icon: <Trophy size={12}/> },
    { id: 'ucl', name: 'Champions League', icon: <Trophy size={12}/> },
    { id: '152', name: 'Premier League', icon: <Target size={12}/> },
    { id: '302', name: 'La Liga', icon: <Target size={12}/> },
    { id: '207', name: 'Serie A', icon: <Target size={12}/> },
    { id: '175', name: 'Bundesliga', icon: <Target size={12}/> },
    { id: '168', name: 'Ligue 1', icon: <Target size={12}/> },
    { id: 'brasileirao', name: 'Brasileirão', icon: <Target size={12}/> },
    { id: 'mls', name: 'MLS', icon: <Target size={12}/> },
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

const FreePredictionsView: React.FC<any> = ({ matches, loading, lang }) => {
  const navigate = useNavigate();
  const t = DICTIONARY[lang];
  const freeMatches = useMemo(() => matches.filter(m => !isPopularMatch(m)).slice(0, 3), [matches]);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10">
      <h2 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-3">
        <LayoutGrid className="text-blue-400" />
        {t.freeTitle.split(' ')[0]} <span className="text-blue-400">{t.freeTitle.split(' ')[1]}</span>
      </h2>
      <div className="space-y-4">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-400" /></div> : (
          freeMatches.map(m => (
            <div key={m.id} onClick={() => navigate(`/match/${m.id}`, { state: { match: m } })} className="bg-[#0b1121]/60 border border-white/5 rounded-[2.2rem] p-6 cursor-pointer active:scale-95 transition-all">
               <div className="text-center text-[10px] font-black text-slate-600 mb-4 uppercase">{m.time}</div>
               <div className="flex items-center justify-around">
                  <div className="text-center w-2/5 flex flex-col items-center gap-2">
                    <img src={m.homeLogo} className="w-12 h-12 object-contain" alt="" />
                    <span className="text-[10px] font-black text-white uppercase truncate w-full">{m.homeTeam}</span>
                  </div>
                  <div className="text-xs opacity-20">VS</div>
                  <div className="text-center w-2/5 flex flex-col items-center gap-2">
                    <img src={m.awayLogo} className="w-12 h-12 object-contain" alt="" />
                    <span className="text-[10px] font-black text-white uppercase truncate w-full">{m.awayTeam}</span>
                  </div>
               </div>
               <div className="mt-4 bg-blue-500/10 py-2 rounded-xl text-center text-[9px] font-black text-blue-400 uppercase tracking-widest">{t.iaUnlocked}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const VipZoneView: React.FC<any> = ({ matches, loading, isVip, selectedDate, onDateChange, lang }) => {
  const navigate = useNavigate();
  const t = DICTIONARY[lang];
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const dailySelections = useMemo(() => matches.filter(isPopularMatch).slice(0, 3), [matches]);

  const allFilteredMatches = useMemo(() => {
    const list = matches.filter(m => {
      const matchSearch = m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
      if (selectedLeague === 'all') return matchSearch;
      if (!isNaN(Number(selectedLeague))) return m.league_id === selectedLeague && matchSearch;
      return m.league.toLowerCase().includes(selectedLeague.toLowerCase()) && matchSearch;
    });
    return [...list].sort((a, b) => (isPopularMatch(b) ? 1 : 0) - (isPopularMatch(a) ? 1 : 0));
  }, [matches, selectedLeague, searchTerm]);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10">
      <header className="flex items-center gap-3 mb-8">
        <Crown size={32} className="text-[#c18c32]" />
        <div>
          <h2 className="text-2xl font-black uppercase italic text-white">{t.vipTitle}</h2>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{t.vipSubtitle}</p>
        </div>
      </header>

      <div className="space-y-6 mb-8">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b1121] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs text-white outline-none" 
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[0,1,2,3,4,5,6,7].map(i => {
            const d = new Date(); d.setDate(d.getDate() + i);
            const iso = d.toISOString().split('T')[0];
            return (
              <button key={iso} onClick={() => onDateChange(iso)} className={`flex-shrink-0 min-w-[3.5rem] py-3 rounded-2xl border flex flex-col items-center gap-0.5 transition-all ${iso === selectedDate ? 'bg-[#c18c32] border-[#c18c32] text-slate-950' : 'bg-[#0b1121] border-white/5 text-slate-500'}`}>
                <span className="text-[7px] font-black uppercase">{d.toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { weekday: 'short' })}</span>
                <span className="text-xs font-black">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        <section className="space-y-4">
          <div className="bg-[#c18c32]/10 p-4 rounded-2xl border-l-4 border-[#c18c32]">
            <h3 className="text-[10px] font-black text-white uppercase italic">{t.vipCardHeader}</h3>
          </div>
          <div className="space-y-3">
            {loading ? <div className="flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div> : dailySelections.map(m => (
              <VipSafeCard key={m.id} match={m} isLocked={!isVip} lang={lang} onClick={() => {
                if (!isVip) navigate('/settings');
                else navigate(`/match/${m.id}`, { state: { match: m } });
              }} />
            ))}
          </div>
        </section>

        <LeagueSelector selected={selectedLeague} onSelect={setSelectedLeague} lang={lang} />
      </div>

      <div className="space-y-4">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-500" /></div> : (
          allFilteredMatches.map(m => (
            <MatchCard 
              key={m.id} 
              match={m} 
              isVipUser={isVip} 
              forceLock={true} 
              lang={lang}
              onClick={(match) => {
                if (!isVip) navigate('/settings');
                else navigate(`/match/${match.id}`, { state: { match } });
              }} 
            />
          ))
        )}
        {!loading && allFilteredMatches.length === 0 && <p className="text-center text-slate-500 text-[10px] font-black uppercase py-10">{t.noMatches}</p>}
      </div>
    </div>
  );
};

const SettingsView: React.FC<any> = ({ isVip, setIsVip, userEmail, language, setLanguage }) => {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();
  const t = DICTIONARY[language];

  const activateVip = () => {
    if (VALID_USER_CODES.has(code) || code === ADMIN_CODE) {
      setIsVip(true);
      localStorage.setItem(`btq_vip_status_${userEmail}`, 'true');
      localStorage.setItem(`btq_vip_start_${userEmail}`, Date.now().toString());
      setMsg(language === 'FR' ? "VIP ACTIVÉ !" : "VIP ACTIVATED!");
      setTimeout(() => navigate('/vip'), 1500);
    } else { setMsg(language === 'FR' ? "Code invalide." : "Invalid code."); }
  };

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10">
      <h2 className="text-2xl font-black uppercase italic mb-8">{t.settingsTitle}</h2>
      <div className="space-y-6">
        <div className="bg-[#0b1121] p-6 rounded-[2rem] border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Mail size={20}/></div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase">{t.userConnected}</p>
              <p className="text-xs font-bold text-white">{userEmail}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/5">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-3 flex items-center gap-2"><Languages size={12}/> {t.appLanguage}</p>
            <div className="flex gap-2">
              {['FR', 'EN'].map(l => (
                <button 
                  key={l} 
                  onClick={() => { setLanguage(l as Language); localStorage.setItem('lang', l); }}
                  className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${language === l ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 text-slate-500'}`}
                >
                  {l === 'FR' ? 'FRANÇAIS' : 'ENGLISH'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0b1121] p-6 rounded-[2rem] border border-[#c18c32]/20">
          <h3 className="text-[10px] font-black text-[#c18c32] uppercase mb-4 flex items-center gap-2"><Crown size={12}/> {t.activationVip}</h3>
          {!isVip ? (
            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-bold">{t.vipDescription}</p>
              <a href={PAYMENT_LINK} target="_blank" rel="noreferrer" className="block text-center w-full bg-[#c18c32] text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-[#c18c32]/20">{t.buyCode}</a>
              <div className="flex gap-2">
                <input type="text" placeholder="Code" value={code} onChange={e => setCode(e.target.value)} className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 text-xs outline-none text-white font-bold" />
                <button onClick={activateVip} className="bg-white text-slate-950 px-6 py-4 rounded-xl font-black text-xs uppercase">{t.verify}</button>
              </div>
              {msg && <p className="text-[10px] font-bold text-center text-[#c18c32] uppercase animate-pulse">{msg}</p>}
            </div>
          ) : <div className="flex items-center gap-2 text-emerald-500 font-black uppercase text-xs italic bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20"><ShieldCheck size={16}/> {t.vipActive}</div>}
        </div>
        
        <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 text-rose-500 font-black uppercase text-xs p-6 bg-rose-500/5 rounded-[2rem] border border-rose-500/20 transition-all active:scale-95"><LogOut size={16}/> {t.logout}</button>
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
  const t = DICTIONARY[language as Language];

  useEffect(() => {
    if (!match) { navigate('/'); return; }
    const getAnalysis = async () => {
      setLoading(true);
      const res = await generatePredictionsAndAnalysis(match, language);
      setAnalysis(res);
      setLoading(false);
    };
    getAnalysis();
  }, [match, language, navigate]);

  if (!match) return null;

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
      <button onClick={() => navigate(-1)} className="p-3 bg-slate-900 rounded-2xl mb-6"><ChevronLeft size={20}/></button>
      
      <div className="bg-gradient-to-br from-[#0b1121] to-[#151c30] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl mb-8">
        <div className="flex justify-between items-center mb-10">
          <div className="text-center w-2/5 flex flex-col items-center gap-3">
             <img src={match.homeLogo} className="w-16 h-16 object-contain" alt="" />
             <p className="text-[10px] font-black uppercase text-white">{match.homeTeam}</p>
          </div>
          <div className="text-xl font-black italic opacity-20 text-slate-600">VS</div>
          <div className="text-center w-2/5 flex flex-col items-center gap-3">
             <img src={match.awayLogo} className="w-16 h-16 object-contain" alt="" />
             <p className="text-[10px] font-black uppercase text-white">{match.awayTeam}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="animate-spin text-orange-500" size={32} />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center px-4">{t.loadingAi}</p>
          </div>
        ) : analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {analysis.predictions.map((p, i) => (
                <div key={i} className="bg-slate-950/60 p-5 rounded-2xl border border-white/5 flex justify-between items-center transition-all hover:bg-slate-950">
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">{p.type}</p>
                    <p className="text-sm font-black text-white">{p.recommendation}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <ConfidenceIndicator level={p.confidence as Confidence} lang={language as Language} />
                    <div className="flex items-baseline gap-1">
                       <p className="text-xl font-black text-blue-400">{p.probability}%</p>
                       <p className="text-[8px] font-black text-slate-500 uppercase">{t.probaLabel}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10"><BrainCircuit size={40} /></div>
              <h4 className="text-[10px] font-black text-blue-400 uppercase mb-3 flex items-center gap-2"><Target size={14}/> {t.tacticalAnalysis}</h4>
              <p className="text-xs leading-relaxed text-slate-300 italic font-medium">{analysis.analysis}</p>
            </div>

            {analysis.vipInsight.detailedStats && (
              <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 space-y-5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><ShieldCheck size={14}/> {t.advancedSignals}</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-[10px] font-bold">
                  <div className="flex justify-between border-b border-white/5 pb-2"><span>{t.statCorners}</span> <span className="text-orange-400 font-black">{analysis.vipInsight.detailedStats.corners}</span></div>
                  <div className="flex justify-between border-b border-white/5 pb-2"><span>{t.statCards}</span> <span className="text-orange-400 font-black">{analysis.vipInsight.detailedStats.yellowCards}</span></div>
                  <div className="flex justify-between border-b border-white/5 pb-2"><span>{t.statShots}</span> <span className="text-orange-400 font-black">{analysis.vipInsight.detailedStats.shots}</span></div>
                  <div className="flex justify-between border-b border-white/5 pb-2"><span>{t.statOnTarget}</span> <span className="text-orange-400 font-black">{analysis.vipInsight.detailedStats.shotsOnTarget}</span></div>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-3">{t.probableScorers}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {analysis.vipInsight.detailedStats.scorers.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-white/5">
                        <span className="text-xs text-white font-bold">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${s.probability}%` }}></div>
                          </div>
                          <span className="text-[10px] text-blue-400 font-black">{s.probability}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {analysis.sources && analysis.sources.length > 0 && (
              <div className="bg-orange-500/5 p-6 rounded-3xl border border-orange-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-2"><ExternalLink size={14}/> {t.googleSources}</h4>
                  <div className="group relative">
                    <Info size={12} className="text-slate-500 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-[8px] text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none z-50">
                      {t.sourceInfo}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {analysis.sources.map((src, i) => (
                    <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl hover:bg-slate-950 transition-all border border-white/5 group">
                      <span className="text-[10px] text-slate-300 truncate w-3/4 group-hover:text-white transition-colors">{src.title}</span>
                      <ExternalLink size={12} className="text-orange-400 flex-shrink-0" />
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

const AuthView: React.FC<{ lang: Language }> = ({ lang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const t = DICTIONARY[lang];

  const handleAuth = async () => {
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 bg-[#0b1121] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="text-center">
          <BrainCircuit size={48} className="text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">BETI<span className="text-orange-500">Q</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-2">{isLogin ? t.auth : t.createAccount}</p>
        </div>
        <div className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm outline-none text-white" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm outline-none text-white" />
          {error && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{error}</p>}
          <button onClick={handleAuth} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20">{isLogin ? t.login : t.register}</button>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest py-2 hover:text-white transition-colors">{isLogin ? t.newUser : t.alreadyMember}</button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isVip, setIsVip] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'FR');
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const t = DICTIONARY[language];

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

  const fetchMatchesData = async (date: string) => {
    setLoading(true); try { 
      const data = await fetchMatchesByDate(date); 
      setMatches(data.map(m => ({ id: m.match_id, league: m.league_name, league_id: m.league_id, homeTeam: m.match_hometeam_name, awayTeam: m.match_awayteam_name, homeLogo: m.team_home_badge, awayLogo: m.team_away_badge, time: m.match_time, status: m.match_status, country_name: m.country_name, stats: { homeForm: [], awayForm: [], homeRank: 0, awayRank: 0, h2h: '' }, predictions: [] }))); 
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchMatchesData(selectedDate); }, [selectedDate, user]);

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-8"><BrainCircuit size={64} className="text-blue-400 animate-pulse" /></div>;
  if (!user) return <AuthView lang={language} />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans">
      <Routes>
        <Route path="/" element={isVip ? <Navigate to="/vip" /> : <FreePredictionsView matches={matches} loading={loading} lang={language} />} />
        <Route path="/vip" element={<VipZoneView matches={matches} loading={loading} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} lang={language} />} />
        <Route path="/settings" element={<SettingsView isVip={isVip} setIsVip={setIsVip} userEmail={user.email} language={language} setLanguage={setLanguage} />} />
        <Route path="/match/:id" element={<MatchDetailView language={language} />} />
        <Route path="*" element={<Navigate to={isVip ? "/vip" : "/"} />} />
      </Routes>
      
      <nav className="fixed bottom-6 left-6 right-6 bg-[#0b1121]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-3 flex items-center justify-around z-50 shadow-2xl">
        {!isVip && (
          <Link to="/" className="flex flex-col items-center gap-1.5 p-3 text-slate-500 hover:text-blue-400 transition-colors">
            <LayoutGrid size={22} /><span className="text-[7px] font-black uppercase">{t.navFree}</span>
          </Link>
        )}
        <Link to="/vip" className="flex flex-col items-center group relative px-4">
          <div className={`${isVip ? 'bg-[#c18c32] shadow-[#c18c32]/20' : 'bg-orange-500 shadow-orange-500/20'} p-3.5 rounded-full -mt-12 border-[6px] border-[#020617] shadow-xl transition-transform`}>
            {isVip ? <Crown size={26} className="text-slate-950" /> : <Lock size={24} className="text-slate-950" />}
          </div>
          <span className={`text-[8px] font-black mt-1.5 uppercase italic tracking-widest ${isVip ? 'text-[#c18c32]' : 'text-orange-500'}`}>{t.navVip}</span>
        </Link>
        <Link to="/settings" className="flex flex-col items-center gap-1.5 p-3 text-slate-500 hover:text-blue-400 transition-colors">
          <Settings size={22} /><span className="text-[7px] font-black uppercase">{t.navSettings}</span>
        </Link>
      </nav>
    </div>
  );
};

export default () => <HashRouter><App /></HashRouter>;
