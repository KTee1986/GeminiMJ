import React from 'react';
import { User, Mail } from 'lucide-react';
import { Player } from '../types';

interface PlayerListTabProps {
  players: Player[];
  fetching: boolean;
}

export const PlayerListTab: React.FC<PlayerListTabProps> = ({ players, fetching }) => {
  if (fetching) return <div className="py-20 flex justify-center text-slate-500 italic">Accessing directory...</div>;
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">Player Directory</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map(p => (
          <div key={p.email} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex items-center gap-6 hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full translate-x-8 -translate-y-8" />
            
            <div className="w-14 h-14 rounded-2xl bg-black border border-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-xl">
               <User className="w-7 h-7 text-slate-500 group-hover:text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-white uppercase tracking-tight text-lg mb-1 truncate">{p.name}</h3>
              <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-400 transition-colors mb-2">
                <Mail className="w-3 h-3" />
                <p className="text-[10px] font-bold uppercase tracking-widest truncate">{p.email}</p>
              </div>
              {p.group && (
                <div className="inline-flex items-center px-2 py-0.5 rounded bg-blue-600/20 border border-blue-500/20 text-[9px] font-black uppercase text-blue-400 tracking-widest">
                  {p.group}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
