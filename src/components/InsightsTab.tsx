import React, { useState, useMemo, useEffect } from 'react';
import { 
  Player, 
  GameRecord, 
  PlayerStatsDetailed 
} from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  Zap, 
  Heart, 
  Skull, 
  Activity, 
  BarChart2, 
  TrendingUp, 
  TrendingDown,
  Filter,
  User,
  Medal,
  Calendar,
  Lightbulb,
  Target
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface InsightsTabProps {
  history: GameRecord[];
  playerStats: Record<string, PlayerStatsDetailed>;
  currentUser?: string;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ history, playerStats, currentUser }) => {
  const allPlayers = useMemo(() => Object.keys(playerStats).sort(), [playerStats]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>(() => {
    if (currentUser && allPlayers.includes(currentUser)) return currentUser;
    return allPlayers.length > 0 ? allPlayers[0] : '';
  });

  const [showInGameRank, setShowInGameRank] = useState(false);
  const [showPartnerRank, setShowPartnerRank] = useState(false);

  const insights = useMemo(() => {
    if (!selectedPlayer || !playerStats[selectedPlayer]) return null;
    const p = playerStats[selectedPlayer];

    // Luckiest/Unluckiest Month
    const monthlyData = Object.entries(p.monthlyScores) as [string, { total: number; count: number }][];
    const months = monthlyData
      .map(([name, d]) => ({ name, avg: d.total / d.count }))
      .sort((a,b) => b.avg - a.avg);
    
    const luckiestMonth = months[0] || null;
    const unluckiestMonth = months[months.length - 1] || null;

    // Advanced Synergy Analysis from History
    const inGameStats: Record<string, { total: number; count: number }> = {};
    const partnerOnlyStats: Record<string, { total: number; count: number }> = {};

    const playerHistory = history.filter(h => {
      const seats = [h.east, h.south, h.west, h.north];
      return seats.some(s => s.player.split(' + ').map(n => n.trim()).includes(selectedPlayer));
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    playerHistory.forEach(game => {
      const seats = {
        East: game.east.player.split(' + ').map(n => n.trim()),
        South: game.south.player.split(' + ').map(n => n.trim()),
        West: game.west.player.split(' + ').map(n => n.trim()),
        North: game.north.player.split(' + ').map(n => n.trim())
      };

      const scores = {
        East: parseFloat(game.east.score),
        South: parseFloat(game.south.score),
        West: parseFloat(game.west.score),
        North: parseFloat(game.north.score)
      };

      // Find user's position
      let userPos: 'East' | 'South' | 'West' | 'North' | null = null;
      if (seats.East.includes(selectedPlayer)) userPos = 'East';
      else if (seats.South.includes(selectedPlayer)) userPos = 'South';
      else if (seats.West.includes(selectedPlayer)) userPos = 'West';
      else if (seats.North.includes(selectedPlayer)) userPos = 'North';

      if (!userPos) return;

      const userScore = scores[userPos];
      const partnerSeatMapping: Record<string, 'East' | 'South' | 'West' | 'North'> = {
        East: 'West',
        West: 'East',
        South: 'North',
        North: 'South'
      };
      
      const userPartnerSeat = partnerSeatMapping[userPos];

      // Track Presence (In game with)
      const allOtherPlayers = new Set<string>();
      Object.keys(seats).forEach(pos => {
        seats[pos as keyof typeof seats].forEach(name => {
          if (name !== selectedPlayer) allOtherPlayers.add(name);
        });
      });

      allOtherPlayers.forEach(other => {
        if (!inGameStats[other]) inGameStats[other] = { total: 0, count: 0 };
        inGameStats[other].total += userScore;
        inGameStats[other].count += 1;
      });

      // Track Partnership (True Partner Seat)
      seats[userPartnerSeat].forEach(partnerName => {
        if (!partnerOnlyStats[partnerName]) partnerOnlyStats[partnerName] = { total: 0, count: 0 };
        partnerOnlyStats[partnerName].total += userScore;
        partnerOnlyStats[partnerName].count += 1;
      });

      // Also track people sharing the user's seat
      seats[userPos].forEach(sharingName => {
        if (sharingName !== selectedPlayer) {
          if (!partnerOnlyStats[sharingName]) partnerOnlyStats[sharingName] = { total: 0, count: 0 };
          partnerOnlyStats[sharingName].total += userScore;
          partnerOnlyStats[sharingName].count += 1;
        }
      });
    });

    const inGameRank = Object.entries(inGameStats)
      .map(([name, d]) => ({ name, avg: d.total / d.count, count: d.count }))
      .sort((a,b) => b.avg - a.avg);

    const partnerRank = Object.entries(partnerOnlyStats)
      .map(([name, d]) => ({ name, avg: d.total / d.count, count: d.count }))
      .sort((a,b) => b.avg - a.avg);

    const bestInGame = inGameRank[0] || null;
    const worstInGame = inGameRank.length > 1 ? inGameRank[inGameRank.length - 1] : null;

    const bestPartner = partnerRank[0] || null;
    const worstPartner = partnerRank.length > 1 ? partnerRank[partnerRank.length - 1] : null;

    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let cumulative = 0;
    
    const timeline = playerHistory.map(h => {
      const seats = [h.east, h.south, h.west, h.north];
      const playerEntry = seats.find(s => s.player.split(' + ').map(n => n.trim()).includes(selectedPlayer));
      const score = playerEntry ? parseFloat(playerEntry.score) : 0;
      cumulative += score;
      
      if (score > 0) {
        currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
      } else if (score < 0) {
        currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
      } else {
        currentStreak = 0;
      }
      
      maxWinStreak = Math.max(maxWinStreak, currentStreak);
      maxLossStreak = Math.min(maxLossStreak, currentStreak);
      
      return {
        date: new Date(h.timestamp).toLocaleDateString(),
        cumulative
      };
    });

    const fieldAvgWhenIn = p.inGamesStats.totalFieldScore / (p.inGamesStats.count * 4); 

    return {
      bestInGame,
      worstInGame,
      bestPartner,
      worstPartner,
      inGameRank,
      partnerRank,
      monthlyChart: [...months].sort((a,b) => a.name.localeCompare(b.name)),
      fieldAvgWhenIn,
      maxWinStreak,
      maxLossStreak: Math.abs(maxLossStreak),
      timeline,
      volatility: timeline.length > 1 ? Math.sqrt(playerHistory.reduce((acc, h) => {
          const seats = [h.east, h.south, h.west, h.north];
          const playerEntry = seats.find(s => s.player.split(' + ').map(n => n.trim()).includes(selectedPlayer));
          const s = playerEntry ? parseFloat(playerEntry.score) : 0;
          return acc + Math.pow(s - (p.totalScore/p.games), 2);
      }, 0) / timeline.length) : 0
    };
  }, [selectedPlayer, playerStats, history]);

  if (!insights) {
    return (
      <div className="py-20 text-center text-slate-600 bg-neutral-900/30 border border-white/5 rounded-[2.5rem] flex flex-col items-center gap-4">
        <Lightbulb className="w-12 h-12 text-slate-800" />
        <div>
          <p className="text-sm font-black uppercase tracking-widest">No Intelligence Gathered</p>
          <p className="text-xs font-medium opacity-50 mt-1">Select a player or change audit scope to begin analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 bg-neutral-900 border border-neutral-800 p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-xl">
        <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
           <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-3x-l bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shrink-0">
             <User className="w-6 h-6 md:w-8 md:h-8" />
           </div>
           <div>
              <h2 className="text-xl md:text-3xl font-black tracking-tighter text-white uppercase italic leading-tight">Audit Deep Dive</h2>
              <p className="text-slate-500 text-[10px] md:text-sm font-medium">Relational analytics for {selectedPlayer}</p>
           </div>
        </div>
        
        <div className="relative w-full md:w-64 group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
          <select 
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="w-full bg-black border border-neutral-700 rounded-xl md:rounded-2xl font-black text-white py-3 md:py-4 pl-10 md:pl-12 pr-4 uppercase tracking-widest text-[10px] md:text-xs outline-none focus:ring-1 ring-blue-500 transition-all appearance-none cursor-pointer"
          >
            {allPlayers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <InsightCard 
          label="Best in Game" 
          value={insights.bestInGame?.name || 'N/A'} 
          sub={`$${insights.bestInGame?.avg.toFixed(2) || '0'} Synergy`} 
          icon={TrendingUp} color="bg-emerald-500"
        />
        <InsightCard 
          label="Worst in Game" 
          value={insights.worstInGame?.name || 'N/A'} 
          sub={`${insights.worstInGame?.avg.toFixed(2) || '0'} Negative Synergy`} 
          icon={TrendingDown} color="bg-rose-500"
        />
        <InsightCard 
          label="Best Partner" 
          value={insights.bestPartner?.name || 'N/A'} 
          sub={`$${insights.bestPartner?.avg.toFixed(2) || '0'} Yield`} 
          icon={Heart} color="bg-blue-500"
        />
        <InsightCard 
          label="Worst Partner" 
          value={insights.worstPartner?.name || 'N/A'} 
          sub={`${insights.worstPartner?.avg.toFixed(2) || '0'} Yield`} 
          icon={Skull} color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 shadow-2xl overflow-hidden">
            <button 
              onClick={() => setShowInGameRank(!showInGameRank)}
              className="w-full flex items-center justify-between group"
            >
              <h3 className="text-[10px] md:text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" /> Performance Ranking when in game with
              </h3>
              <div className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 group-hover:bg-white/5 transition-all flex items-center gap-2", showInGameRank ? "text-blue-500 border-blue-500/20" : "text-slate-500")}>
                {showInGameRank ? 'Collapse' : 'Expand'}
              </div>
            </button>
            
            <motion.div 
              initial={false}
              animate={{ height: showInGameRank ? 'auto' : 0, opacity: showInGameRank ? 1 : 0, marginTop: showInGameRank ? 32 : 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {insights.inGameRank.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between p-4 rounded-2xl bg-black/50 border border-white/5 hover:border-emerald-500/20 transition-all group">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:text-emerald-500 transition-colors shrink-0">
                          {String(i+1).padStart(2, '0')}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-black text-white uppercase block truncate">{p.name}</span>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{p.count} G Presence</span>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "text-sm font-black tabular-nums block",
                        p.avg > 0 ? "text-emerald-400" : p.avg < 0 ? "text-rose-500" : "text-slate-400"
                      )}>
                        {p.avg > 0 ? '+' : ''}{p.avg.toFixed(2)}
                      </span>
                      <p className="text-[8px] font-bold text-slate-700 uppercase">Avg Yield</p>
                    </div>
                  </div>
                ))}
              </div>
              {insights.inGameRank.length === 0 && (
                <p className="text-center py-10 text-xs italic text-slate-600 uppercase tracking-widest">No Interaction Data Collected</p>
              )}
            </motion.div>
         </div>

         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 shadow-2xl overflow-hidden">
            <button 
              onClick={() => setShowPartnerRank(!showPartnerRank)}
              className="w-full flex items-center justify-between group"
            >
              <h3 className="text-[10px] md:text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" /> Performance Ranking when partner with
              </h3>
              <div className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 group-hover:bg-white/5 transition-all flex items-center gap-2", showPartnerRank ? "text-blue-500 border-blue-500/20" : "text-slate-500")}>
                {showPartnerRank ? 'Collapse' : 'Expand'}
              </div>
            </button>

            <motion.div 
              initial={false}
              animate={{ height: showPartnerRank ? 'auto' : 0, opacity: showPartnerRank ? 1 : 0, marginTop: showPartnerRank ? 32 : 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {insights.partnerRank.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between p-4 rounded-2xl bg-black/50 border border-white/5 hover:border-blue-500/20 transition-all group">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:text-blue-500 transition-colors shrink-0">
                          {String(i+1).padStart(2, '0')}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-black text-white uppercase block truncate">{p.name}</span>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{p.count} Partnerships</span>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "text-sm font-black tabular-nums block",
                        p.avg > 0 ? "text-emerald-400" : p.avg < 0 ? "text-rose-500" : "text-slate-400"
                      )}>
                        {p.avg > 0 ? '+' : ''}{p.avg.toFixed(2)}
                      </span>
                      <p className="text-[8px] font-bold text-slate-700 uppercase">Avg Yield</p>
                    </div>
                  </div>
                ))}
              </div>
              {insights.partnerRank.length === 0 && (
                <p className="text-center py-10 text-xs italic text-slate-600 uppercase tracking-widest">No Partnership Data Recorded</p>
              )}
            </motion.div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 md:gap-8">
         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 h-[350px] md:h-[450px] shadow-2xl">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
               <Calendar className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />
               <h3 className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest">Temporal Variance Per Month</h3>
            </div>
            <ResponsiveContainer width="100%" height="80%">
               <BarChart data={insights.monthlyChart} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                  <XAxis dataKey="name" fontSize={8} stroke="#444" axisLine={false} tickLine={false} dy={5} />
                  <YAxis fontSize={8} stroke="#444" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px' }} />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {insights.monthlyChart.map((entry, idx) => (
                      <Cell key={idx} fill={entry.avg > 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 h-[350px] shadow-2xl">
         <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest">Cumulative Equity Audit</h3>
         </div>
         <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={insights.timeline} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
               <defs>
                  <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
               <XAxis dataKey="date" hide />
               <YAxis fontSize={8} stroke="#444" axisLine={false} tickLine={false} />
               <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px' }} />
               <Area type="monotone" dataKey="cumulative" stroke="#10b981" fillOpacity={1} fill="url(#colorCum)" strokeWidth={3} />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};

 const InsightCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl md:rounded-3xl p-4 md:p-6 hover:border-neutral-700 transition-all border-l-[4px] md:border-l-[6px] border-l-transparent hover:border-l-blue-500">
    <div className="flex items-center justify-between mb-3 md:mb-5">
      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-slate-500 leading-none truncate pr-1">{label}</span>
      <div className={cn("p-1 md:p-1.5 rounded-lg text-white shrink-0", color)}>
        <Icon className="w-2.5 h-2.5 md:w-3 h-3" />
      </div>
    </div>
    <div className="space-y-0.5 md:space-y-1">
      <h4 className="text-base md:text-2xl font-black text-white uppercase truncate tracking-tighter leading-tight">{value}</h4>
      <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase truncate leading-none">{sub}</p>
    </div>
  </div>
);

const StatsListCard = ({ title, data, icon: Icon }: any) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8">
    <h3 className="text-[10px] md:text-xs font-black uppercase text-slate-500 mb-4 md:mb-6 tracking-widest flex items-center gap-2">
      <Icon className="w-3 h-3 md:w-4 md:h-4" /> {title}
    </h3>
    <div className="space-y-1.5 md:space-y-2">
      {data.map((p: any, i: number) => (
        <div key={p.name} className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-black border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-[9px] md:text-[10px] font-black text-slate-700 tabular-nums">{String(i+1).padStart(2, '0')}</span>
            <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-tight truncate max-w-[120px] md:max-w-none">{p.name} <span className="text-[8px] md:text-[9px] text-slate-600 font-bold ml-1">({p.count})</span></span>
          </div>
          <span className={cn("text-[11px] md:text-sm font-black tabular-nums", p.avg > 0 ? "text-emerald-500" : "text-rose-500")}>
            {p.avg > 0 ? '+' : ''}{p.avg.toFixed(2)}
          </span>
        </div>
      ))}
      {data.length === 0 && <p className="text-center py-6 md:py-10 text-[10px] md:text-xs italic text-slate-600">No partner data recorded.</p>}
    </div>
  </div>
);

const InsightSimpleRow = ({ label, value, sub, icon: Icon }: any) => (
  <div className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-black border border-white/5">
    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/5 flex items-center justify-center text-slate-500 shrink-0">
        <Icon className="w-3 h-3 md:w-4 md:h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1 truncate">{label}</p>
        <p className="text-[10px] md:text-xs font-black text-white uppercase truncate">{value}</p>
      </div>
    </div>
    <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase shrink-0 ml-2">{sub}</span>
  </div>
);
