'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Bell } from 'lucide-react';

interface Signal {
  symbol: string;
  signal_type: string;
  price: number;
  trading_value: number;
  detected_at: string;
}

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [vn30, setVn30] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchVN30 = async () => {
    try {
      const res = await fetch('/api/sieutinhieu/bar?symbol=VN30', { 
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      const json = await res.json();
      if (json.success) setVn30(json.data);
    } catch (e) {
      console.error("VN30 error", e);
    }
  };

  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/sieutinhieu/signals?limit=30&type=BUY', { 
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      const json = await res.json();
      if (json.success) {
        setSignals(json.data || []);
      }
    } catch (e) {
      console.error("Signals error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVN30();
    fetchSignals();

    const interval = setInterval(() => {
      fetchVN30();
      fetchSignals();
    }, 10000); // 10 giây refresh 1 lần

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 flex items-center gap-4">
          🚀 Stock Pro <span className="text-green-500 text-3xl">LIVE REALTIME</span>
        </h1>

        {/* VN30 */}
        <div className="bg-gray-900 rounded-3xl p-8 mb-8 border border-green-500/30">
          <h2 className="text-2xl mb-4">VN30 Index</h2>
          <div className="text-6xl font-mono font-bold">
            {vn30?.bar?.close?.toFixed(2) || '---'}
          </div>
        </div>

        {/* Signals */}
        <div className="bg-gray-900 rounded-3xl p-8">
          <div className="flex justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="text-yellow-500" /> Tín hiệu BUY mạnh hôm nay
            </h2>
            <button 
              onClick={() => { fetchVN30(); fetchSignals(); }}
              className="px-6 py-3 bg-green-600 rounded-xl hover:bg-green-700"
            >
              Refresh Now
            </button>
          </div>

          {loading ? (
            <p className="text-center py-10">Đang tải dữ liệu realtime từ Siêu Tín Hiệu...</p>
          ) : signals.length === 0 ? (
            <p className="text-center py-10 text-gray-400">Chưa có tín hiệu BUY mạnh nào hôm nay</p>
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
                      <td className="py-5 text-xl">{s.price?.toLocaleString()}</td>
                      <td className="py-5">
                        <span className="px-5 py-2 rounded-full text-sm font-bold bg-green-500/20 text-green-400">
                          {s.signal_type}
                        </span>
                      </td>
                      <td className="py-5 text-right font-mono">
                        {(s.trading_value / 1_000_000_000).toFixed(1)} tỷ
                      </td>
                      <td className="py-5 text-right text-gray-400 text-sm">
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
  );
}
