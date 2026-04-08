'use client';

import { useState } from 'react';
import { Search, ArrowUpCircle, ArrowDownCircle, Activity } from 'lucide-react';

export default function Dashboard() {
  const [symbolInput, setSymbolInput] = useState('SSI');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPerformance = async (symbol: string) => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/sieutinhieu/performance?symbol=${symbol}`);
      const json = await res.json();
      
      if (json.success && json.data) {
        setPerformanceData(json.data);
      } else {
        setError('Không tìm thấy dữ liệu cho mã này.');
        setPerformanceData(null);
      }
    } catch (e) {
      setError('Lỗi kết nối API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPerformance(symbolInput);
  };

  // Lấy tín hiệu mới nhất từ mảng trades (nếu có)
  const latestTrade = performanceData?.trades?.[0];

  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-200 p-4 md:p-8 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Form Tìm kiếm */}
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
            placeholder="Nhập mã CP (VD: HPG, SSI...)"
            className="w-full bg-[#1e293b] border border-gray-700 rounded-xl py-3 px-4 pl-12 text-white focus:outline-none focus:border-blue-500 font-bold uppercase tracking-widest"
          />
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <button 
            type="submit"
            className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg text-sm font-semibold transition"
          >
            Tìm
          </button>
        </form>

        {loading && <p className="text-center text-gray-400 animate-pulse">Đang tải dữ liệu...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {performanceData && !loading && (
          <div className="bg-[#151b28] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header Tín hiệu */}
            <div className="p-4 border-b border-gray-800 flex items-center gap-2 text-sm font-semibold text-gray-400">
              <Activity size={16} /> TÍN HIỆU & KẾ HOẠCH ({performanceData.symbol})
            </div>

            <div className="p-5 space-y-6">
              {/* Tín hiệu hiện tại */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tín hiệu hiện tại</h3>
                <div className="flex items-center gap-4">
                  {latestTrade?.side === 'BUY' ? (
                    <ArrowUpCircle size={48} className="text-emerald-500" />
                  ) : (
                    <ArrowDownCircle size={48} className="text-red-500" />
                  )}
                  <div>
                    <div className={`text-3xl font-extrabold ${latestTrade?.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {latestTrade?.side === 'BUY' ? 'BUY' : 'SELL'}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Giá vào: <span className="font-mono text-white">{latestTrade?.entry_price}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-800 w-full" />

              {/* Hiệu suất chiến lược */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Hiệu suất chiến lược</h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* Tỷ lệ thắng */}
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {performanceData.win_rate?.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Tỷ lệ thắng</div>
                  </div>

                  {/* Tổng giao dịch */}
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {performanceData.total_trades}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Tổng giao dịch</div>
                  </div>

                  {/* Lợi suất tổng */}
                  <div>
                    <div className={`text-2xl font-bold ${performanceData.total_pnl_pct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {performanceData.total_pnl_pct > 0 ? '+' : ''}{performanceData.total_pnl_pct?.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Lợi suất tổng</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
