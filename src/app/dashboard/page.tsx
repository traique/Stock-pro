'use client';

import { useState } from 'react';
import { Search, ArrowUpCircle, ArrowDownCircle, Activity, Home as HomeIcon } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  // Thay đổi mã CP mặc định sang một mã trong danh sách theo dõi của bạn
  const [symbolInput, setSymbolInput] = useState('HPG');
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

  const latestTrade = performanceData?.trades?.[0];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header & Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <h1 className="text-5xl font-bold flex items-center gap-4">
            🚀 Stock Pro <span className="text-blue-500 text-3xl">ANALYTICS</span>
          </h1>
          
          {/* Navigation Menu (Active: Tra cứu CP) */}
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

        {/* Khu vực tìm kiếm và hiển thị */}
        <div className="max-w-xl mx-auto space-y-6">
          
          {/* Form Tìm kiếm */}
          <form onSubmit={handleSearch} className="relative shadow-xl">
            <input 
              type="text" 
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              placeholder="Nhập mã CP (VD: MBB, TCB...)"
              className="w-full bg-gray-900 border border-gray-700 rounded-2xl py-4 px-5 pl-14 text-white focus:outline-none focus:border-blue-500 font-bold uppercase tracking-widest text-lg"
            />
            <Search className="absolute left-5 top-5 text-gray-400" size={24} />
            <button 
              type="submit"
              className="absolute right-3 top-3 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl text-sm font-bold transition shadow-md"
            >
              Phân tích
            </button>
          </form>

          {loading && <p className="text-center text-gray-400 animate-pulse py-10">Đang tải dữ liệu...</p>}
          {error && <p className="text-center text-red-500 py-10">{error}</p>}

          {performanceData && !loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl mt-8">
              <div className="p-5 border-b border-gray-800 flex items-center gap-2 text-sm font-semibold text-gray-400 bg-gray-900/50">
                <Activity size={18} /> TÍN HIỆU & HIỆU SUẤT ({performanceData.symbol})
              </div>

              <div className="p-8 space-y-8">
                {/* Tín hiệu hiện tại */}
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Trạng thái gần nhất</h3>
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
                      <div className="text-gray-400 text-base mt-1">
                        Vùng giá: <span className="font-mono text-white text-lg">{latestTrade?.entry_price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-800 w-full" />

                {/* Hiệu suất chiến lược */}
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5">Hiệu suất chiến lược (Lịch sử)</h3>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    
                    <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-800/50">
                      <div className="text-3xl font-bold text-white mb-1">
                        {performanceData.win_rate?.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-400">Tỷ lệ thắng</div>
                    </div>

                    <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-800/50">
                      <div className="text-3xl font-bold text-white mb-1">
                        {performanceData.total_trades}
                      </div>
                      <div className="text-sm text-gray-400">Giao dịch</div>
                    </div>

                    <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-800/50">
                      <div className={`text-3xl font-bold ${performanceData.total_pnl_pct >= 0 ? 'text-emerald-500' : 'text-red-500'} mb-1`}>
                        {performanceData.total_pnl_pct > 0 ? '+' : ''}{performanceData.total_pnl_pct?.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-400">Lợi suất</div>
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
