'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Bell } from 'lucide-react';

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
    const res = await fetch('/api/sieutinhieu/bar?symbol=VN30');
    const json = await res.json();
    if (json.success) setVn30(json.data);
  };

  const fetchSignals = async () => {
    const res = await fetch('/api/sieutinhieu/signals?limit=30&type=BUY');
    const json = await res.json();
    if (json.success) {
      const newSignals = json.data || [];
      setSignals(newSignals);

      // Gửi Telegram nếu có STRONG BUY
      newSignals.forEach((s: Signal) => {
        if (s.signal_type.includes('STRONG')) {
          fetch('/api/telegram/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(s)
          });
        }
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVN30();
    fetchSignals();

    const interval = setInterval(() => {
      fetchVN30();
      fetchSignals();
    }, 10000); // refresh mỗi 10 giây

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-2 flex items-center gap-4">
          🚀 Stock Pro <span className="text-green-500 text-3xl">LIVE REALTIME</span>
        </h1>

        {/* VN30 Card */}
        <div className="bg-gray-900 rounded-3xl p-8 mb-8 border border-green-500/30">
          <h2 className="text-2xl mb-4">VN30 Index</h2>
          <div className="text-6xl font-mono font-bold">
            {vn30?.bar?.close?.toFixed(2) || '---'}
          </div>
          <div className="text-green-500 mt-2">
            {vn30?.bar?.high} ▲ {vn30?.bar?.low} ▼
          </div>
        </div>

        {/* Signals Table */}
        <div className="bg-gray-900 rounded-3xl p-8">
          <div className="flex justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="text-yellow-500" /> Tín hiệu BUY mạnh hôm nay
            </h2>
            <button onClick={fetchSignals} className="px-6 py-3 bg-green-600 rounded-xl hover:bg-green-700">
              Refresh Now
            </button>
          </div>

          {loading ? <p className="text-center py-10">Đang tải dữ liệu realtime từ Siêu Tín Hiệu...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full">
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
                        <span className={`px-5 py-2 rounded-full text-sm font-bold ${s.signal_type.includes('STRONG') ? 'bg-green-500 text-black' : 'bg-green-600/30 text-green-400'}`}>
                          {s.signal_type}
                        </span>
                      </td>
                      <td className="py-5 text-right font-mono">{(s.trading_value / 1_000_000_000).toFixed(1)} tỷ</td>
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
