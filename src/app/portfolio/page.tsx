'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Landmark, PieChart, TrendingDown, TrendingUp, Wallet, 
  ArrowUpRight, ArrowDownRight, Home as HomeIcon, Search, FolderKanban, 
  Sun, Moon, Plus, Trash2, ListOrdered
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  calcCashSummary, calcPosition, calcRealizedSummary, calcSummary,
  deriveOpenHoldings, enrichTransactions, formatCurrency, groupHoldingsBySymbol,
  Transaction, CashTransaction, PortfolioSettings
} from '@/lib/calculations';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

// Hàm hỗ trợ format số có dấu phẩy khi đang gõ
const formatNumberInput = (value: string) => {
  const number = value.replace(/\D/g, '');
  return number ? Number(number).toLocaleString('en-US') : '';
};

// Hàm lấy giá trị thật từ chuỗi có dấu phẩy
const parseNumberInput = (value: string) => {
  return Number(value.replace(/,/g, ''));
};

export default function PortfolioPage() {
  const [theme, setTheme] = useState('light');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [portfolioSettings, setPortfolioSettings] = useState<PortfolioSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // States cho Form Mua/Bán
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [tradeMode, setTradeMode] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeForm, setTradeForm] = useState({ symbol: '', price: '', quantity: '', trade_date: '' });

  // States cho Form Tiền mặt
  const [showCashForm, setShowCashForm] = useState(false);
  const [cashMode, setCashMode] = useState<'DEPOSIT' | 'WITHDRAW' | 'ADJUSTMENT'>('DEPOSIT');
  const [cashForm, setCashForm] = useState({ amount: '', transaction_date: '' });
  
  // States cho Điều chỉnh tiền mặt
  const [adjustmentSign, setAdjustmentSign] = useState<1 | -1>(1);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');

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
      supabase.from('transactions').select('*').eq('user_id', DEMO_USER_ID).order('trade_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('cash_transactions').select('*').eq('user_id', DEMO_USER_ID).order('transaction_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('portfolio_settings').select('*').eq('user_id', DEMO_USER_ID).maybeSingle()
    ]);
    
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (cashRes.data) setCashTransactions(cashRes.data as CashTransaction[]);
    if (setRes.data) {
      const settings = setRes.data as PortfolioSettings;
      setPortfolioSettings(settings);
      const adj = Number(settings.cash_adjustment || 0);
      setAdjustmentSign(adj >= 0 ? 1 : -1);
      setAdjustmentAmount(formatNumberInput(String(Math.abs(adj))));
    }
    setLoading(false);
  };

  // Các hàm tính toán từ code cũ
  const openHoldings = useMemo(() => deriveOpenHoldings(transactions), [transactions]);
  const enrichedTransactions = useMemo(() => enrichTransactions(transactions), [transactions]);
  const positions = useMemo(() => groupHoldingsBySymbol(openHoldings), [openHoldings]);
  const summary = useMemo(() => calcSummary(openHoldings, {}), [openHoldings]);
  const realizedSummary = useMemo(() => calcRealizedSummary(enrichedTransactions), [enrichedTransactions]);
  const cashSummary = useMemo(() => calcCashSummary(cashTransactions, enrichedTransactions, portfolioSettings), [cashTransactions, enrichedTransactions, portfolioSettings]);

  const totalCapital = cashSummary.netCapital;
  const actualNav = cashSummary.actualCash;
  const marketValue = summary.totalBuy; 
  const totalAssets = actualNav + marketValue;
  const totalPnl = totalAssets - totalCapital;
  const totalPnlPct = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;

  // Xử lý Cơ cấu danh mục (Phần trăm từng mã)
  const allocations = useMemo(() => {
    const totalNow = marketValue || 0;
    return positions.map((position) => {
      const percent = totalNow > 0 ? (position.totalBuy / totalNow) * 100 : 0;
      return { symbol: position.symbol, totalBuy: position.totalBuy, percent };
    }).sort((a, b) => b.totalBuy - a.totalBuy);
  }, [positions, marketValue]);

  // Submit Giao dịch Cổ phiếu
  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseNumberInput(tradeForm.price);
    const quantity = parseNumberInput(tradeForm.quantity);
    if (!tradeForm.symbol || !price || !quantity) return alert('Vui lòng nhập đủ thông tin và đúng định dạng số');
    
    await supabase.from('transactions').insert({
      user_id: DEMO_USER_ID,
      symbol: tradeForm.symbol.toUpperCase(),
      transaction_type: tradeMode,
      price,
      quantity,
      trade_date: tradeForm.trade_date || new Date().toISOString().split('T')[0],
    });
    
    setTradeForm({ symbol: '', price: '', quantity: '', trade_date: '' });
    setShowTradeForm(false);
    loadPortfolio();
  };

  // Submit Nạp/Rút Tiền
  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumberInput(cashForm.amount);
    if (!amount) return alert('Vui lòng nhập số tiền hợp lệ');

    await supabase.from('cash_transactions').insert({
      user_id: DEMO_USER_ID,
      transaction_type: cashMode,
      amount,
      transaction_date: cashForm.transaction_date || new Date().toISOString().split('T')[0],
    });

    setCashForm({ amount: '', transaction_date: '' });
    setShowCashForm(false);
    loadPortfolio();
  };

  // Submit Điều chỉnh tiền mặt
  const handleSaveCashAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const baseAmount = parseNumberInput(adjustmentAmount);
    const cashAdjustment = adjustmentSign * Math.abs(baseAmount || 0);
    
    await supabase.from('portfolio_settings').upsert(
      { user_id: DEMO_USER_ID, cash_adjustment: cashAdjustment }, 
      { onConflict: 'user_id' }
    );
    
    setShowCashForm(false);
    loadPortfolio();
  };

  // Xóa giao dịch
  const deleteTrade = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lệnh này?')) return;
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', DEMO_USER_ID);
    loadPortfolio();
  };

  const deleteCash = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch tiền này?')) return;
    await supabase.from('cash_transactions').delete().eq('id', id).eq('user_id', DEMO_USER_ID);
    loadPortfolio();
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="bento-container">
      {/* --- HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px' }}>
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

      {loading ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Đang tải dữ liệu danh mục...</p> : (
        <>
          {/* --- TỔNG QUAN TÀI SẢN --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="bento-card">
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng vốn nạp</div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px' }}>{formatCurrency(totalCapital)}</div>
            </div>
            <div className="bento-card" style={{ border: '1px solid var(--accent-blue)' }}>
              <div style={{ color: 'var(--accent-blue)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>NAV Thực tế (Sức mua)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: 'var(--accent-blue)' }}>{formatCurrency(actualNav)}</div>
            </div>
            <div className="bento-card">
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Giá trị thị trường</div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px' }}>{formatCurrency(marketValue)}</div>
            </div>
            <div className="bento-card" style={{ background: 'var(--text-primary)', color: 'var(--bg-color)' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Tổng tài sản</div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px' }}>{formatCurrency(totalAssets)}</div>
            </div>
          </div>

          {/* --- HIỆU SUẤT PNL --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div className="bento-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng Lãi / Lỗ</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: '4px' }}>
                  {totalPnl > 0 ? '+' : ''}{formatCurrency(totalPnl)}
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {totalPnlPct > 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
              </div>
            </div>
            <div className="bento-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Lãi / Lỗ đã chốt</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: realizedSummary.totalRealizedPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: '4px' }}>
                   {realizedSummary.totalRealizedPnl > 0 ? '+' : ''}{formatCurrency(realizedSummary.totalRealizedPnl)}
                </div>
              </div>
              <TrendingDown size={32} color={realizedSummary.totalRealizedPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} style={{ opacity: 0.3 }} />
            </div>
          </div>

          {/* --- CƠ CẤU DANH MỤC (Allocation) --- */}
          {allocations.length > 0 && (
            <div className="bento-card" style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Cơ cấu danh mục</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {allocations.map((item) => (
                  <div key={item.symbol}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '800', fontSize: '15px' }}>{item.symbol}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatCurrency(item.totalBuy)} · {item.percent.toFixed(1)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.percent}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- NÚT GHI LỆNH & NẠP RÚT --- */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button onClick={() => { setShowTradeForm(!showTradeForm); setShowCashForm(false); }} className="editorial-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Ghi lệnh CP
            </button>
            <button onClick={() => { setShowCashForm(!showCashForm); setShowTradeForm(false); }} className="editorial-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <Wallet size={16} /> Quản lý Tiền
            </button>
          </div>

          {/* Form Ghi lệnh */}
          {showTradeForm && (
            <div className="bento-card" style={{ marginBottom: '32px', border: '1px solid var(--text-primary)' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>Ghi nhận Giao dịch</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setTradeMode('BUY')} className={`badge ${tradeMode === 'BUY' ? 'buy' : ''}`} style={{ cursor: 'pointer', background: tradeMode === 'BUY' ? '' : 'transparent', color: tradeMode === 'BUY' ? '' : 'var(--text-secondary)', border: tradeMode === 'BUY' ? '' : '1px solid var(--border-color)' }}>LỆNH MUA</button>
                <button onClick={() => setTradeMode('SELL')} className={`badge ${tradeMode === 'SELL' ? 'sell' : ''}`} style={{ cursor: 'pointer', background: tradeMode === 'SELL' ? '' : 'transparent', color: tradeMode === 'SELL' ? '' : 'var(--text-secondary)', border: tradeMode === 'SELL' ? '' : '1px solid var(--border-color)' }}>LỆNH BÁN</button>
              </div>
              <form onSubmit={handleTradeSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <input required value={tradeForm.symbol} onChange={e => setTradeForm({...tradeForm, symbol: e.target.value})} className="editorial-input" placeholder="Mã CP (VD: HPG)" />
                <input required type="text" inputMode="numeric" value={tradeForm.price} onChange={e => setTradeForm({...tradeForm, price: formatNumberInput(e.target.value)})} className="editorial-input" placeholder="Giá khớp lệnh" />
                <input required type="text" inputMode="numeric" value={tradeForm.quantity} onChange={e => setTradeForm({...tradeForm, quantity: formatNumberInput(e.target.value)})} className="editorial-input" placeholder="Số lượng" />
                <input type="date" value={tradeForm.trade_date} onChange={e => setTradeForm({...tradeForm, trade_date: e.target.value})} className="editorial-input" />
                <button type="submit" className="editorial-btn" style={{ gridColumn: '1 / -1' }}>Lưu lệnh {tradeMode === 'BUY' ? 'Mua' : 'Bán'}</button>
              </form>
            </div>
          )}

          {/* Form Tiền mặt */}
          {showCashForm && (
            <div className="bento-card" style={{ marginBottom: '32px', border: '1px solid var(--text-primary)' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>Quản lý Dòng tiền</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button onClick={() => setCashMode('DEPOSIT')} className={`badge ${cashMode === 'DEPOSIT' ? 'buy' : ''}`} style={{ cursor: 'pointer', background: cashMode === 'DEPOSIT' ? '' : 'transparent', color: cashMode === 'DEPOSIT' ? '' : 'var(--text-secondary)', border: cashMode === 'DEPOSIT' ? '' : '1px solid var(--border-color)' }}>NẠP TIỀN</button>
                <button onClick={() => setCashMode('WITHDRAW')} className={`badge ${cashMode === 'WITHDRAW' ? 'sell' : ''}`} style={{ cursor: 'pointer', background: cashMode === 'WITHDRAW' ? '' : 'transparent', color: cashMode === 'WITHDRAW' ? '' : 'var(--text-secondary)', border: cashMode === 'WITHDRAW' ? '' : '1px solid var(--border-color)' }}>RÚT TIỀN</button>
                <button onClick={() => setCashMode('ADJUSTMENT')} className="badge" style={{ cursor: 'pointer', background: cashMode === 'ADJUSTMENT' ? 'var(--text-primary)' : 'transparent', color: cashMode === 'ADJUSTMENT' ? 'var(--bg-color)' : 'var(--text-secondary)', border: cashMode === 'ADJUSTMENT' ? 'none' : '1px solid var(--border-color)' }}>ĐIỀU CHỈNH LỆCH</button>
              </div>
              
              {cashMode === 'ADJUSTMENT' ? (
                <form onSubmit={handleSaveCashAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                     <button type="button" onClick={() => setAdjustmentSign(1)} className={`editorial-btn ${adjustmentSign === 1 ? '' : 'outline'}`} style={{ flex: 1, background: adjustmentSign === 1 ? 'var(--text-primary)' : 'transparent', color: adjustmentSign === 1 ? 'var(--bg-color)' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>Dương (+)</button>
                     <button type="button" onClick={() => setAdjustmentSign(-1)} className={`editorial-btn ${adjustmentSign === -1 ? '' : 'outline'}`} style={{ flex: 1, background: adjustmentSign === -1 ? 'var(--text-primary)' : 'transparent', color: adjustmentSign === -1 ? 'var(--bg-color)' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>Âm (-)</button>
                  </div>
                  <input required type="text" inputMode="numeric" value={adjustmentAmount} onChange={e => setAdjustmentAmount(formatNumberInput(e.target.value))} className="editorial-input" placeholder="Nhập số tiền điều chỉnh (VND)" />
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tiền hệ thống tính toán: <strong>{formatCurrency(cashSummary.calculatedCash)}</strong></div>
                  <button type="submit" className="editorial-btn">Lưu số điều chỉnh</button>
                </form>
              ) : (
                <form onSubmit={handleCashSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <input required type="text" inputMode="numeric" value={cashForm.amount} onChange={e => setCashForm({...cashForm, amount: formatNumberInput(e.target.value)})} className="editorial-input" placeholder="Số tiền (VND)" />
                  <input type="date" value={cashForm.transaction_date} onChange={e => setCashForm({...cashForm, transaction_date: e.target.value})} className="editorial-input" />
                  <button type="submit" className="editorial-btn" style={{ gridColumn: '1 / -1' }}>Lưu giao dịch {cashMode === 'DEPOSIT' ? 'Nạp' : 'Rút'}</button>
                </form>
              )}
            </div>
          )}

          {/* --- DANH SÁCH CỔ PHIẾU --- */}
          {positions.length > 0 && (
             <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderKanban size={20} color="var(--text-secondary)" /> Danh mục cổ phiếu
             </h2>
          )}
          <div style={{ display: 'grid', gap: '16px', marginBottom: '40px' }}>
            {positions.map((pos) => (
                <div key={pos.symbol} className="bento-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: "'Playfair Display', serif" }}>{pos.symbol}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Khối lượng: <strong style={{ color: 'var(--text-primary)' }}>{pos.quantity.toLocaleString('en-US')}</strong> cp</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giá vốn TB</div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(pos.avgBuyPrice)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổng vốn đầu tư</div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(pos.totalBuy)}</div>
                  </div>
                </div>
              ))}
          </div>

          {/* --- NHẬT KÝ GIAO DỊCH (Có nút xóa) --- */}
          <div className="bento-card" style={{ padding: '0', overflow: 'hidden' }}>
             <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListOrdered size={18} color="var(--text-secondary)" />
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Nhật ký giao dịch gần đây</h3>
             </div>
             <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                   <tbody>
                      {/* Lịch sử lệnh Mua/Bán */}
                      {enrichedTransactions.map((tx) => (
                         <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '16px 24px' }}>
                               <span className={`badge ${tx.transaction_type === 'BUY' ? 'buy' : 'sell'}`}>{tx.transaction_type}</span>
                            </td>
                            <td style={{ padding: '16px 24px', fontWeight: '700', fontSize: '16px' }}>{tx.symbol}</td>
                            <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                               {formatDate(tx.trade_date)} <br/> 
                               Giá: <strong>{formatCurrency(tx.price)}</strong> x {tx.quantity.toLocaleString('en-US')}
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                               <button onClick={() => deleteTrade(tx.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Xóa lệnh">
                                  <Trash2 size={18} />
                               </button>
                            </td>
                         </tr>
                      ))}
                      {/* Lịch sử Nạp/Rút tiền */}
                      {cashTransactions.map((cash) => (
                         <tr key={cash.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '16px 24px' }}>
                               <span className={`badge ${cash.transaction_type === 'DEPOSIT' ? 'buy' : 'sell'}`}>{cash.transaction_type === 'DEPOSIT' ? 'NẠP TIỀN' : 'RÚT TIỀN'}</span>
                            </td>
                            <td style={{ padding: '16px 24px', fontWeight: '700', fontSize: '16px', color: 'var(--accent-blue)' }}>{formatCurrency(cash.amount)}</td>
                            <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>{formatDate(cash.transaction_date)}</td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                               <button onClick={() => deleteCash(cash.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Xóa giao dịch">
                                  <Trash2 size={18} />
                               </button>
                            </td>
                         </tr>
                      ))}
                      {(enrichedTransactions.length === 0 && cashTransactions.length === 0) && (
                         <tr><td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có giao dịch nào</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
          
        </>
      )}
    </div>
  );
}
