'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface Signal {
  symbol: string;
  signal_type: string;
  price: number;
  trading_value: number;
  trend_change_detected_at: string; // Sửa lại tên trường thời gian cho khớp với ảnh API
}

export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/sieutinhieu/signals?limit=30&type=BUY', { 
        cache: 'no-store'
      });
      const json = await res.json();
      
      // Sửa lại cách lấy mảng signals dựa trên cấu trúc API bạn cung cấp
      if (json.success && json.data && json.data.signals) {
        setSignals(json.data.signals);
      } else {
        setSignals([]); // Fallback nếu không có data
      }
    } catch (e) {
      console.error("Signals error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();

    // Tự động làm mới mỗi 10 giây
    const interval = setInterval(() => {
      fetchSignals();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
          🚀 Stock Pro <span className="text-green-500 text-3xl">LIVE REALTIME</span>
        </h1>

        {/* Signals Section */}
        <div className="bg-gray-900 rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="text-yellow-500" /> Tín hiệu BUY mạnh hôm nay
            </h2>
            <button 
              onClick={fetchSignals}
              className="px-6 py-3 bg-green-600 rounded-xl hover:bg-green-700 transition"
            >
              Refresh Now
            </button>
          </div>

          {loading ? (
            <p className="text-center py-10">Đang tải dữ liệu realtime từ Siêu Tín Hiệu...</p>
          ) : signals.length === 0 ? (
            <p className="text-center py-10 text-gray-400">Không tìm thấy tín hiệu BUY nào hôm nay hoặc API bị lỗi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="py-4">MÃ CP</th>
                    <th>GIÁ</th>
                    <th>SIGNAL</th>
                    <th className="text-right">GIÁ TRỊ GD</th>
                    <th className="text-right">THỜI GIAN</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s, i) => (
                    <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-5 font-mono text-lg font-bold">{s.symbol}</td>
                      <td className="py-5 text-xl">{s.price?.toLocaleString('vi-VN')}</td>
                      <td className="py-5">
                        <span className="px-5 py-2 rounded-full text-sm font-bold bg-green-500/20 text-green-400">
                          {s.signal_type}
                        </span>
                      </td>
                      <td className="py-5 text-right font-mono">
                        {(s.trading_value / 1_000_000_000).toFixed(1)} tỷ
                      </td>
                      <td className="py-5 text-right text-gray-400 text-sm">
                        {s.trend_change_detected_at 
                          ? new Date(s.trend_change_detected_at).toLocaleTimeString('vi-VN') 
                          : '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
