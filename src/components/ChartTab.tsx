import React, { useState, useMemo, useEffect } from 'react';
import { GameRecord } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChartTabProps {
  history: GameRecord[];
}

export const ChartTab: React.FC<ChartTabProps> = ({ history }) => {
  const allPlayers = useMemo(() => {
    const set = new Set<string>();
    history.forEach(h => {
      [h.east, h.south, h.west, h.north].forEach(s => {
        s.player.split(' + ').forEach(p => set.add(p.trim()));
      });
    });
    return Array.from(set).sort();
  }, [history]);

  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const chartData = useMemo(() => {
    const running: Record<string, number> = {};
    // Chronological order for chart
    return [...history].reverse().map((game, idx) => {
      const data: any = { 
        index: idx + 1,
        date: new Date(game.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
      
      [game.east, game.south, game.west, game.north].forEach(seat => {
        const score = parseFloat(seat.score);
        seat.player.split(' + ').forEach(p => {
          const name = p.trim();
          running[name] = (running[name] || 0) + score;
        });
      });

      allPlayers.forEach(p => {
        data[p] = running[p] || 0;
      });
      return data;
    });
  }, [history, allPlayers]);

  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f43f5e', // rose
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#f97316'  // orange
  ];

  const togglePlayer = (name: string) => {
    setSelectedPlayers(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">Growth Projection</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium">Cumulative performance tracking over time</p>
        </div>
        
        <div className="flex flex-wrap gap-1.5 justify-end max-w-xl">
          {allPlayers.map((p, idx) => {
            const isSelected = selectedPlayers.includes(p);
            const color = colors[idx % colors.length];
            return (
              <button 
                key={p}
                onClick={() => togglePlayer(p)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border",
                  isSelected 
                    ? "bg-white border-white text-black shadow-lg" 
                    : "bg-neutral-900 border-neutral-800 text-slate-500 hover:border-neutral-600 hover:text-slate-300"
                )}
              >
                {isSelected ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" style={{ color: isSelected ? 'black' : color }} />}
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden h-[500px]">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#444" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#444" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `$${v}`}
              dx={-5}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #222', 
                borderRadius: '16px',
                padding: '12px'
              }}
              itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
              labelStyle={{ fontSize: '11px', color: '#666', marginBottom: '8px', fontWeight: 'black' }}
            />
            <Legend 
              verticalAlign="top" 
              align="left"
              iconType="circle" 
              wrapperStyle={{ paddingBottom: '40px', fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase' }}
            />
            {selectedPlayers.map((p, idx) => {
              const color = colors[allPlayers.indexOf(p) % colors.length];
              return (
                <Line 
                  key={p} 
                  type="monotone" 
                  dataKey={p} 
                  stroke={color} 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }}
                  animationDuration={1500}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
