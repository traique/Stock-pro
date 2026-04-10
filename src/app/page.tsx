'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Terminal, Zap, Crosshair } from 'lucide-react';

interface Signal {
  symbol: string;
  signal_type: string;
  price: number;
  trading_value: number;
  trend_change_detected_at: string;
}

const fetchWithTimeout = async (url: string, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'SIGNAL' | 'ANALYTICS'>('SIGNAL');

  const [signals, setSignals] = useState<Signal[]>([]);
  const [sigLoading, setSigLoading] = useState(true);

  const [symbolInput, setSymbolInput] = useState('SSI');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState('');

  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/sieutinhieu/signals?limit=30&type=BUY', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data?.signals) setSignals(json.data.signals);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setSigLoading(false); 
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsData = async (symbolToFetch: string) => {
    if (!symbolToFetch) return;
    setPerfLoading(true); setPerfError('');
    try {
      const symbol = symbolToFetch.toUpperCase();
      const resPerf = await fetchWithTimeout(`/api/sieutinhieu/performance?symbol=${symbol}`, 8000);
      const jsonPerf = await resPerf.json();

      if (jsonPerf.success && jsonPerf.data) setPerformanceData(jsonPerf.data);
      else { setPerfError('ERR_DATA_NOT_FOUND'); setPerformanceData(null); }
    } catch (err: any) { 
      setPerfError(err.name === 'AbortError' ? 'ERR_TIMEOUT' : 'ERR_CONNECTION_REFUSED');
      setPerformanceData(null);
    } finally { 
      setPerfLoading(false); 
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAnalyticsData(symbolInput);
  };

  const handleSymbolClick = (symbol: string) => {
    setSymbolInput(symbol);            
    setActiveTab('ANALYTICS');         
    loadAnalyticsData(symbol);         
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const formatDate = (ts: number) => {
    if (!ts) return '---';
    const d = new Date(ts * 1000);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
  };

  const latestTrade = performanceData?.trades?.[0];
  const isBuy = latestTrade?.side === 'BUY';

  return (
    <>
      {/* --- INJECT CYBERPUNK CSS --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;900&family=Space+Mono:wght@400;700&display=swap');

        :root {
          --bg-base: #050505;
          --panel-bg: rgba(10, 10, 12, 0.7);
          --neon-cyan: #00f0ff;
          --neon-green: #00ff66;
          --neon-red: #ff0055;
          --text-main: #ffffff;
          --text-muted: #5c677d;
          --border-glow: rgba(0, 240, 255, 0.3);
          --border-line: rgba(255, 255, 255, 0.08);
        }

        body {
          background-color: var(--bg-base) !important;
          color: var(--text-main) !important;
          font-family: 'Space Grotesk', sans-serif !important;
          background-image: 
            linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px) !important;
          background-size: 40px 40px !important;
          background-position: center center !important;
        }

        .cyber-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }

        .cyber-card {
          background: var(--panel-bg);
          border: 1px solid var(--border-line);
          border-radius: 4px;
          padding: 24px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          position: relative;
          transition: all 0.3s ease;
        }

        .cyber-card::before {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, var(--neon-cyan), transparent);
          opacity: 0; transition: opacity 0.3s ease;
        }

        .cyber-card:hover { border-color: var(--border-glow); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8); }
        .cyber-card:hover::before { opacity: 0.5; }

        .font-mono { font-family: 'Space Mono', monospace !important; }
        .neon-text-cyan { color: var(--neon-cyan); text-shadow: 0 0 10px rgba(0, 240, 255, 0.5); }
        .neon-text-green { color: var(--neon-green); text-shadow: 0 0 10px rgba(0, 255, 102, 0.4); }
        .neon-text-red { color: var(--neon-red); text-shadow: 0 0 10px rgba(255, 0, 85, 0.4); }

        .cyber-input {
          background: rgba(0,0,0,0.6); border: 1px solid var(--border-line);
          color: var(--neon-cyan); padding: 14px 24px; border-radius: 0px;
          font-family: 'Space Mono', monospace; font-size: 16px; width: 100%;
          outline: none; transition: all 0.3s;
        }
        .cyber-input:focus { border-color: var(--neon-cyan); box-shadow: 0 0 15px rgba(0, 240, 255, 0.1) inset; }

        .cyber-btn {
          background: transparent; color: var(--neon-cyan); border: 1px solid var(--neon-cyan);
          padding: 12px 28px; border-radius: 0px; font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; text-transform: uppercase; letter-spacing: 2px;
          cursor: pointer; transition: all 0.2s; text-shadow: 0 0 5px rgba(0, 240, 255, 0.5);
        }
        .cyber-btn:hover { background: var(--neon-cyan); color: #000; box-shadow: 0 0 20px rgba(0, 240, 255, 0.4); }

        .cyber-table { width: 100%; border-collapse: separate; border-spacing: 0 4px; }
        .cyber-table th { color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; padding: 0 16px 12px; border-bottom: 1px solid var(--border-line); font-family: 'Space Mono', monospace; }
        
        .row-item { background: rgba(255, 255, 255, 0.01); transition: all 0.2s; cursor: pointer; }
        .row-item:hover { background: rgba(0, 240, 255, 0.05); border-left: 2px solid var(--neon-cyan); }
        .row-item td { padding: 16px; border-top: 1px solid transparent; border-bottom: 1px solid var(--border-line); }

        .badge-buy { border: 1px solid var(--neon-green); color: var(--neon-green); padding: 4px 8px; font-size: 11px; font-family: 'Space Mono', monospace; background: rgba(0, 255, 102, 0.05); box-shadow: 0 0 8px rgba(0, 255, 102, 0.2); }
        .badge-sell { border: 1px solid var(--neon-red); color: var(--neon-red); padding: 4px 8px; font-size: 11px; font-family: 'Space Mono', monospace; background: rgba(255, 0, 85, 0.05); box-shadow: 0 0 8px rgba(255, 0, 85, 0.2); }
      `}} />

      <div className="cyber-container">
        {/* --- HEADER --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', margin: 0, cursor: 'pointer' }} onClick={() => setActiveTab('SIGNAL')}>
            STOCK<span className="neon-text-cyan" style={{ marginLeft: '2px' }}>PRO_</span>
            <span className="font-mono" style={{ fontSize: '14px', color: 'var(--text-muted)', letterSpacing: '2px', verticalAlign: 'top', marginLeft: '12px' }}>
              {activeTab === 'SIGNAL' ? '[LIVE_FEED]' : '[SCANNER]'}
            </span>
          </h1>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => setActiveTab('SIGNAL')} className="cyber-btn" style={{ background: activeTab === 'SIGNAL' ? 'var(--neon-cyan)' : 'transparent', color: activeTab === 'SIGNAL' ? '#000' : 'var(--neon-cyan)', boxShadow: activeTab === 'SIGNAL' ? '0 0 20px rgba(0, 240, 255, 0.4)' : 'none', padding: '10px 20px' }}>
              <Activity size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: '-3px' }}/> SYSTEM.LIVE
            </button>
            <button onClick={() => setActiveTab('ANALYTICS')} className="cyber-btn" style={{ background: activeTab === 'ANALYTICS' ? 'var(--neon-cyan)' : 'transparent', color: activeTab === 'ANALYTICS' ? '#000' : 'var(--neon-cyan)', boxShadow: activeTab === 'ANALYTICS' ? '0 0 20px rgba(0, 240, 255, 0.4)' : 'none', padding: '10px 20px' }}>
              <Crosshair size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: '-3px' }}/> DATA.SCAN
            </button>
          </div>
        </div>

        {/* --- TAB: SIGNAL --- */}
        <div style={{ display: activeTab === 'SIGNAL' ? 'block' : 'none', animation: 'fadeIn 0.3s ease-in-out' }}>
          <div className="cyber-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                <Zap size={20} className="neon-text-cyan" /> SIGNAL_STREAM
              </h2>
              <button className="cyber-btn" onClick={fetchSignals} style={{ fontSize: '12px', padding: '6px 16px' }}>REBOOT</button>
            </div>

            {sigLoading ? (
              <p className="font-mono neon-text-cyan" style={{ textAlign: 'center', padding: '40px' }}>&gt; Fetching live data...</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="cyber-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>TARGET (CLICK)</th>
                      <th style={{ textAlign: 'left' }}>ENTRY_PRICE</th>
                      <th style={{ textAlign: 'left' }}>ACTION</th>
                      <th style={{ textAlign: 'right' }}>VOLUME (VND)</th>
                      <th style={{ textAlign: 'right' }}>TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((s, i) => (
                      <tr key={i} className="row-item" onClick={() => handleSymbolClick(s.symbol)}>
                        <td style={{ fontSize: '20px', fontWeight: '700' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {s.symbol} <ArrowUpRight size={16} className="neon-text-cyan" />
                          </div>
                        </td>
                        <td className="font-mono" style={{ fontSize: '16px' }}>
                          {s.price?.toLocaleString('vi-VN')}
                        </td>
                        <td>
                          <span className="badge-buy">{s.signal_type}</span>
                        </td>
                        <td className="font-mono" style={{ textAlign: 'right', fontSize: '15px' }}>
                          {(s.trading_value / 1_000_000_000).toFixed(1)}B
                        </td>
                        <td className="font-mono" style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '14px' }}>
                          {s.trend_change_detected_at ? new Date(s.trend_change_detected_at).toLocaleTimeString('vi-VN') : '---'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* --- TAB: ANALYTICS --- */}
        <div style={{ display: activeTab === 'ANALYTICS' ? 'block' : 'none', animation: 'fadeIn 0.3s ease-in-out' }}>
          
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Terminal style={{ position: 'absolute', left: '20px', top: '15px', color: 'var(--neon-cyan)' }} size={20} />
              <input 
                type="text" 
                className="cyber-input"
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                placeholder="INPUT_TICKER // e.g. SSI"
                style={{ paddingLeft: '56px' }}
              />
            </div>
            <button type="submit" className="cyber-btn" style={{ padding: '0 40px' }}>
              EXECUTE
            </button>
          </form>

          {perfLoading && <p className="font-mono neon-text-cyan" style={{ textAlign: 'center' }}>&gt; Analyzing data packets...</p>}
          {perfError && <p className="font-mono neon-text-red" style={{ textAlign: 'center' }}>&gt; ERROR: {perfError}</p>}

          {performanceData && !perfLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* KHỐI 1: THỐNG KÊ (HACKER STYLE) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '20px' }}>&gt; CURRENT_STATUS</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ padding: '16px', border: `1px solid ${isBuy ? 'var(--neon-green)' : 'var(--neon-red)'}`, boxShadow: `0 0 15px ${isBuy ? 'rgba(0,255,102,0.2)' : 'rgba(255,0,85,0.2)'} inset` }}>
                      {isBuy ? <ArrowUpRight size={36} className="neon-text-green" /> : <ArrowDownRight size={36} className="neon-text-red" />}
                    </div>
                    <div>
                      <div className={isBuy ? 'neon-text-green' : 'neon-text-red'} style={{ fontSize: '42px', fontWeight: '900', lineHeight: '1', letterSpacing: '2px' }}>
                        {isBuy ? 'LONG' : 'SHORT'}
                      </div>
                      <div className="font-mono" style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        ENTRY_ZONE: <strong style={{ color: '#fff' }}>{latestTrade?.entry_price}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div className="font-mono" style={{ fontSize: '48px', fontWeight: '700', color: '#fff' }}>
                      {performanceData.win_rate?.toFixed(0)}<span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>%</span>
                    </div>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '2px', marginTop: '8px' }}>WIN_RATE</div>
                  </div>
                  <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div className={`font-mono ${performanceData.total_pnl_pct > 0 ? 'neon-text-green' : 'neon-text-red'}`} style={{ fontSize: '48px', fontWeight: '700' }}>
                      {performanceData.total_pnl_pct > 0 ? '+' : ''}{performanceData.total_pnl_pct?.toFixed(0)}<span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>%</span>
                    </div>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--neon-cyan)', letterSpacing: '2px', marginTop: '8px' }}>NET_PROFIT</div>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: LỊCH SỬ LỆNH */}
              <div className="cyber-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                  <h3 className="font-mono" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' }}>
                    <ListOrdered size={18} className="neon-text-cyan" /> TRADE_LOGS ({performanceData.symbol})
                  </h3>
                  <span className="font-mono" style={{ color: 'var(--neon-cyan)', fontSize: '12px' }}>COUNT: {performanceData.trades?.length || 0}</span>
                </div>
                <div style={{ overflowX: 'auto', padding: '12px 24px 24px' }}>
                  <table className="cyber-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>TYPE</th>
                        <th style={{ textAlign: 'left' }}>ENTRY_DATE</th>
                        <th style={{ textAlign: 'left' }}>IN_PRICE</th>
                        <th style={{ textAlign: 'left' }}>EXIT_DATE</th>
                        <th style={{ textAlign: 'left' }}>OUT_PRICE</th>
                        <th style={{ textAlign: 'right' }}>PNL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.trades?.map((trade: any, idx: number) => (
                        <tr key={idx} className="row-item">
                          <td><span className={`badge-${trade.side === 'BUY' ? 'buy' : 'sell'}`}>{trade.side}</span></td>
                          <td className="font-mono" style={{ color: 'var(--text-muted)' }}>{formatDate(trade.entry_ts)}</td>
                          <td className="font-mono" style={{ fontWeight: '700' }}>{trade.entry_price}</td>
                          <td className="font-mono" style={{ color: 'var(--text-muted)' }}>{formatDate(trade.exit_ts)}</td>
                          <td className="font-mono" style={{ fontWeight: '700' }}>{trade.exit_price || '---'}</td>
                          <td className="font-mono" style={{ textAlign: 'right', fontWeight: '700', color: trade.pnl_pct > 0 ? 'var(--neon-green)' : trade.pnl_pct < 0 ? 'var(--neon-red)' : 'var(--text-muted)' }}>
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
    </>
  );
}
