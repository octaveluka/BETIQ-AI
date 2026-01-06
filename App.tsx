
import React, { useState, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Calendar, 
  User, 
  LayoutGrid,
  ChevronLeft,
  Share2,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  ListOrdered,
  Crown,
  Lock,
  ChevronRight,
  Settings,
  Languages,
  History,
  Key,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Target,
  Zap,
  Star,
  ExternalLink
} from 'lucide-react';

import { LEAGUES } from './constants';
import { FootballMatch, UserProfile, Confidence, BetType, Standing, Language, VipInsight } from './types';
import { MatchCard } from './components/MatchCard';
import { ConfidenceIndicator } from './components/ConfidenceIndicator';
import { generatePredictionsAndAnalysis } from './services/geminiService';
import { fetchMatchesByDate, fetchStandings } from './services/footballApiService';

// --- Configuration ---
const VIP_CODE = "20202020";
const GET_CODE_URL = "https://lgckygmt.mychariow.shop/prd_2owkyx/checkout"; // Updated checkout link
export const ELITE_TEAMS = ["Real Madrid", "Barcelona", "Man City", "Liverpool", "Man United", "Arsenal", "Bayern", "PSG", "Juventus", "Inter", "Milan", "Chelsea", "Dortmund", "Atletico"];

// --- Helpers ---
const getNextDays = (count: number) => {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().split('T')[0],
      label: i === 0 ? 'Auj.' : i === 1 ? 'Dem.' : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    });
  }
  return days;
};

export const isEliteMatch = (match: FootballMatch) => {
  return ELITE_TEAMS.some(team => match.homeTeam.includes(team) || match.awayTeam.includes(team));
};

// --- Logo Component ---
const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="relative w-10 h-10">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">
        <path d="M50 10 C30 10 10 30 10 55 C10 80 30 90 50 90" fill="none" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" />
        <path d="M50 10 C70 10 90 30 90 55 C90 80 70 90 50 90" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
        <rect x="35" y="60" width="8" height="20" fill="#22c55e" rx="2" />
        <rect x="50" y="45" width="8" height="35" fill="#22c55e" rx="2" />
        <rect x="65" y="30" width="8" height="50" fill="#22c55e" rx="2" />
        <path d="M35 55 L50 40 L65 25 L80 15" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 15 L80 15 L80 25" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-2xl font-black tracking-tighter text-white italic leading-none">BETIQ</span>
      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Pariez avec intelligence</span>
    </div>
  </div>
);

// --- Multi-lang Strings ---
const STRINGS = {
  FR: {
    home: "Direct",
    vip: "VIP",
    stats: "Ligue",
    menu: "Réglages",
    loading: "Récupération des matchs...",
    noMatches: "Aucun match prévu ce jour.",
    vipTitle: "ACCÈS VIP",
    vipSafeTitle: "SÉLECTION VIP SAFE",
    vipSafeDesc: "Les 3 pronostics les plus sûrs du jour.",
    vipButton: "DÉBLOQUER L'ACCÈS VIP",
    vipAdvantages: "AVANTAGES MEMBRES",
    settingsTitle: "RÉGLAGES",
    language: "Langue de l'IA",
    history: "Historique",
    vipCodeInput: "Entrez le code VIP",
    vipCodeSuccess: "Accès VIP débloqué !",
    historyPlaceholder: "Vos matchs analysés apparaîtront ici.",
    analysis: "Analyse Contextuelle",
    signal: "Signal IA",
    back: "Retour",
    vipRequired: "MATCH VIP ELITE",
    vipRequiredDesc: "L'analyse IA approfondie pour les clubs de ce calibre est exclusivement réservée aux membres VIP.",
    unlockNow: "Entrer mon code VIP",
    getCode: "Passer au paiement",
    analyzed: "Analysé",
    safePick: "CONFIANCE MAX",
    exactScore: "Scores Exacts (VIP)",
    expertStrategy: "Stratégie Expert",
    safeStrategy: "Sûr",
    valueStrategy: "Value",
    aggressiveStrategy: "Agressif",
    matchFact: "Le Saviez-vous ?",
    vipInsights: "Aperçus VIP",
    freeAnalysis: "Analyse Gratuite",
    vipMatchLabel: "VIP",
    freeAnalysisBadge: "GRATUIT"
  },
  EN: {
    home: "Live",
    vip: "VIP",
    stats: "League",
    menu: "Settings",
    loading: "Fetching matches...",
    noMatches: "No matches today.",
    vipTitle: "VIP ACCESS",
    vipSafeTitle: "VIP SAFE SELECTION",
    vipSafeDesc: "The 3 safest picks of the day.",
    vipButton: "UNLOCK VIP ACCESS",
    vipAdvantages: "MEMBER BENEFITS",
    settingsTitle: "SETTINGS",
    language: "AI Language",
    history: "History",
    vipCodeInput: "Enter VIP code",
    vipCodeSuccess: "VIP Access Unlocked!",
    historyPlaceholder: "Your analyzed matches will appear here.",
    analysis: "Contextual Analysis",
    signal: "AI Signal",
    back: "Back",
    vipRequired: "ELITE VIP MATCH",
    vipRequiredDesc: "Deep AI analysis for clubs of this caliber is exclusively reserved for VIP members.",
    unlockNow: "Enter VIP code",
    getCode: "Proceed to payment",
    analyzed: "Analyzed",
    safePick: "MAX CONFIDENCE",
    exactScore: "Exact Scores (VIP)",
    expertStrategy: "Expert Strategy",
    safeStrategy: "Safe",
    valueStrategy: "Value",
    aggressiveStrategy: "Aggressive",
    matchFact: "Did You Know?",
    vipInsights: "VIP Insights",
    freeAnalysis: "Free Analysis",
    vipMatchLabel: "VIP",
    freeAnalysisBadge: "FREE"
  }
};

// --- Views ---

const HomeView: React.FC<{ language: Language, isVip: boolean }> = ({ language, isVip }) => {
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeagueName, setSelectedLeagueName] = useState('All');
  const [selectedDate, setSelectedDate] = useState(getNextDays(1)[0].date);
  const navigate = useNavigate();
  const days = useMemo(() => getNextDays(8), []);
  const S = STRINGS[language];

  const loadMatches = async (date: string) => {
    setLoading(true);
    const apiData = await fetchMatchesByDate(date);
    const mapped: FootballMatch[] = apiData.map(m => ({
      id: m.match_id,
      league: m.league_name,
      homeTeam: m.match_hometeam_name,
      awayTeam: m.match_awayteam_name,
      homeLogo: m.team_home_badge,
      awayLogo: m.team_away_badge,
      time: m.match_time,
      status: m.match_status,
      stats: { homeForm: [], awayForm: [], homeRank: 0, awayRank: 0, h2h: 'N/A' },
      predictions: []
    }));
    setMatches(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadMatches(selectedDate);
  }, [selectedDate]);

  const filteredMatches = useMemo(() => {
    if (selectedLeagueName === 'All') return matches;
    return matches.filter(m => m.league.includes(selectedLeagueName));
  }, [matches, selectedLeagueName]);

  const safePicks = useMemo(() => {
    if (!isVip) return [];
    return matches.slice(0, 3);
  }, [matches, isVip]);

  return (
    <div className="pb-24">
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Logo />
          <button 
            onClick={() => loadMatches(selectedDate)}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-indigo-400 transition-all active:scale-90"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
          {days.map(day => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap border flex flex-col items-center min-w-[75px] transition-all ${
                selectedDate === day.date 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20' 
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <span className="opacity-60 text-[9px] uppercase tracking-tighter mb-0.5">{day.label.split(' ')[0]}</span>
              <span className="text-sm">{day.label.split(' ')[1] || ''}</span>
            </button>
          ))}
        </div>

        {isVip && safePicks.length > 0 && (
          <div className="mb-8 p-6 bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-transparent border border-amber-500/30 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
               <Crown size={60} className="text-amber-500" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-amber-500/20 rounded-lg">
                <Crown size={14} className="text-amber-500" />
              </div>
              <h2 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">{S.vipSafeTitle}</h2>
            </div>
            <div className="space-y-2.5">
              {safePicks.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => navigate(`/match/${m.id}`, { state: { match: m } })}
                  className="bg-slate-900/80 backdrop-blur-md p-4 rounded-[1.5rem] flex items-center justify-between cursor-pointer border border-white/5 hover:border-amber-500/50 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <img src={m.homeLogo} className="w-7 h-7 object-contain bg-slate-800 rounded-full border border-slate-700" />
                      <img src={m.awayLogo} className="w-7 h-7 object-contain bg-slate-800 rounded-full border border-slate-700" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white truncate max-w-[140px]">{m.homeTeam} - {m.awayTeam}</span>
                      <span className="text-[9px] text-amber-500/70 font-black uppercase tracking-widest">{S.safePick}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-4 border-b border-slate-900/30">
          {LEAGUES.map(league => (
            <button
              key={league.name}
              onClick={() => setSelectedLeagueName(league.name)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all border ${
                selectedLeagueName === league.name 
                  ? 'bg-slate-100 border-white text-slate-950' 
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {league.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest animate-pulse">{S.loading}</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-[2.5rem] border border-slate-800/50 border-dashed">
            <p className="text-slate-500 text-sm font-medium">{S.noMatches}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 mt-2">
            {filteredMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                isVipUser={isVip}
                onClick={(m) => navigate(`/match/${m.id}`, { state: { match: m } })} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const VIPView: React.FC<{ language: Language, isVip: boolean }> = ({ language, isVip }) => {
  const S = STRINGS[language];
  const navigate = useNavigate();

  return (
    <div className="px-4 py-10 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
          <Crown className="text-amber-500" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">{S.vipTitle}</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Premium Algorithm</p>
        </div>
      </div>

      {!isVip ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-950 border border-amber-500/30 rounded-[3rem] p-10 text-center mb-10 shadow-2xl">
          <div className="absolute top-[-20%] left-[-10%] w-60 h-60 bg-amber-500/10 blur-[100px] rounded-full"></div>
          <Crown className="mx-auto mb-6 text-amber-500" size={56} />
          <h2 className="text-2xl font-black mb-3 uppercase tracking-tighter">{language === 'FR' ? 'EXCELLENCE PRÉDICTIVE' : 'PREDICTIVE EXCELLENCE'}</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">
            {language === 'FR' 
              ? "Accédez aux analyses des plus grands clubs et aux signaux IA haute fidélité (+85% succès)."
              : "Access analysis for top-tier clubs and high-fidelity AI signals (85%+ success rate)."}
          </p>
          <a 
            href={GET_CODE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-5 rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 text-sm tracking-widest flex items-center justify-center gap-2"
          >
            {S.vipButton}
            <ExternalLink size={16} />
          </a>
          <button 
            onClick={() => navigate('/settings')}
            className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest underline underline-offset-4"
          >
            {language === 'FR' ? "J'ai déjà un code" : "I already have a code"}
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-[3rem] p-10 text-center mb-10 shadow-2xl relative overflow-hidden">
           <div className="absolute inset-0 bg-emerald-500/5 blur-[60px] rounded-full"></div>
           <CheckCircle2 className="mx-auto mb-4 text-emerald-500 relative z-10" size={56} />
           <h2 className="text-2xl font-black mb-2 text-white relative z-10 uppercase tracking-tighter">VIP ACTIF</h2>
           <p className="text-slate-400 text-sm relative z-10 font-medium">{language === 'FR' ? "Toutes les limites ont été levées." : "All limitations have been removed."}</p>
        </div>
      )}

      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 px-2">{S.vipAdvantages}</h3>
      <div className="space-y-4">
        {[
          { icon: <Target size={20} />, title: language === 'FR' ? "Scores Exacts" : "Correct Scores", desc: language === 'FR' ? "Prédiction des scores les plus probables du match." : "Prediction of the most likely final scores." },
          { icon: <Zap size={20} />, title: language === 'FR' ? "Stratégie de Mise" : "Betting Strategy", desc: language === 'FR' ? "Conseils Safe, Value et Agressif personnalisés." : "Personalized Safe, Value, and Aggressive tips." },
          { icon: <Lightbulb size={20} />, title: language === 'FR' ? "Faits Tactiques" : "Tactical Facts", desc: language === 'FR' ? "Points clés sur la forme et les joueurs absents." : "Key tactical insights and missing players data." },
          { icon: <ShieldCheck size={20} />, title: language === 'FR' ? "Elite Clubs Access" : "Elite Clubs Access", desc: language === 'FR' ? "Analyse complète des matchs du Real, City, etc." : "Full analysis for Real, City, and big teams." }
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-5 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl transition-all hover:border-slate-700">
            <div className="p-3 bg-slate-950 rounded-2xl text-amber-500 border border-slate-800 shadow-inner">
              {item.icon}
            </div>
            <div>
              <h4 className="text-sm font-black mb-1 text-slate-100">{item.title}</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsView: React.FC<{ language: Language, setLanguage: (l: Language) => void, isVip: boolean, setIsVip: (v: boolean) => void }> = ({ language, setLanguage, isVip, setIsVip }) => {
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [history, setHistory] = useState<FootballMatch[]>([]);
  const S = STRINGS[language];
  const navigate = useNavigate();

  useEffect(() => {
    const savedHistory = localStorage.getItem('betiq_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const handleVipCode = (val: string) => {
    setCode(val);
    if (val === VIP_CODE) {
      setIsVip(true);
      localStorage.setItem('isVip', 'true');
    }
  };

  return (
    <div className="px-4 py-8 pb-24">
      <div className="flex gap-4 mb-10 bg-slate-900/50 p-1.5 rounded-[1.8rem] border border-slate-800">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500'}`}
        >
          {S.settingsTitle}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500'}`}
        >
          {S.history}
        </button>
      </div>

      {activeTab === 'settings' ? (
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                <Languages size={22} className="text-indigo-400" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">{S.language}</h2>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setLanguage('FR')}
                className={`flex-1 py-4 rounded-2xl font-black text-xs border transition-all ${language === 'FR' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
              >
                FRANÇAIS
              </button>
              <button 
                onClick={() => setLanguage('EN')}
                className={`flex-1 py-4 rounded-2xl font-black text-xs border transition-all ${language === 'EN' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
              >
                ENGLISH
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-4">
                <div className="p-2.5 bg-amber-500/10 rounded-xl">
                  <Key size={22} className="text-amber-500" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">CODE VIP</h2>
              </div>
              {isVip && <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">ACTIF</span>}
            </div>
            <input 
              type="text"
              value={isVip ? '••••••••' : code}
              disabled={isVip}
              onChange={(e) => handleVipCode(e.target.value)}
              placeholder={S.vipCodeInput}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-2xl font-black text-center focus:border-amber-500 outline-none transition-all placeholder:text-slate-800"
            />
            {isVip && <p className="text-center text-[10px] font-bold text-emerald-500 mt-4 animate-pulse">{S.vipCodeSuccess}</p>}
            
            {!isVip && (
              <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Besoin d'un code ?</p>
                <a 
                  href={GET_CODE_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-6 py-3 rounded-full border border-amber-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                >
                  {S.getCode}
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="bg-slate-900/30 p-16 rounded-[2.5rem] border border-slate-800/50 border-dashed text-center">
              <History className="mx-auto mb-5 text-slate-700 opacity-30" size={48} />
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">{S.historyPlaceholder}</p>
            </div>
          ) : (
            history.map((m, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(`/match/${m.id}`, { state: { match: m } })}
                className="bg-slate-900/60 p-5 rounded-[1.8rem] border border-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                   <div className="flex -space-x-3">
                     <img src={m.homeLogo} className="w-8 h-8 object-contain bg-slate-800 rounded-full border-2 border-slate-900 shadow-lg" />
                     <img src={m.awayLogo} className="w-8 h-8 object-contain bg-slate-800 rounded-full border-2 border-slate-900 shadow-lg" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[11px] font-black truncate max-w-[160px] text-white uppercase tracking-tighter">{m.homeTeam} - {m.awayTeam}</span>
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{m.league}</span>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end">
                     <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{S.analyzed}</span>
                   </div>
                   <ChevronRight size={16} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const MatchDetailView: React.FC<{ language: Language, isVip: boolean }> = ({ language, isVip }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const match = state?.match as FootballMatch;
  const S = STRINGS[language];
  
  const [data, setData] = useState<{ predictions: any[], analysis: string | null, vipInsight: VipInsight | null }>({
    predictions: [],
    analysis: null,
    vipInsight: null
  });
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const isElite = useMemo(() => {
    if (!match) return false;
    return isEliteMatch(match);
  }, [match]);

  useEffect(() => {
    if (match) {
      if (!isVip && isElite) {
        setBlocked(true);
        return;
      }

      setLoading(true);
      generatePredictionsAndAnalysis(match, language).then(res => {
        setData(res);
        setLoading(false);
        
        const savedHistory = JSON.parse(localStorage.getItem('betiq_history') || '[]');
        const updatedMatch = { ...match, predictions: res.predictions };
        const newHistory = [updatedMatch, ...savedHistory.filter((h: any) => h.id !== match.id)].slice(0, 30);
        localStorage.setItem('betiq_history', JSON.stringify(newHistory));
      });
    }
  }, [match, language, isVip, isElite]);

  if (!match) return <div className="p-8 text-center mt-20"><button onClick={() => navigate('/')} className="text-indigo-500 underline">{S.back}</button></div>;

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-2xl px-4 py-4 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 active:scale-90 transition-all">
          <ChevronLeft size={22} />
        </button>
        <div className="flex flex-col items-center max-w-[200px]">
          <span className="font-black text-[12px] truncate uppercase tracking-tighter text-slate-100">{match.homeTeam} vs {match.awayTeam}</span>
        </div>
        <button className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 active:scale-90 transition-all">
          <Share2 size={22} />
        </button>
      </div>

      <div className="px-5 py-8">
        <div className="relative mb-8 p-10 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden flex items-center justify-around">
          <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] rounded-full"></div>
          <div className="flex flex-col items-center gap-4 w-1/3 text-center z-10">
            <img src={match.homeLogo} className="w-16 h-16 object-contain drop-shadow-lg" />
            <span className="text-[11px] font-black leading-tight uppercase tracking-tighter text-white">{match.homeTeam}</span>
          </div>
          <div className="text-2xl font-black text-slate-700 italic z-10">VS</div>
          <div className="flex flex-col items-center gap-4 w-1/3 text-center z-10">
            <img src={match.awayLogo} className="w-16 h-16 object-contain drop-shadow-lg" />
            <span className="text-[11px] font-black leading-tight uppercase tracking-tighter text-white">{match.awayTeam}</span>
          </div>
        </div>

        {blocked ? (
           <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-amber-500/5 blur-[100px] rounded-full"></div>
              <Lock className="mx-auto mb-6 text-amber-500 opacity-50" size={56} />
              <h2 className="text-2xl font-black mb-3 uppercase tracking-tighter text-white">{S.vipRequired}</h2>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">{S.vipRequiredDesc}</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/settings')} 
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black py-5 rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 text-sm tracking-widest uppercase"
                >
                  {S.unlockNow}
                </button>
                
                <a 
                  href={GET_CODE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-800 text-white font-black py-5 rounded-2xl transition-all border border-white/5 active:scale-95 text-sm tracking-widest uppercase flex items-center justify-center gap-2"
                >
                  {S.getCode}
                  <ExternalLink size={16} />
                </a>
              </div>
           </div>
        ) : (
          <div className="space-y-6">
            {!isVip && !isElite && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full inline-flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{S.freeAnalysisBadge}</span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <TrendingUp size={18} className="text-indigo-400" />
                </div>
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{S.signal}</h2>
              </div>
              <div className="space-y-4">
                {loading ? [1, 2].map(i => <div key={i} className="h-28 bg-slate-900 rounded-[2rem] animate-pulse border border-slate-800"></div>) : data.predictions.map((pred, i) => (
                  <div key={i} className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 flex justify-between items-center shadow-xl">
                    <div>
                      <div className="text-[10px] uppercase font-black text-indigo-400 mb-1.5 tracking-widest">{pred.type}</div>
                      <div className="text-2xl font-black text-white">{pred.recommendation}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-white mb-1">{pred.probability}%</div>
                      <ConfidenceIndicator level={pred.confidence} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* VIP ONLY Section */}
            {isVip && data.vipInsight && (
              <>
                <div>
                   <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500/10 rounded-xl">
                      <Target size={18} className="text-amber-500" />
                    </div>
                    <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">{S.exactScore}</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {data.vipInsight.exactScores.map((score, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 p-6 rounded-[2rem] text-center shadow-xl">
                         <span className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">PROBABLE</span>
                         <span className="text-3xl font-black text-white">{score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                   <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                      <Zap size={18} className="text-indigo-400" />
                    </div>
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{S.expertStrategy}</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                       <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-1">{S.safeStrategy}</span>
                       <p className="text-xs text-slate-300 font-medium">{data.vipInsight.strategy.safe}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                       <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-1">{S.valueStrategy}</span>
                       <p className="text-xs text-slate-300 font-medium">{data.vipInsight.strategy.value}</p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                       <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block mb-1">{S.aggressiveStrategy}</span>
                       <p className="text-xs text-slate-300 font-medium">{data.vipInsight.strategy.aggressive}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!isVip && (
              <div className="p-10 bg-gradient-to-b from-slate-900/50 to-amber-950/10 border border-amber-500/20 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden">
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 blur-[40px] rounded-full"></div>
                 <Crown className="mx-auto mb-4 text-amber-500/40" size={40} />
                 <h3 className="text-base font-black text-white mb-1 uppercase tracking-tighter">{S.vipInsights}</h3>
                 <p className="text-[11px] text-slate-500 font-bold uppercase mb-6 leading-relaxed">Passez VIP pour débloquer les scores exacts<br/>et les stratégies de mise expertes.</p>
                 <a 
                   href={GET_CODE_URL}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 text-[10px] font-black px-8 py-3.5 rounded-full border border-amber-500/30 transition-all uppercase tracking-[0.2em] shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 mx-auto w-fit"
                 >
                   {S.getCode}
                   <ExternalLink size={12} />
                 </a>
              </div>
            )}

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-800/50 rounded-xl">
                  <ShieldCheck size={18} className="text-slate-400" />
                </div>
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{S.analysis}</h2>
              </div>
              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 mb-8 shadow-xl">
                {loading ? <div className="space-y-4 animate-pulse"><div className="h-3 bg-slate-800 rounded-full w-full"></div><div className="h-3 bg-slate-800 rounded-full w-11/12"></div></div> : <p className="leading-relaxed text-[13px] text-slate-300 font-medium leading-relaxed">{data.analysis}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const NavLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all gap-1.5 ${
        isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {icon}
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </Link>
  );
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'FR';
  });
  const [isVip, setIsVip] = useState<boolean>(() => {
    return localStorage.getItem('isVip') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('lang', language);
  }, [language]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
        <Routes>
          <Route path="/" element={<HomeView language={language} isVip={isVip} />} />
          <Route path="/vip" element={<VIPView language={language} isVip={isVip} />} />
          <Route path="/settings" element={<SettingsView language={language} setLanguage={setLanguage} isVip={isVip} setIsVip={setIsVip} />} />
          <Route path="/match/:id" element={<MatchDetailView language={language} isVip={isVip} />} />
        </Routes>

        <nav className="fixed bottom-6 left-4 right-4 z-50 pointer-events-none">
          <div className="max-w-md mx-auto bg-slate-900/90 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-2 flex items-center justify-between shadow-2xl pointer-events-auto ring-1 ring-white/10">
            <NavLink to="/" icon={<LayoutGrid size={20} />} label={STRINGS[language].home} />
            <NavLink to="/vip" icon={<Crown size={20} />} label={STRINGS[language].vip} />
            <NavLink to="/settings" icon={<Settings size={20} />} label={STRINGS[language].menu} />
          </div>
        </nav>
      </div>
    </HashRouter>
  );
};

export default App;
