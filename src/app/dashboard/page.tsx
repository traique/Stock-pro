'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface Signal {
  symbol: string;
  signal_type: string;
  price: number;
  trading_value: number;
  detected_at: string;
}

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/sieutinhieu/signals?limit=30&type=BUY');
      const json = await res.json();
      if (json.success) {
        setSignals(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 15000); // refresh mỗi 15 giây
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          🚀 Stock Pro <span className="text-green-500">Realtime</span>
        </h1>
        <p className="text-gray-400 mb-8">Tín hiệu MA20 + MACD từ Siêu Tín Hiệu • Cập nhật live</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card VN30 realtime */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">VN30 Realtime</h2>
            <div id="vn30-bar" className="text-3xl font-mono">Đang tải...</div>
          </div>

          {/* Danh sách tín hiệu BUY mạnh */}
          <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="text-green-500" /> Tín hiệu BUY mạnh hôm nay
              </h2>
              <button 
                onClick={fetchSignals}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p>Đang tải tín hiệu...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3">Mã</th>
                      <th className="text-left py-3">Giá</th>
                      <th className="text-left py-3">Signal</th>
                      <th className="text-right py-3">Giá trị GD</th>
                      <th className="text-right py-3">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((s, i) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-gray-800">
                        <td className="py-4 font-mono font-bold">{s.symbol}</td>
                        <td className="py-4">{s.price?.toLocaleString()}</td>
                        <td className="py-4">
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                            {s.signal_type}
                          </span>
                        </td>
                        <td className="py-4 text-right">{(s.trading_value / 1e9).toFixed(1)} tỷ</td>
                        <td className="py-4 text-right text-gray-400 text-xs">
                          {new Date(s.detected_at).toLocaleTimeString('vi-VN')}
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
    </div>
  );
}
