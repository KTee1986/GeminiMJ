/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History as HistoryIcon, 
  Plus, 
  Minus, 
  RotateCcw, 
  Save, 
  Users, 
  LogOut, 
  ShieldCheck, 
  AlertCircle,
  Trophy,
  ChevronRight,
  UserPlus,
  Coins,
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Filter,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  Player, 
  GameRecord, 
  Chips, 
  CHIP_VALUES, 
  DEFAULT_CHIPS, 
  ZERO_CHIPS,
  POSITIONS, 
  Position,
  PlayerStatsDetailed,
  PositionState,
  ScoreMode
} from './types';

// Tab Components
import { HistoryTab } from './components/HistoryTab';
import { RunningTotalTab } from './components/RunningTotalTab';
import { ChartTab } from './components/ChartTab';
import { StatsTab } from './components/StatsTab';
import { InsightsTab } from './components/InsightsTab';
import { PlayerListTab } from './components/PlayerListTab';
import { AccountingHistoryTab } from './components/AccountingHistoryTab';
import { SettleUpTab } from './components/SettleUpTab';

type Tab = 'record' | 'history' | 'total' | 'chart' | 'stats' | 'insights' | 'players' | 'accounting_history' | 'settleup';

export default function App() {
  const [user, setUser] = useState<{ name: string; email: string; picture: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [fetchingPlayers, setFetchingPlayers] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [accountingRecords, setAccountingRecords] = useState<any[]>([]);
  const [fetchingAccounting, setFetchingAccounting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('record');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [navOpen, setNavOpen] = useState(false);
  
  // Game State
  const [gameState, setGameState] = useState<Record<Position, PositionState>>({
    East: { players: [], chips: { ...DEFAULT_CHIPS }, mode: 'CHIPS', manualScore: 200, deltaChips: { ...ZERO_CHIPS } },
    South: { players: [], chips: { ...DEFAULT_CHIPS }, mode: 'CHIPS', manualScore: 200, deltaChips: { ...ZERO_CHIPS } },
    West: { players: [], chips: { ...DEFAULT_CHIPS }, mode: 'CHIPS', manualScore: 200, deltaChips: { ...ZERO_CHIPS } },
    North: { players: [], chips: { ...DEFAULT_CHIPS }, mode: 'CHIPS', manualScore: 200, deltaChips: { ...ZERO_CHIPS } },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'record', label: 'Record Game', icon: Plus },
    { id: 'history', label: 'Full History', icon: HistoryIcon },
    { id: 'total', label: 'Running Total', icon: LayoutDashboard },
    { id: 'chart', label: 'Visual Chart', icon: TrendingUp },
    { id: 'stats', label: 'Player Stats', icon: BarChart3 },
    { id: 'insights', label: 'Deep Insights', icon: Lightbulb },
    { id: 'settleup', label: 'Settle Up', icon: RotateCcw },
    { id: 'accounting_history', label: 'Account Audit', icon: HistoryIcon },
    { id: 'players', label: 'Player Registry', icon: Users },
  ];

  // Auth check
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      setUser(data);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch players and history when logged in
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setFetchingPlayers(true);
        setFetchError(null);
        try {
          const [playersRes, historyRes] = await Promise.all([
            fetch('/api/players', { credentials: 'include' }),
            fetch('/api/game/history', { credentials: 'include' })
          ]);
          if (playersRes.ok) {
            const data = await playersRes.json();
            setPlayers(data);
          } else {
            if (playersRes.status === 401) {
              console.warn('Session expired or missing. Setting user to null.');
              setUser(null);
              return;
            }
            const errData = await playersRes.json();
            console.error('Failed to fetch players:', errData.error);
            setFetchError(errData.error || 'Failed to fetch players');
            if (errData.details) {
              console.info('Error details:', errData.details);
            }
          }
          if (historyRes.ok) setHistory(await historyRes.json());
          
          setFetchingAccounting(true);
          const accRes = await fetch('/api/accounting/history', { credentials: 'include' });
          if (accRes.ok) setAccountingRecords(await accRes.json());
          setFetchingAccounting(false);
        } catch (e: any) {
          console.error('Failed to fetch data', e);
          setFetchError(e.message || 'Connection error while fetching players');
        } finally {
          setFetchingPlayers(false);
        }
      };
      fetchData();
    }
  }, [user]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    if (!emailInput) return;
    
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: emailInput })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (e) {
      setAuthError('Connection error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  // Calculations
  const calculateScore = (chips: Chips) => {
    return (
      chips.red * CHIP_VALUES.red +
      chips.blue * CHIP_VALUES.blue +
      chips.green * CHIP_VALUES.green +
      chips.white * CHIP_VALUES.white
    );
  };

  const getDelta = (state: PositionState) => {
    if (state.mode === 'MANUAL') return state.manualScore - 200;
    if (state.mode === 'DELTA') return calculateScore(state.deltaChips);
    return calculateScore(state.chips) - 200;
  };

  const totalDelta = useMemo(() => {
    return POSITIONS.reduce((acc, pos) => acc + getDelta(gameState[pos]), 0);
  }, [gameState]);

  const usedPlayers = useMemo(() => {
    const all = new Set<string>();
    POSITIONS.forEach(pos => {
      gameState[pos].players.forEach(p => all.add(p));
    });
    return all;
  }, [gameState]);

  const updateChips = (pos: Position, type: keyof Chips, delta: number) => {
    setGameState(prev => ({
      ...prev,
      [pos]: {
        ...prev[pos],
        chips: {
          ...prev[pos].chips,
          [type]: Math.max(0, prev[pos].chips[type] + delta)
        }
      }
    }));
  };

  const setChipValue = (pos: Position, type: keyof Chips, value: number) => {
    setGameState(prev => ({
      ...prev,
      [pos]: {
        ...prev[pos],
        chips: {
          ...prev[pos].chips,
          [type]: Math.max(0, value)
        }
      }
    }));
  };

  const togglePlayer = (pos: Position, playerName: string) => {
    setGameState(prev => {
      const current = prev[pos].players;
      const isSelected = current.includes(playerName);
      
      let nextPlayers;
      if (isSelected) {
        nextPlayers = current.filter(p => p !== playerName);
      } else {
        if (current.length >= 2) return prev; // Limit to 2 per position
        nextPlayers = [...current, playerName];
      }

      return {
        ...prev,
        [pos]: { ...prev[pos], players: nextPlayers }
      };
    });
  };

  const updateDeltaChips = (pos: Position, type: keyof Chips, delta: number) => {
    setGameState(prev => ({
      ...prev,
      [pos]: {
        ...prev[pos],
        deltaChips: {
          ...prev[pos].deltaChips,
          [type]: prev[pos].deltaChips[type] + delta
        }
      }
    }));
  };

  const setDeltaChipValue = (pos: Position, type: keyof Chips, value: number) => {
    setGameState(prev => ({
      ...prev,
      [pos]: {
        ...prev[pos],
        deltaChips: {
          ...prev[pos].deltaChips,
          [type]: value
        }
      }
    }));
  };

  const setMode = (pos: Position, mode: ScoreMode) => {
    setGameState(prev => ({
      ...prev,
      [pos]: {
        ...prev[pos],
        mode,
        // Sync values if needed
        manualScore: mode === 'MANUAL' ? (getDelta(prev[pos]) + 200) : prev[pos].manualScore
      }
    }));
  };

  const setManualScore = (pos: Position, value: number) => {
    setGameState(prev => ({
      ...prev,
      [pos]: {
        ...prev[pos],
        manualScore: value
      }
    }));
  };

  const resetGame = () => {
    setGameState({
      East: { players: [], chips: { ...DEFAULT_CHIPS }, mode: 'CHIPS', manualScore: 200, deltaChips: { ...ZERO_CHIPS } },
      South: { players: [], chips: { ...DEFAULT_CHIPS }, mode: 'CHIPS', manualScore: 200, deltaChips: { ...ZERO_CHIPS } },
      West: { players: [], chips: { ...DEFAULT_CHIPS }, mode: 'CHIPS', manualScore: 200, deltaChips: { ...ZERO_CHIPS } },
      North: { players: [], chips: { ...DEFAULT_CHIPS }, mode: 'CHIPS', manualScore: 200, deltaChips: { ...ZERO_CHIPS } },
    });
  };

  const submitGame = async () => {
    if (Math.abs(totalDelta) > 0.01) {
      setError("Sum of all deltas must be Net $0");
      return;
    }

    const anyEmpty = POSITIONS.some(pos => gameState[pos].players.length === 0);
    if (anyEmpty) {
      setError("All positions must have at least one player selected");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      east: { 
        player: gameState.East.players.join(' + '), 
        score: getDelta(gameState.East).toFixed(2) 
      },
      south: { 
        player: gameState.South.players.join(' + '), 
        score: getDelta(gameState.South).toFixed(2) 
      },
      west: { 
        player: gameState.West.players.join(' + '), 
        score: getDelta(gameState.West).toFixed(2) 
      },
      north: { 
        player: gameState.North.players.join(' + '), 
        score: getDelta(gameState.North).toFixed(2) 
      },
    };

    try {
      const res = await fetch('/api/game/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        // Refresh everything
        const [hRes, aRes] = await Promise.all([
          fetch('/api/game/history', { credentials: 'include' }),
          fetch('/api/accounting/history', { credentials: 'include' })
        ]);
        if (hRes.ok) setHistory(await hRes.json());
        if (aRes.ok) setAccountingRecords(await aRes.json());
        
        resetGame();
        setActiveTab('settleup'); 
      } else {
        const err = await res.json();
        setError(err.error || "Failed to save game record");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransfer = async (from: string, to: string, amount: number, comment?: string) => {
    try {
      const res = await fetch('/api/accounting/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fromGroup: from, toGroup: to, amount, comment })
      });
      if (res.ok) {
        const accRes = await fetch('/api/accounting/history', { credentials: 'include' });
        if (accRes.ok) setAccountingRecords(await accRes.json());
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Transfer failed');
      }
    } catch (e: any) {
      console.error('Transfer error', e);
      throw e;
    }
  };

  // --- Data Analytics Logic ---

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    history.forEach(log => {
      const date = new Date(log.timestamp);
      if (!isNaN(date.getTime())) {
        years.add(date.getFullYear().toString());
      }
    });
    return ['All', ...Array.from(years).sort((a,b) => b.localeCompare(a))];
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (yearFilter === 'All') return history;
    return history.filter(log => {
      const date = new Date(log.timestamp);
      return !isNaN(date.getTime()) && date.getFullYear().toString() === yearFilter;
    });
  }, [history, yearFilter]);

  const analyticalStats = useMemo(() => {
    const stats: Record<string, PlayerStatsDetailed> = {};

    filteredHistory.forEach(game => {
      const seats = [game.east, game.south, game.west, game.north];
      const gameFieldScores = seats.map(s => parseFloat(s.score));
      const totalFieldScore = gameFieldScores.reduce((a, b) => a + b, 0);
      
      seats.forEach(seat => {
        const names = seat.player.split(' + ').map(n => n.trim());
        const score = parseFloat(seat.score);
        const date = new Date(game.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        names.forEach(name => {
          if (!stats[name]) {
            stats[name] = { 
              name, games: 0, totalScore: 0, wins: 0, 
              highest: -Infinity, lowest: Infinity,
              partnerScores: {}, monthlyScores: {},
              inGamesStats: { totalFieldScore: 0, count: 0 }
            };
          }
          const p = stats[name];
          p.games += 1;
          p.totalScore += score;
          if (score > 0) p.wins += 1;
          p.highest = Math.max(p.highest, score);
          p.lowest = Math.min(p.lowest, score);
          
          p.inGamesStats.totalFieldScore += totalFieldScore;
          p.inGamesStats.count += 1;

          // Monthly
          if (!p.monthlyScores[monthKey]) p.monthlyScores[monthKey] = { total: 0, count: 0 };
          p.monthlyScores[monthKey].total += score;
          p.monthlyScores[monthKey].count += 1;

          // Partners
          const partners = names.filter(n => n !== name);
          partners.forEach(partner => {
            if (!p.partnerScores[partner]) p.partnerScores[partner] = { total: 0, count: 0 };
            p.partnerScores[partner].total += score;
            p.partnerScores[partner].count += 1;
          });
        });
      });
    });

    return stats;
  }, [filteredHistory]);

  const runningTotals = useMemo(() => {
    return (Object.values(analyticalStats) as PlayerStatsDetailed[])
      .map(p => ({ name: p.name, games: p.games, totalScore: p.totalScore }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [analyticalStats]);

  useEffect(() => {
    if (activeTab === 'insights') {
      setYearFilter('All');
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RotateCcw className="w-8 h-8" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl"
        >
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Mahjong Audit</h1>
          <p className="text-neutral-500 mb-8 leading-relaxed">
            Authorized players only. Please enter your email address to access the game logs and tracking system.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="yours@example.com"
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl py-3 px-4 focus:ring-1 ring-emerald-500/50 outline-none transition-all"
                required
              />
            </div>
            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium p-3 rounded-lg text-left">
                {authError}
              </div>
            )}
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-white text-black font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all active:scale-95 group shadow-lg disabled:opacity-50"
            >
              {isLoggingIn ? <RotateCcw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              Access Session
            </button>
          </form>
          <div className="mt-8 flex items-center gap-2 justify-center text-xs text-neutral-600 uppercase tracking-widest font-bold">
            <Users className="w-3 h-3" />
            Certified Audit Trail
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-400 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center">
          <h1 className="text-[11px] font-black text-white tracking-widest uppercase italic">Gamble 2 MJ Record</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setNavOpen(!navOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white hover:bg-neutral-800 transition-all"
            >
              <Menu className="w-3.5 h-3.5 text-blue-500" />
              <span>{TABS.find(t => t.id === activeTab)?.label}</span>
              <ChevronRight className={cn("w-3 h-3 transition-transform opacity-50", navOpen && "rotate-90")} />
            </button>

            <AnimatePresence>
              {navOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setNavOpen(false)}
                    className="fixed inset-0 z-40 bg-black/20"
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden"
                  >
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setNavOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                          activeTab === tab.id 
                            ? "bg-blue-600 text-white" 
                            : "text-slate-500 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                    <div className="border-t border-white/5 mt-2 pt-2 px-4 pb-2">
                       <div className="flex items-center gap-2 mb-2">
                         <img src={user.picture} className="w-6 h-6 rounded-full" alt="" />
                         <div className="min-w-0">
                           <p className="text-[9px] font-bold text-white truncate">{user.name}</p>
                         </div>
                       </div>
                       <button 
                         onClick={handleLogout}
                         className="w-full py-2 text-[8px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                       >
                         Logout Session
                       </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Analytics Filter Overlay */}
      {activeTab !== 'record' && activeTab !== 'players' && activeTab !== 'accounting_history' && activeTab !== 'settleup' && (
        <div className="bg-neutral-950/50 border-b border-white/5 py-3 px-4 flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-3 h-3 text-blue-500" />
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Audit Scope</span>
          </div>
          <div className="flex gap-1.5 pb-1">
            {availableYears.map(y => (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-black transition-all whitespace-nowrap",
                  yearFilter === y 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "bg-slate-900 text-slate-500 hover:text-slate-300"
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-5 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'record' && (
            <motion.div 
              key="record"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-5"
            >
              {/* Tracker View */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {POSITIONS.map((pos) => (
                  <PositionCard 
                    key={pos}
                    pos={pos}
                    state={gameState[pos]}
                    allPlayers={players}
                    usedPlayers={usedPlayers}
                    onTogglePlayer={(name) => togglePlayer(pos, name)}
                    onUpdateChips={(type, d) => updateChips(pos, type, d)}
                    onSetChipValue={(type, v) => setChipValue(pos, type, v)}
                    onUpdateDeltaChips={(type, d) => updateDeltaChips(pos, type, d)}
                    onSetDeltaChipValue={(type, v) => setDeltaChipValue(pos, type, v)}
                    onSetMode={(mode) => setMode(pos, mode)}
                    onSetManualScore={(v) => setManualScore(pos, v)}
                    delta={getDelta(gameState[pos])}
                    isLoadingPlayers={fetchingPlayers}
                    fetchError={fetchError}
                  />
                ))}
              </div>

              {/* Sidebar Summary */}
              <aside className="lg:col-span-4 flex flex-col gap-5">
                <div className="wind-card flex-1">
                  <h3 className="pos-label mb-5 border-b border-white/5 pb-2">Session Audit Summary</h3>
                  
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className={cn(
                      "p-6 rounded-xl text-center space-y-1 transition-colors",
                      Math.abs(totalDelta) < 0.01 ? "bg-emerald-900/40 text-emerald-400" : "bg-rose-950/40 text-rose-500"
                    )}>
                      <div className="pos-label opacity-100">Total Delta Check</div>
                      <div className="text-3xl font-black tabular-nums tracking-tighter">
                        NET ${totalDelta.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-bold uppercase opacity-60">
                        {Math.abs(totalDelta) < 0.01 ? 'Balanced & Ready to Log' : 'Sum must equal zero'}
                      </div>
                    </div>

                    <div className="space-y-4 glass p-5 rounded-xl flex-1">
                      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                        <span className="text-slate-500">Live Status</span>
                        <span className="text-slate-300">#{Date.now().toString().slice(-5)}</span>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Authorized Admin</span>
                          <span className="text-slate-300 font-medium">{user.name}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Players Defined</span>
                          <span className="text-slate-300 font-medium">{players.length}</span>
                        </div>
                      </div>

                      {error && (
                        <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold leading-relaxed">
                          ERROR: {error}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={submitGame}
                      disabled={isSubmitting || Math.abs(totalDelta) > 0.01}
                      className={cn(
                        "w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg disabled:opacity-20",
                        Math.abs(totalDelta) < 0.01 ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      )}
                    >
                      {isSubmitting ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Log to Google Sheet
                    </button>
                  </div>
                </div>
              </aside>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HistoryTab logs={filteredHistory} fetching={fetchingPlayers} />
            </motion.div>
          )}

          {activeTab === 'total' && (
            <motion.div key="total" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RunningTotalTab data={runningTotals} />
            </motion.div>
          )}

          {activeTab === 'chart' && (
            <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ChartTab history={filteredHistory} />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StatsTab stats={analyticalStats} />
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InsightsTab history={filteredHistory} playerStats={analyticalStats} currentUser={user.name} />
            </motion.div>
          )}

          {activeTab === 'players' && (
            <motion.div key="players" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PlayerListTab players={players} fetching={fetchingPlayers} />
            </motion.div>
          )}

          {activeTab === 'accounting_history' && (
            <motion.div key="accounting_history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AccountingHistoryTab records={accountingRecords} fetching={fetchingAccounting} />
            </motion.div>
          )}

          {activeTab === 'settleup' && (
            <motion.div key="settleup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettleUpTab 
                records={accountingRecords} 
                fetching={fetchingAccounting} 
                onTransfer={handleTransfer} 
                players={players}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-neutral-900 py-12 px-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.5)] bg-black/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
          <div className="flex items-center gap-3 grayscale">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">M</div>
            <span className="font-bold tracking-tighter text-sm uppercase">Mahjong Analytics v2.0</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">
            Developed by Awesome Katie
          </p>
        </div>
      </footer>
    </div>
  );
}

function PositionCard({ 
  pos, 
  state, 
  allPlayers, 
  usedPlayers, 
  onTogglePlayer, 
  onUpdateChips,
  onSetChipValue,
  onUpdateDeltaChips,
  onSetDeltaChipValue,
  onSetMode,
  onSetManualScore,
  delta,
  isLoadingPlayers,
  fetchError
}: { 
  key?: string;
  pos: Position;
  state: PositionState;
  allPlayers: Player[];
  usedPlayers: Set<string>;
  onTogglePlayer: (name: string) => void;
  onUpdateChips: (type: keyof Chips, d: number) => void;
  onSetChipValue: (type: keyof Chips, v: number) => void;
  onUpdateDeltaChips: (type: keyof Chips, d: number) => void;
  onSetDeltaChipValue: (type: keyof Chips, v: number) => void;
  onSetMode: (mode: ScoreMode) => void;
  onSetManualScore: (v: number) => void;
  delta: number;
  isLoadingPlayers?: boolean;
  fetchError?: string | null;
}) {
  const windColor = {
    East: '#f59e0b',
    South: '#3b82f6',
    West: '#22c55e',
    North: '#f8fafc'
  }[pos];

  return (
    <motion.div 
      layout
      style={{ borderLeft: `4px solid ${windColor}` }}
      className="wind-card group hover:scale-[1.01]"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="pos-label">{pos} POSITION</span>
          <div className="flex items-center gap-1">
            <ModeButton active={state.mode === 'CHIPS'} onClick={() => onSetMode('CHIPS')} label="Total chips" />
            <ModeButton active={state.mode === 'DELTA'} onClick={() => onSetMode('DELTA')} label="Chip Delta" />
            <ModeButton active={state.mode === 'MANUAL'} onClick={() => onSetMode('MANUAL')} label="Manual" />
          </div>
        </div>
        <span className={cn(
          "score-display",
          delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-500" : "text-slate-500"
        )}>
          {delta > 0 ? '+' : ''}${delta.toFixed(2)}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {state.mode === 'MANUAL' ? (
          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col items-center gap-3">
             <span className="pos-label opacity-40">Enter Total Score</span>
             <div className="flex items-center gap-4">
               <button 
                  onClick={() => onSetManualScore(state.manualScore - 10)}
                  className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 active:scale-90 transition-all font-bold"
                >
                  -10
                </button>
                <input 
                  type="number"
                  value={state.manualScore}
                  onChange={(e) => onSetManualScore(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-black border border-white/10 rounded-xl text-center text-xl font-black p-3 text-white focus:ring-1 ring-blue-500 outline-none"
                  step="0.1"
                />
                <button 
                  onClick={() => onSetManualScore(state.manualScore + 10)}
                  className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 active:scale-90 transition-all font-bold"
                >
                  +10
                </button>
             </div>
             <p className="text-[10px] text-slate-500 italic">Delta will be Score - $200</p>
          </div>
        ) : state.mode === 'DELTA' ? (
          <div className="space-y-3 mt-2">
            {(Object.keys(CHIP_VALUES) as Array<keyof Chips>).map(type => (
              <div key={type} className="flex items-center gap-3 text-[12px] font-medium">
                <ChipIcon type={type} />
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onUpdateDeltaChips(type, -1)}
                    className="w-8 h-8 rounded-lg bg-neutral-900 shadow border border-white/5 flex items-center justify-center hover:bg-neutral-800 active:scale-90 transition-all font-black text-xs"
                  >
                    -
                  </button>
                  <input 
                    type="number"
                    value={state.deltaChips[type]}
                    onChange={(e) => onSetDeltaChipValue(type, parseInt(e.target.value) || 0)}
                    className="w-10 bg-black border border-white/5 rounded-lg text-center font-black p-1 text-xs text-white"
                  />
                  <button 
                    onClick={() => onUpdateDeltaChips(type, 1)}
                    className="w-8 h-8 rounded-lg bg-neutral-900 shadow border border-white/5 flex items-center justify-center hover:bg-neutral-800 active:scale-90 transition-all font-black text-xs"
                  >
                    +
                  </button>
                </div>
                <span className={cn("w-16 text-right font-black tracking-tight", state.deltaChips[type] > 0 ? "text-emerald-500" : state.deltaChips[type] < 0 ? "text-rose-500" : "text-white/20")}>
                  ${(state.deltaChips[type] * CHIP_VALUES[type]).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {(Object.keys(CHIP_VALUES) as Array<keyof Chips>).map(type => (
              <div key={type} className="flex items-center gap-3 text-[12px] font-medium">
                <ChipIcon type={type} />
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onUpdateChips(type, -1)}
                    className="w-8 h-8 rounded-lg bg-neutral-900 shadow border border-white/5 flex items-center justify-center hover:bg-neutral-800 active:scale-90 transition-all"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input 
                    type="number"
                    value={state.chips[type]}
                    onChange={(e) => onSetChipValue(type, parseInt(e.target.value) || 0)}
                    className="w-10 bg-black border border-white/5 rounded-lg text-center font-black p-1 text-xs text-white"
                    min="0"
                  />
                  <button 
                    onClick={() => onUpdateChips(type, 1)}
                    className="w-8 h-8 rounded-lg bg-neutral-900 shadow border border-white/5 flex items-center justify-center hover:bg-neutral-800 active:scale-90 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="w-16 text-right font-black tracking-tight text-white/50">
                  ${(state.chips[type] * CHIP_VALUES[type]).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="pos-label opacity-40">Select up to 2 Players</span>
            {isLoadingPlayers && <RotateCcw className="w-3 h-3 animate-spin text-slate-600" />}
          </div>
          
          <div className="grid grid-cols-5 gap-1 min-h-[32px] sm:grid-cols-6">
            {isLoadingPlayers ? (
              <div className="col-span-full py-4 flex items-center justify-center">
                 <RotateCcw className="w-5 h-5 animate-spin text-slate-700" />
              </div>
            ) : allPlayers && allPlayers.length > 0 ? (
              allPlayers.map((p) => {
                const isSelected = state.players.includes(p.name);
                const isUsedElsewhere = usedPlayers.has(p.name) && !isSelected;
                return (
                  <button
                    key={p.email || p.name}
                    disabled={isUsedElsewhere || (state.players.length >= 2 && !isSelected)}
                    onClick={() => onTogglePlayer(p.name)}
                    className={cn(
                      "px-1.5 rounded text-center text-[8px] font-black uppercase transition-all border leading-none h-6 flex items-center justify-center truncate",
                      isSelected 
                        ? "bg-slate-50 border-slate-50 text-slate-900 shadow-lg shadow-white/5" 
                        : isUsedElsewhere
                          ? "opacity-10 cursor-not-allowed grayscale border-transparent"
                          : "bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
                    )}
                    title={p.name}
                  >
                    {p.name.split(' ')[0]}
                  </button>
                );
              })
            ) : (
              <div className="col-span-full py-4 border border-dashed border-white/5 rounded-lg text-[10px] text-slate-600 italic text-center w-full space-y-2">
                <p>No players found.</p>
                {fetchError && (
                  <p className="text-rose-500 font-bold px-2">{fetchError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
function ChipIcon({ type }: { type: keyof Chips }) {
  return (
    <div className={cn(
      "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 shadow-lg",
      type === 'red' ? 'bg-rose-500 border-rose-400 text-white' :
      type === 'blue' ? 'bg-blue-600 border-blue-400 text-white' :
      type === 'green' ? 'bg-emerald-500 border-emerald-400 text-white' :
      'bg-slate-50 border-slate-200 text-slate-900'
    )}>
      <span className="text-[8px] font-black">C</span>
    </div>
  );
}

function ModeButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-[8px] font-black uppercase px-2 py-1 rounded-md border transition-all",
        active 
          ? "bg-blue-600 border-blue-500 text-white" 
          : "bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700"
      )}
    >
      {label}
    </button>
  );
}
