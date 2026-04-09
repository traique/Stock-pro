'use client';

import { useState } from 'react';
import { Search, ArrowUpCircle, ArrowDownCircle, Zap, ListOrdered, Home as HomeIcon } from 'lucide-react';
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
  const [symbolInput, setSymbolInput] = useState('SSI');
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

  // Hàm chuyển đổi Unix timestamp sang định dạng dd/mm/yy
  const formatDate = (timestamp: number) => {
    if (!timestamp) return '---';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] text-gray-800 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header & Menu */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-3xl font-extrabold flex items-center gap-3 text-gray-900">
            🚀 Stock Pro <span className="text-blue-600">ANALYTICS</span>
          </h1>
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <Link href="/" className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-semibold transition">
              <HomeIcon size={18} /> Home
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 shadow-sm border border-gray-200 rounded-lg font-semibold transition">
              <Search size={18} /> Tra cứu CP
            </Link>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <form onSubmit={handleSearch} className="relative shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <input 
            type="text" 
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
            placeholder="Tìm kiếm mã CP (VD: SSI, HPG...)"
            className="w-full bg-white py-4 px-5 pl-14 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase text-lg"
          />
          <Search className="absolute left-5 top-4 text-gray-400" size={24} />
          <button type="submit" className="absolute right-3 top-2.5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition">
            Phân tích
          </button>
        </form>

        {loading && <p className="text-center text-gray-500 animate-pulse py-8 font-semibold">Đang tải dữ liệu chiến lược...</p>}
        {error && <p className="text-center text-red-500 py-8 font-semibold">{error}</p>}

        {performanceData && !loading && (
          <div className="space-y-6">
            
            {/* Card 1: Tổng quan Tín hiệu & Hiệu suất */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center gap-2 text-sm font-bold text-gray-600 uppercase tracking-wide">
                <Zap size={18} className="text-blue-500" /> Tín hiệu & Kế hoạch
              </div>
              
              <div className="p-6 md:p-8 space-y-8">
                {/* Dòng 1: Tín hiệu hiện tại */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Tín hiệu hiện tại</h3>
                  <div className="flex items-center gap-4">
                    {latestTrade?.side === 'BUY' ? (
                      <ArrowUpCircle size={54} className="text-emerald-500 bg-emerald-50 rounded-full" />
                    ) : (
                      <ArrowDownCircle size={54} className="text-rose-500 bg-rose-50 rounded-full" />
                    )}
                    <div>
                      <div className={`text-3xl font-black tracking-tight ${latestTrade?.side === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {latestTrade?.side === 'BUY' ? 'STRONG BUY' : 'STRONG SELL'}
                      </div>
                      <div className="text-gray-500 font-medium mt-1">
                        Confirmed at <span className="font-bold text-gray-800">{latestTrade?.entry_price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full" />

                {/* Dòng 2: Hiệu suất chiến lược */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">Hiệu suất chiến lược</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="text-3xl font-black text-gray-900">
                        {performanceData.win_rate?.toFixed(2)}%
                      </div>
                      <div className="text-sm font-semibold text-gray-500 mt-1">Tỷ lệ thắng</div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-gray-900">
                        {performanceData.total_trades}
                      </div>
                      <div className="text-sm font-semibold text-gray-500 mt-1">Tổng giao dịch</div>
                    </div>
                    <div>
                      <div className={`text-3xl font-black ${performanceData.total_pnl_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {performanceData.total_pnl_pct > 0 ? '+' : ''}{performanceData.total_pnl_pct?.toFixed(2)}%
                      </div>
                      <div className="text-sm font-semibold text-gray-500 mt-1">Lợi suất tổng</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Bảng chi tiết lệnh */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-600 uppercase tracking-wide">
                  <ListOrdered size={18} className="text-gray-500" /> Chi tiết lệnh
                </div>
                <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold">
                  {performanceData.trades?.length || 0}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 bg-white border-b border-gray-100 uppercase font-bold">
                    <tr>
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Loại</th>
                      <th className="px-6 py-4">Ngày vào</th>
                      <th className="px-6 py-4">Giá vào</th>
                      <th className="px-6 py-4">Ngày ra</th>
                      <th className="px-6 py-4">Giá ra</th>
                      <th className="px-6 py-4 text-right">Lợi nhuận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.trades?.map((trade, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-400">{index + 1}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-md text-xs font-extrabold ${trade.side === 'BUY' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {trade.side}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-600">{formatDate(trade.entry_ts)}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{trade.entry_price}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{formatDate(trade.exit_ts)}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{trade.exit_price || '---'}</td>
                        <td className={`px-6 py-4 text-right font-black ${trade.pnl_pct > 0 ? 'text-emerald-500' : trade.pnl_pct < 0 ? 'text-rose-500' : 'text-gray-500'}`}>
                          {trade.pnl_pct > 0 ? '+' : ''}{trade.pnl_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
