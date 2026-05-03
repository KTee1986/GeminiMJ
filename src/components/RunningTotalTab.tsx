import React from 'react';
import { ChevronRight, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface RunningTotalProps {
  data: Array<{
    name: string;
    games: number;
    totalScore: number;
  }>;
}

export const RunningTotalTab: React.FC<RunningTotalProps> = ({ data }) => {
  const maxAbsScore = Math.max(...data.map(d => Math.abs(d.totalScore)), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/20 shadow-[0_0_10px_-5px_rgba(59,130,246,0.5)]">
          <BarChart3 className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tighter text-white">LIFETIME EQUITY</h2>
          <p className="text-slate-500 text-[10px] font-medium italic leading-tight">Running totals based on $200 buy-ins</p>
        </div>
      </div>

      <div className="grid gap-2">
        {data.map((player, idx) => {
          const percentage = (Math.abs(player.totalScore) / maxAbsScore) * 100;
          return (
            <motion.div 
              key={player.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 hover:bg-neutral-800/80 hover:border-neutral-700 transition-all cursor-default"
            >
              <div className="w-8 h-8 rounded-lg bg-black border border-white/5 flex items-center justify-center font-black text-slate-600 group-hover:text-blue-500 transition-colors text-xs">
                {idx + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="font-black text-white uppercase text-[11px] tracking-tight truncate pr-2">{player.name}</h3>
                  <span className={cn(
                    "text-sm font-black tabular-nums tracking-tighter",
                    player.totalScore > 0 ? "text-emerald-400" : player.totalScore < 0 ? "text-rose-500" : "text-slate-500"
                  )}>
                    {player.totalScore > 0 ? '+' : ''}{player.totalScore.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-black rounded-full overflow-hidden border border-white/5 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={cn(
                        "h-full rounded-full transition-colors",
                        player.totalScore > 0 ? "bg-emerald-500" : "bg-rose-500"
                      )}
                    />
                  </div>
                  <span className="text-[8px] font-black text-slate-600 uppercase shrink-0">{player.games} SES</span>
                </div>
              </div>
              
              <ChevronRight className="w-4 h-4 text-neutral-800 group-hover:text-neutral-500 transition-colors" />
            </motion.div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="py-20 text-center text-slate-600 italic">No player data found.</div>
      )}
    </div>
  );
};
