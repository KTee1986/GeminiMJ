import React, { useState } from 'react';
import { AccountingRecord } from '../types';
import { ChevronLeft, ChevronRight, Hash, Calendar, Users, DollarSign, User } from 'lucide-react';

interface AccountingHistoryTabProps {
  records: AccountingRecord[];
  fetching: boolean;
}

const PAGE_SIZE = 50;

export const AccountingHistoryTab: React.FC<AccountingHistoryTabProps> = ({ records, fetching }) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (fetching) return <div className="py-20 flex justify-center text-slate-500 italic">Syncing with ledger...</div>;
  if (records.length === 0) return <div className="py-20 text-center text-slate-600 italic">No accounting records found.</div>;

  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = records.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Desktop View */}
      <div className="hidden md:block bg-neutral-900/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <div className="flex items-center gap-2"><Hash className="w-3 h-3" /> Entry ID</div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> Timestamp</div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <div className="flex items-center gap-2"><Users className="w-3 h-3" /> Group Entity</div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <div className="flex items-center gap-2"><User className="w-3 h-3" /> User</div>
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <div className="flex items-center gap-2 justify-end"><DollarSign className="w-3 h-3" /> Yield</div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 max-w-[150px]">
                  Comment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {paginated.map((record, i) => (
                <tr key={`${record.gameId}-${record.group}-${startIndex + i}`} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      {record.gameId.startsWith('transfer-') ? (
                        <span className="text-blue-400">TRANSFER</span>
                      ) : (
                        `RECORD-${record.gameId.slice(-6)}`
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="text-xs font-black text-white uppercase tracking-tight">
                      {record.group}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {record.user || 'System'}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right">
                    <span className={`text-sm font-black tabular-nums ${record.amount > 0 ? 'text-emerald-400' : record.amount < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                      {record.amount > 0 ? '+' : ''}{record.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight truncate max-w-[150px] block">
                      {record.comment || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {paginated.map((record, i) => (
          <div key={`${record.gameId}-mob-${startIndex + i}`} className="bg-neutral-900 border border-white/5 rounded-2xl p-4 space-y-3">
             <div className="flex justify-between items-start border-b border-white/5 pb-2">
               <div>
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{record.gameId.startsWith('transfer-') ? 'Type: Transfer' : 'Type: Game Record'}</p>
                 <p className="text-[10px] font-black text-white uppercase">{record.group}</p>
               </div>
               <div className="text-right">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{new Date(record.timestamp).toLocaleDateString()}</p>
                 <span className={`text-sm font-black tabular-nums ${record.amount > 0 ? 'text-emerald-400' : record.amount < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                   {record.amount > 0 ? '+' : ''}{record.amount.toFixed(2)}
                 </span>
               </div>
             </div>
             <div className="flex justify-between items-end">
               <div className="flex-1 min-w-0 pr-4">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Comment</p>
                 <p className="text-[10px] font-bold text-white uppercase truncate">{record.comment || 'No comment'}</p>
               </div>
               <div className="text-right shrink-0">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">By</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase">{record.user || 'System'}</p>
               </div>
             </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Audit Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-neutral-900 border border-white/5 text-slate-400 disabled:opacity-20 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
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
