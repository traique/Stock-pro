'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Landmark, PieChart, TrendingDown, TrendingUp, Wallet, 
  ArrowUpRight, ArrowDownRight, Home as HomeIcon, Search, FolderKanban, Sun, Moon, Plus, History
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  calcCashSummary, calcPosition, calcRealizedSummary, calcSummary,
  deriveOpenHoldings, enrichTransactions, formatCurrency, groupHoldingsBySymbol,
  Transaction, CashTransaction, PortfolioSettings
} from '@/lib/calculations';

// Dùng ID mặc định vì chưa có hệ thống Đăng nhập
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export default function PortfolioPage() {
  const [theme, setTheme] = useState('light');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [portfolioSettings, setPortfolioSettings] = useState<PortfolioSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [tradeMode, setTradeMode] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeForm, setTradeForm] = useState({ symbol: '', price: '', quantity: '', trade_date: '' });

  const [showCashForm, setShowCashForm] = useState(false);
  const [cashMode, setCashMode] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [cashForm, setCashForm] = useState({ amount: '', transaction_date: '' });

  // Khởi tạo Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    loadPortfolio();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const loadPortfolio = async () => {
    setLoading(true);
    const [txRes, cashRes, setRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', DEMO_USER_ID).order('trade_date', { ascending: false }),
      supabase.from('cash_transactions').select('*').eq('user_id', DEMO_USER_ID).order('transaction_date', { ascending: false }),
      supabase.from('portfolio_settings').select('*').eq('user_id', DEMO_USER_ID).maybeSingle()
    ]);
    
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (cashRes.data) setCashTransactions(cashRes.data as CashTransaction[]);
    if (setRes.data) setPortfolioSettings(setRes.data as PortfolioSettings);
    setLoading(false);
  };

  // Calculations
  const openHoldings = useMemo(() => deriveOpenHoldings(transactions), [transactions]);
  const enrichedTransactions = useMemo(() => enrichTransactions(transactions), [transactions]);
  const positions = useMemo(() => groupHoldingsBySymbol(openHoldings), [openHoldings]);
  const summary = useMemo(() => calcSummary(openHoldings, {}), [openHoldings]); // Chưa nối API giá nên truyền {}
  const realizedSummary = useMemo(() => calcRealizedSummary(enrichedTransactions), [enrichedTransactions]);
  const cashSummary = useMemo(() => calcCashSummary(cashTransactions, enrichedTransactions, portfolioSettings), [cashTransactions, enrichedTransactions, portfolioSettings]);

  const totalCapital = cashSummary.netCapital;
  const actualNav = cashSummary.actualCash;
  const marketValue = summary.totalBuy; // Tạm lấy giá vốn làm giá thị trường (Do chưa nối API giá)
  const totalAssets = actualNav + marketValue;
  const totalPnl = totalAssets - totalCapital;
  const totalPnlPct = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;

  // Handlers
  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeForm.symbol || !tradeForm.price || !tradeForm.quantity) return alert('Nhập đủ thông tin');
    
    await supabase.from('transactions').insert({
      user_id: DEMO_USER_ID,
      symbol: tradeForm.symbol.toUpperCase(),
      transaction_type: tradeMode,
      price: Number(tradeForm.price),
      quantity: Number(tradeForm.quantity),
      trade_date: tradeForm.trade_date || new Date().toISOString().split('T')[0],
    });
    
    setTradeForm({ symbol: '', price: '', quantity: '', trade_date: '' });
    setShowTradeForm(false);
    loadPortfolio();
  };

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashForm.amount) return alert('Nhập số tiền');

    await supabase.from('cash_transactions').insert({
      user_id: DEMO_USER_ID,
      transaction_type: cashMode,
      amount: Number(cashForm.amount),
      transaction_date: cashForm.transaction_date || new Date().toISOString().split('T')[0],
    });

    setCashForm({ amount: '', transaction_date: '' });
    setShowCashForm(false);
    loadPortfolio();
  };

  return (
    <div className="bento-container">
      {/* --- HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '40px' }}>
          Stock Pro<span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginLeft: '8px' }}>Portfolio.</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="nav-menu" style={{ marginBottom: 0 }}>
            <Link href="/" className="nav-link"><HomeIcon size={16} /> Tín hiệu</Link>
            <Link href="/dashboard" className="nav-link"><Search size={16} /> Phân tích</Link>
            <Link href="/portfolio" className="nav-link active"><FolderKanban size={16} /> Danh mục</Link>
          </div>
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>

      {loading ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải dữ liệu danh mục...</p> : (
        <>
          {/* --- TỔNG QUAN TÀI SẢN --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div className="bento-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <Landmark size={16} /> Tổng vốn nạp
              </div>
              <div style={{ fontSize: '28px', fontFamily: "'Playfair Display', serif", marginTop: '12px' }}>{formatCurrency(totalCapital)}</div>
            </div>
            <div className="bento-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <Wallet size={16} /> Tiền mặt (Sức mua)
              </div>
              <div style={{ fontSize: '28px', fontFamily: "'Playfair Display', serif", marginTop: '12px', color: 'var(--accent-blue)' }}>{formatCurrency(actualNav)}</div>
            </div>
            <div className="bento-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <PieChart size={16} /> Giá trị cổ phiếu
              </div>
              <div style={{ fontSize: '28px', fontFamily: "'Playfair Display', serif", marginTop: '12px' }}>{formatCurrency(marketValue)}</div>
            </div>
            <div className="bento-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <TrendingUp size={16} /> Tổng tài sản
              </div>
              <div style={{ fontSize: '28px', fontFamily: "'Playfair Display', serif", marginTop: '12px', color: 'var(--text-primary)' }}>{formatCurrency(totalAssets)}</div>
            </div>
          </div>

          {/* --- HIỆU SUẤT PNL --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div className="bento-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng Lãi / Lỗ</div>
                <div style={{ fontSize: '32px', fontFamily: "'Playfair Display', serif", color: totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: '8px' }}>
                  {totalPnl > 0 ? '+' : ''}{formatCurrency(totalPnl)}
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {totalPnlPct > 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
              </div>
            </div>
            <div className="bento-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Lãi / Lỗ đã chốt</div>
                <div style={{ fontSize: '32px', fontFamily: "'Playfair Display', serif", color: realizedSummary.totalRealizedPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: '8px' }}>
                   {realizedSummary.totalRealizedPnl > 0 ? '+' : ''}{formatCurrency(realizedSummary.totalRealizedPnl)}
                </div>
              </div>
              <TrendingDown size={40} color={realizedSummary.totalRealizedPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} style={{ opacity: 0.2 }} />
            </div>
          </div>

          {/* --- KHU VỰC THÊM LỆNH --- */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button onClick={() => { setShowTradeForm(!showTradeForm); setShowCashForm(false); }} className="editorial-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Ghi lệnh CP
            </button>
            <button onClick={() => { setShowCashForm(!showCashForm); setShowTradeForm(false); }} className="editorial-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <Wallet size={16} /> Nạp / Rút tiền
            </button>
          </div>

          {/* Form Ghi lệnh */}
          {showTradeForm && (
            <div className="bento-card" style={{ marginBottom: '40px', border: '1px solid var(--text-primary)' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Ghi nhận Giao dịch Cổ phiếu</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setTradeMode('BUY')} className={`badge ${tradeMode === 'BUY' ? 'buy' : ''}`} style={{ cursor: 'pointer', background: tradeMode === 'BUY' ? '' : 'var(--border-color)', color: tradeMode === 'BUY' ? '' : 'var(--text-secondary)' }}>MUA</button>
                <button onClick={() => setTradeMode('SELL')} className={`badge ${tradeMode === 'SELL' ? 'sell' : ''}`} style={{ cursor: 'pointer', background: tradeMode === 'SELL' ? '' : 'var(--border-color)', color: tradeMode === 'SELL' ? '' : 'var(--text-secondary)' }}>BÁN</button>
              </div>
              <form onSubmit={handleTradeSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <input required value={tradeForm.symbol} onChange={e => setTradeForm({...tradeForm, symbol: e.target.value})} className="editorial-input" placeholder="Mã CP (VD: HPG)" />
                <input required type="number" value={tradeForm.price} onChange={e => setTradeForm({...tradeForm, price: e.target.value})} className="editorial-input" placeholder="Giá khớp lệnh" />
                <input required type="number" value={tradeForm.quantity} onChange={e => setTradeForm({...tradeForm, quantity: e.target.value})} className="editorial-input" placeholder="Số lượng" />
                <input type="date" value={tradeForm.trade_date} onChange={e => setTradeForm({...tradeForm, trade_date: e.target.value})} className="editorial-input" />
                <button type="submit" className="editorial-btn" style={{ gridColumn: '1 / -1' }}>Lưu giao dịch</button>
              </form>
            </div>
          )}

          {/* Form Tiền mặt */}
          {showCashForm && (
            <div className="bento-card" style={{ marginBottom: '40px', border: '1px solid var(--text-primary)' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Ghi nhận Nạp / Rút tiền</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setCashMode('DEPOSIT')} className={`badge ${cashMode === 'DEPOSIT' ? 'buy' : ''}`} style={{ cursor: 'pointer', background: cashMode === 'DEPOSIT' ? '' : 'var(--border-color)', color: cashMode === 'DEPOSIT' ? '' : 'var(--text-secondary)' }}>NẠP VÀO</button>
                <button onClick={() => setCashMode('WITHDRAW')} className={`badge ${cashMode === 'WITHDRAW' ? 'sell' : ''}`} style={{ cursor: 'pointer', background: cashMode === 'WITHDRAW' ? '' : 'var(--border-color)', color: cashMode === 'WITHDRAW' ? '' : 'var(--text-secondary)' }}>RÚT RA</button>
              </div>
              <form onSubmit={handleCashSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <input required type="number" value={cashForm.amount} onChange={e => setCashForm({...cashForm, amount: e.target.value})} className="editorial-input" placeholder="Số tiền (VND)" />
                <input type="date" value={cashForm.transaction_date} onChange={e => setCashForm({...cashForm, transaction_date: e.target.value})} className="editorial-input" />
                <button type="submit" className="editorial-btn" style={{ gridColumn: '1 / -1' }}>Lưu giao dịch</button>
              </form>
            </div>
          )}

          {/* --- DANH SÁCH CỔ PHIẾU ĐANG GIỮ --- */}
          <h2 style={{ fontSize: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={24} color="var(--text-secondary)" /> Danh mục hiện tại
          </h2>
          <div style={{ display: 'grid', gap: '16px', marginBottom: '40px' }}>
            {positions.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Chưa có cổ phiếu nào trong danh mục.</p> : 
              positions.map((pos) => (
                <div key={pos.symbol} className="bento-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: "'Playfair Display', serif" }}>{pos.symbol}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Khối lượng: <strong style={{ color: 'var(--text-primary)' }}>{pos.quantity}</strong> cp</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Giá vốn trung bình</div>
                    <div style={{ fontSize: '20px', fontWeight: '700' }}>{formatCurrency(pos.avgBuyPrice)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Tổng vốn đầu tư</div>
                    <div style={{ fontSize: '20px', fontWeight: '700' }}>{formatCurrency(pos.totalBuy)}</div>
                  </div>
                </div>
              ))
            }
          </div>
          
        </>
      )}
    </div>
  );
}
