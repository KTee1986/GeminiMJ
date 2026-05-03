import React, { useState, useMemo } from 'react';
import { AccountingRecord, GroupBalance, Player } from '../types';
import { RefreshCw, ArrowRightLeft, TrendingUp, TrendingDown, Info, Send } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettleUpTabProps {
  records: AccountingRecord[];
  fetching: boolean;
  onTransfer: (from: string, to: string, amount: number, comment?: string) => Promise<void>;
  players: Player[];
}

export const SettleUpTab: React.FC<SettleUpTabProps> = ({ records, fetching, onTransfer, players }) => {
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [confirmingIdx, setConfirmingIdx] = useState<number | null>(null);

  const groupBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    
    // Create a mapping from player name to group name
    const playerToGroup = new Map<string, string>();
    players.forEach(p => {
      // Normalize name for lookup
      const normalizedName = p.name.trim().toLowerCase();
      playerToGroup.set(normalizedName, p.group ? p.group.trim() : p.name.trim());
    });

    records.forEach(r => {
      // Check if the "group" field in record matches a player name (from game splits)
      // or if it matches a group name directly (from transfers/old records)
      const entity = r.group.trim();
      const entityLower = entity.toLowerCase();
      
      let targetGroup = entity;
      if (playerToGroup.has(entityLower)) {
        targetGroup = playerToGroup.get(entityLower)!;
      }

      balances[targetGroup] = (balances[targetGroup] || 0) + r.amount;
    });

    return Object.entries(balances)
      .map(([group, balance]) => ({ group, balance }))
      .sort((a, b) => b.balance - a.balance);
  }, [records, players]);

  const suggestions = useMemo(() => {
    const debtors = groupBalances.filter(b => b.balance < -0.01).map(b => ({ ...b, abs: Math.abs(b.balance) }));
    const creditors = groupBalances.filter(b => b.balance > 0.01).map(b => ({ ...b }));
    
    const results: { from: string; to: string; amount: number }[] = [];
    
    let dIdx = 0;
    let cIdx = 0;
    
    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      
      const settleAmount = Math.min(debtor.abs, creditor.balance);
      
      results.push({ from: debtor.group, to: creditor.group, amount: settleAmount });
      
      debtor.abs -= settleAmount;
      creditor.balance -= settleAmount;
      
      if (debtor.abs < 0.01) dIdx++;
      if (creditor.balance < 0.01) cIdx++;
    }
    
    return results;
  }, [groupBalances]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFrom || !transferTo || !amount || parseFloat(amount) <= 0) return;
    if (transferFrom === transferTo) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await onTransfer(transferFrom, transferTo, parseFloat(amount), comment || 'Manual Transfer');
      setAmount('');
      setComment('');
      setTransferFrom('');
      setTransferTo('');
      setSuccess('Manual transfer recorded successfully');
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e.message || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) return <div className="py-20 flex justify-center text-slate-500 italic">Calculating debts...</div>;

  return (
    <div className="space-y-6 md:space-y-8 pb-10 md:pb-20">
      {/* Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {groupBalances.map((gb, idx) => (
          <div key={`${gb.group}-${idx}`} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden group">
            <div className={cn(
              "absolute top-0 right-0 w-1 h-full",
              gb.balance > 0 ? "bg-emerald-500" : gb.balance < 0 ? "bg-rose-500" : "bg-slate-500"
            )} />
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Group Entity</span>
              {gb.balance > 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
            </div>
            <h4 className="text-xl font-black text-white uppercase tracking-tight truncate mb-1">{gb.group}</h4>
            <div className={cn(
              "text-3xl font-black tabular-nums tracking-tighter",
              gb.balance > 0 ? "text-emerald-400" : gb.balance < 0 ? "text-rose-500" : "text-white"
            )}>
              {gb.balance > 0 ? '+' : ''}{gb.balance.toFixed(2)}
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase mt-2">
              {gb.balance > 0 ? 'Owed to this group' : gb.balance < 0 ? 'Owed by this group' : 'Perfect Equilibrium'}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Settle Up Suggestions */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <RefreshCw className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-black uppercase text-white tracking-widest leading-none">Optimal Settlements</h3>
          </div>
          
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={`${s.from}-${s.to}-${s.amount}-${i}`} className="bg-black border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0 w-full sm:w-auto">
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Debtor</p>
                    <p className="text-xs font-black text-white uppercase truncate">{s.from}</p>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <p className="text-[10px] font-bold text-slate-500 mb-1 leading-none">PAYS</p>
                    <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Creditor</p>
                    <p className="text-xs font-black text-white uppercase truncate">{s.to}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-6 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-6">
                  <div className="shrink-0">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount</p>
                    <p className="text-base font-black text-white tabular-nums">${s.amount.toFixed(2)}</p>
                  </div>
                  
                  {confirmingIdx === i ? (
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest text-center">Confirm Transfer?</p>
                      <div className="flex gap-2">
                        <button
                          disabled={submitting}
                          onClick={() => setConfirmingIdx(null)}
                          className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          No
                        </button>
                        <button
                          disabled={submitting}
                          onClick={async () => {
                            setSubmitting(true);
                            try {
                              setError(null);
                              setSuccess(null);
                              await onTransfer(s.from, s.to, s.amount, 'Optimal Settlement Transfer');
                              setConfirmingIdx(null);
                              setSuccess(`Successfully logged $${s.amount.toFixed(2)} transfer`);
                              setTimeout(() => setSuccess(null), 5000);
                            } catch (e: any) {
                              setError(e.message || 'Settlement failed');
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
                        >
                          {submitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Yes, Log"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      disabled={submitting || (confirmingIdx !== null)}
                      onClick={() => setConfirmingIdx(i)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", submitting && confirmingIdx === i && "animate-spin")} />
                      <span>Settle Now</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {suggestions.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Info className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-slate-500 font-bold uppercase text-xs">All accounts reconciled</p>
              </div>
            )}
            
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold p-3 rounded-xl mt-4 uppercase tracking-widest text-center">
                Error: {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold p-3 rounded-xl mt-4 uppercase tracking-widest text-center">
                {success}
              </div>
            )}
          </div>
        </div>

        {/* Transfer Form */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 shadow-2xl flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Send className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-black uppercase text-white tracking-widest leading-none">Manual Account Injection</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 flex-1">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Origin Group</label>
                <select 
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-2xl p-4 text-white font-bold uppercase text-xs focus:ring-1 ring-blue-500 outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select Origin...</option>
                  {groupBalances.map((gb, idx) => <option key={`${gb.group}-origin-${idx}`} value={gb.group}>{gb.group}</option>)}
                </select>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-neutral-800 p-2 rounded-full border border-neutral-700 shadow-lg">
                  <ArrowRightLeft className="w-4 h-4 text-blue-500 rotate-90" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Destination Group</label>
                <select 
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-2xl p-4 text-white font-bold uppercase text-xs focus:ring-1 ring-blue-500 outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select Destination...</option>
                  {groupBalances.map((gb, idx) => <option key={`${gb.group}-dest-${idx}`} value={gb.group}>{gb.group}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Amount ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black border border-neutral-700 rounded-2xl p-4 text-white font-bold text-center text-2xl focus:ring-1 ring-emerald-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Reason / Comment</label>
                <input 
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Manual Transfer"
                  className="w-full bg-black border border-neutral-700 rounded-2xl p-4 text-white font-bold text-xs focus:ring-1 ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-4 mt-auto">
              <button
                type="submit"
                disabled={submitting || !transferFrom || !transferTo || !amount || transferFrom === transferTo}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-slate-600 rounded-3xl text-white font-black uppercase text-sm tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {submitting ? 'Processing Transaction...' : (
                  <>
                    <Send className="w-5 h-5" />
                    Record Ledger Transfer
                  </>
                )}
              </button>
              {transferFrom && transferTo && transferFrom === transferTo && (
                <p className="text-[10px] text-rose-500 font-bold text-center mt-3 uppercase">Origin and destination must be unique</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
