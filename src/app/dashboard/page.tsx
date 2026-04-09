'use client';

import { useState } from 'react';
import { Search, ArrowUpCircle, ArrowDownCircle, Activity, Home as HomeIcon } from 'lucide-react';
import Link from 'next/link';

interface Trade {
  side: string;
  entry_ts: number;
  exit_ts: number;
  entry_price: number;
  exit_price: number;
  pnl_pct: number;
}

interface PerformanceData {
  symbol: string;
  timeframe: string;
  total_trades: number;
  win_rate: number;
  total_pnl_pct: number;
  trades: Trade[];
}

export default function Dashboard() {
  const [symbolInput, setSymbolInput] = useState('HPG');
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
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
        setError('Không tìm thấy dữ liệu cho mã này hoặc lỗi API.');
        setPerformanceData(null);
      }
    } catch (e) {
      setError('Lỗi kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPerformance(symbolInput);
  };

  const latestTrade = performanceData?.trades?.[0];

  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-200 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* --- KHU VỰC HEADER & NAVIGATION (Đã khôi phục) --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h1 className="text-4xl md:text-5xl font-bold flex items-center gap-4 text-white">
            🚀 Stock Pro <span className="text-blue-500 text-3xl">ANALYTICS</span>
          </h1>
          
          <div className="flex items-center gap-3 bg-gray-900 p-2 rounded-2xl border border-gray-800">
            <Link 
              href="/" 
              className="flex items-center gap-2 px-5 py-2.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl font-semibold transition"
            >
              <HomeIcon size={18} /> Home
            </Link>
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-xl font-semibold shadow-sm transition"
            >
              <Search size={18} /> Tra cứu CP
            </Link>
          </div>
        </div>

        {/* --- KHU VỰC TÌM KIẾM & PHÂN TÍCH --- */}
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Form Tìm kiếm */}
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              placeholder="Nhập mã CP (VD: SSI, HPG...)"
              className="w-full bg-[#1e293b] border border-gray-700 rounded-xl py-4 px-5 pl-14 text-white focus:outline-none focus:border-blue-500 font-bold uppercase tracking-widest text-lg"
            />
            <Search className="absolute left-5 top-4 text-gray-400" size={22} />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 px-5 rounded-lg text-sm font-semibold transition"
            >
              Phân tích
            </button>
          </form>

          {loading && <p className="text-center text-gray-400 animate-pulse py-4">Đang tải dữ liệu...</p>}
          {error && <p className="text-center text-red-500 py-4">{error}</p>}

          {/* Khối hiển thị dữ liệu */}
          {performanceData && !loading && (
            <div className="bg-[#151b28] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
              
              {/* Header Tín hiệu */}
              <div className="p-5 border-b border-gray-800 flex items-center gap-2 text-sm font-semibold text-gray-400 bg-gray-900/50">
                <Activity size={18} /> TÍN HIỆU & HIỆU SUẤT ({performanceData.symbol})
              </div>

              <div className="p-6 space-y-8">
                {/* Tín hiệu hiện tại */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Trạng thái gần nhất</h3>
                  <div className="flex items-center gap-5">
                    {latestTrade?.side === 'BUY' ? (
                      <ArrowUpCircle size={56} className="text-emerald-500" />
                    ) : (
                      <ArrowDownCircle size={56} className="text-red-500" />
                    )}
                    <div>
                      <div className={`text-4xl font-extrabold ${latestTrade?.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {latestTrade?.side === 'BUY' ? 'BUY' : 'SELL'}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        Giá vào: <span className="font-mono text-white text-lg ml-1">{latestTrade?.entry_price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-800 w-full" />

                {/* Hiệu suất chiến lược */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">Hiệu suất chiến lược (Lịch sử)</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    
                    <div className="bg-gray-800/30 p-3 rounded-2xl border border-gray-800/50">
                      <div className="text-2xl font-bold text-white mb-1">
                        {performanceData.win_rate?.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-400">Tỷ lệ thắng</div>
                    </div>

                    <div className="bg-gray-800/30 p-3 rounded-2xl border border-gray-800/50">
                      <div className="text-2xl font-bold text-white mb-1">
                        {performanceData.total_trades}
                      </div>
                      <div className="text-xs text-gray-400">Giao dịch</div>
                    </div>

                    <div className="bg-gray-800/30 p-3 rounded-2xl border border-gray-800/50">
                      <div className={`text-2xl font-bold ${performanceData.total_pnl_pct >= 0 ? 'text-emerald-500' : 'text-red-500'} mb-1`}>
                        {performanceData.total_pnl_pct > 0 ? '+' : ''}{performanceData.total_pnl_pct?.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-400">Lợi suất</div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
