import React, { useState } from 'react';
import { GameRecord } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface HistoryTabProps {
  logs: GameRecord[];
  fetching: boolean;
}

const PAGE_SIZE = 25;

export const HistoryTab: React.FC<HistoryTabProps> = ({ logs, fetching }) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (fetching) return <div className="py-20 flex justify-center text-slate-500 italic">Syncing with ledger...</div>;
  if (logs.length === 0) return <div className="py-20 text-center text-slate-600 italic">No records in audit trail.</div>;

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedLogs = logs.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-neutral-900/30 border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date/Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">East</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">South</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">West</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">North</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedLogs.map((log, idx) => (
                <tr key={`${log.gameId}-${startIndex + idx}`} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white uppercase tracking-tight">
                        {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <CompactSeat data={log.east} color="text-amber-500" />
                  <CompactSeat data={log.south} color="text-blue-500" />
                  <CompactSeat data={log.west} color="text-emerald-500" />
                  <CompactSeat data={log.north} color="text-slate-100" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {paginatedLogs.map((log, idx) => (
          <div key={`${log.gameId}-mob-${startIndex + idx}`} className="bg-neutral-900 border border-white/5 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                 {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
               </span>
               <span className="text-[10px] font-bold text-blue-500">
                 {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MobileSeatRow label="East" data={log.east} color="border-amber-500/50" />
              <MobileSeatRow label="South" data={log.south} color="border-blue-500/50" />
              <MobileSeatRow label="West" data={log.west} color="border-emerald-500/50" />
              <MobileSeatRow label="North" data={log.north} color="border-slate-500/50" />
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, logs.length)} / {logs.length} Records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-neutral-900 border border-white/5 text-slate-400 disabled:opacity-20 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-white tabular-nums px-2">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-neutral-900 border border-white/5 text-slate-400 disabled:opacity-20 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MobileSeatRow = ({ label, data, color }: { label: string; data: { player: string; score: string }; color: string }) => {
  const score = parseFloat(data.score);
  return (
    <div className={cn("border-l-2 pl-3 py-1", color)}>
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-black text-white uppercase truncate">{data.player}</p>
      <p className={cn("text-xs font-mono font-bold", score > 0 ? "text-emerald-500" : score < 0 ? "text-rose-500" : "text-slate-400")}>
        {score > 0 ? '+' : ''}{score.toFixed(1)}
      </p>
    </div>
  );
};

const CompactSeat = ({ data, color }: { data: { player: string; score: string }; color: string }) => {
  const score = parseFloat(data.score);
  return (
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center gap-3">
        <div className="flex flex-col min-w-[80px]">
          <span className="text-[11px] font-bold text-white truncate max-w-[100px]">{data.player}</span>
        </div>
        <span className={cn(
          "text-[13px] font-black tabular-nums min-w-[60px] text-right",
          score > 0 ? "text-emerald-400" : score < 0 ? "text-rose-500" : "text-slate-500"
        )}>
          {score > 0 ? '+' : ''}{score.toFixed(1)}
        </span>
      </div>
    </td>
  );
};
