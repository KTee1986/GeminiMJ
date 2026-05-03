import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { PlayerStatsDetailed } from '../types';

interface StatsTabProps {
  stats: Record<string, PlayerStatsDetailed>;
}

export const StatsTab: React.FC<StatsTabProps> = ({ stats }) => {
  const statsArray = Object.values(stats) as PlayerStatsDetailed[];
  const sortedStats = statsArray.sort((a, b) => b.games - a.games);

  return (
    <div className="space-y-6">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5">
              <tr>
                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Player Profile</th>
                <th className="p-3 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">Sessions</th>
                <th className="p-3 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">Win Rate</th>
                <th className="p-3 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Delta</th>
                <th className="p-3 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">Peak</th>
                <th className="p-3 text-center text-[9px] font-black uppercase tracking-widest text-slate-500">Pitfall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedStats.map((p, idx) => {
                const winRate = (p.wins / p.games) * 100;
                const avg = p.totalScore / p.games;
                return (
                  <tr key={p.name} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-600 w-6 tabular-nums italic shrink-0">#{idx + 1}</span>
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-black text-[9px] text-white">
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-bold text-white uppercase text-[10px] tracking-tight">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-[10px] font-black text-slate-400 tabular-nums">{p.games}</td>
                    <td className="p-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={cn(
                          "text-[10px] font-black tabular-nums",
                          winRate >= 50 ? "text-emerald-400" : "text-slate-400"
                        )}>{winRate.toFixed(1)}%</span>
                        <div className="w-12 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${winRate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                       <span className={cn(
                         "text-[10px] font-black tabular-nums",
                         avg > 0 ? "text-emerald-400" : avg < 0 ? "text-rose-500" : "text-slate-500"
                       )}>{avg > 0 ? '+' : ''}{avg.toFixed(2)}</span>
                    </td>
                    <td className="p-3 text-center">
                       <div className="flex items-center justify-center gap-1 text-[10px] font-black text-emerald-500 tabular-nums">
                         +{p.highest.toFixed(1)}
                       </div>
                    </td>
                    <td className="p-3 text-center">
                       <div className="flex items-center justify-center gap-1 text-[10px] font-black text-rose-500 tabular-nums">
                         {p.lowest.toFixed(1)}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Condensed View */}
      <div className="grid grid-cols-1 gap-1.5 md:hidden">
        {sortedStats.map((p, idx) => {
          const winRate = (p.wins / p.games) * 100;
          const avg = p.totalScore / p.games;
          return (
            <div key={p.name} className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-2 w-1/3 min-w-0">
                <span className="text-[8px] font-black text-slate-700 italic shrink-0">#{idx + 1}</span>
                <span className="font-black text-white uppercase text-[10px] tracking-tight truncate leading-none">{p.name}</span>
              </div>
              
              <div className="flex flex-1 items-center justify-end gap-3 text-right">
                <div className="shrink-0">
                  <p className="text-[7px] font-bold text-slate-600 uppercase tracking-tighter leading-none mb-0.5">Delta</p>
                  <p className={cn(
                    "text-[10px] font-black tabular-nums leading-none",
                    avg > 0 ? "text-emerald-500" : avg < 0 ? "text-rose-500" : "text-slate-500"
                  )}>{avg > 0 ? '+' : ''}{avg.toFixed(1)}</p>
                </div>
                <div className="shrink-0">
                  <p className="text-[7px] font-bold text-slate-600 uppercase tracking-tighter leading-none mb-0.5">Win%</p>
                  <p className="text-[10px] font-black text-white leading-none tabular-nums">{winRate.toFixed(0)}%</p>
                </div>
                <div className="shrink-0">
                  <p className="text-[7px] font-bold text-slate-600 uppercase tracking-tighter leading-none mb-0.5">Sess</p>
                  <p className="text-[10px] font-black text-slate-400 leading-none tabular-nums">{p.games}</p>
                </div>
                <div className="shrink-0 w-8">
                  <p className="text-[7px] font-bold text-slate-600 uppercase tracking-tighter leading-none mb-0.5">Peak</p>
                  <p className="text-[9px] font-black text-emerald-500 leading-none tabular-nums">+{p.highest.toFixed(0)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryTile 
          title="Most Active" 
          value={sortedStats[0]?.name || 'N/A'}
          sub={`${sortedStats[0]?.games || 0} Games Logged`}
          icon={Activity}
          color="text-blue-500"
        />
        <SummaryTile 
          title="Season MVP" 
          value={statsArray.sort((a,b) => (b.totalScore/b.games) - (a.totalScore/a.games))[0]?.name || 'N/A'}
          sub={`$${(statsArray.sort((a,b) => (b.totalScore/b.games) - (a.totalScore/a.games))[0]?.totalScore / statsArray.sort((a,b) => (b.totalScore/b.games) - (a.totalScore/a.games))[0]?.games || 0).toFixed(2)} Avg`}
          icon={Trophy}
          color="text-emerald-500"
        />
        <SummaryTile 
          title="Highest Reliability" 
          value={statsArray.sort((a,b) => (b.wins/b.games) - (a.wins/a.games))[0]?.name || 'N/A'}
          sub={`${((statsArray.sort((a,b) => (b.wins/b.games) - (a.wins/a.games))[0]?.wins / statsArray.sort((a,b) => (b.wins/b.games) - (a.wins/a.games))[0]?.games || 0) * 100).toFixed(1)}% Win Rate`}
          icon={TrendingUp}
          color="text-amber-500"
        />
      </div>
    </div>
  );
};

const SummaryTile = ({ title, value, sub, icon: Icon, color }: any) => (
  <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
    <div className="flex items-center gap-2 mb-2">
      <div className={cn("p-1.5 bg-white/5 rounded-md", color)}>
        <Icon className="w-3 h-3" />
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{title}</span>
    </div>
    <h4 className="text-sm font-black text-white uppercase truncate">{value}</h4>
    <p className="text-[9px] font-bold text-slate-500 uppercase">{sub}</p>
  </div>
);
