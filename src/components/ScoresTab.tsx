import React, { useState, useEffect } from 'react';
import { Search, Table, RefreshCw, AlertCircle } from 'lucide-react';

export const ScoresTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string>('');
  const [rows, setRows] = useState<string[][]>([]);
  const [search, setSearch] = useState('');

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scores');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      setSheetName(data.sheetName || 'Score');
      setRows(data.rows || []);
    } catch (err: any) {
      console.error('Error fetching scores:', err);
      setError(err.message || 'Failed to fetch scores tab.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const headers = rows[0] || [];
  const dataRows = rows.slice(1) || [];

  // Filter rows based on search query
  const filteredRows = dataRows.filter((row) => {
    if (!search.trim()) return true;
    return row.some((cell) =>
      String(cell || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/20 shadow-[0_0_10px_-5px_rgba(59,130,246,0.5)]">
            <Table className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-white uppercase italic">
              SCORES DATA
            </h2>
            <p className="text-slate-500 text-[10px] font-medium leading-tight">
              Viewing sheet tab: <span className="font-bold text-blue-400">"{sheetName || 'Score'}"</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchScores}
            disabled={loading}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-slate-400 hover:text-white hover:border-neutral-700 transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search scores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-full md:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">
            FETCHING GOOGLE SHEET SCORES...
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex flex-col items-center text-center gap-4 max-w-xl mx-auto my-12">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg mb-1">Could Not Access Scores</h3>
            <p className="text-slate-400 text-xs font-mono">{error}</p>
          </div>
          <button
            onClick={fetchScores}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wider shadow-lg shadow-rose-950/50"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Data display */}
      {!loading && !error && rows.length === 0 && (
        <div className="py-20 text-center text-slate-600 italic">
          No records or rows found in the scores tab.
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-950/80 border-b border-neutral-800">
                  {headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono"
                    >
                      {header || `Column ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filteredRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-neutral-800/30 transition-colors"
                  >
                    {headers.map((_, cIdx) => {
                      const cellVal = row[cIdx] || '';
                      // Highlight numbers nicely
                      const isNumber = !isNaN(Number(cellVal)) && cellVal.trim() !== '';
                      const numVal = Number(cellVal);
                      return (
                        <td
                          key={cIdx}
                          className={`px-4 py-3 text-xs ${
                            isNumber
                              ? numVal > 0
                                ? 'text-emerald-400 font-semibold font-mono'
                                : numVal < 0
                                ? 'text-rose-500 font-semibold font-mono'
                                : 'text-slate-300 font-mono'
                              : 'text-slate-300 font-medium'
                          }`}
                        >
                          {cellVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-neutral-950/50 border-t border-neutral-800 text-right">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              Total Entries: {filteredRows.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
