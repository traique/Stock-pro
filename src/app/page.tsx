import Link from 'next/link';
import { Activity, Bell } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d131f] text-white flex flex-col items-center justify-center p-6">
      
      {/* Tiêu đề chính */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-extrabold mb-4 flex items-center justify-center gap-4">
          🚀 Stock Pro
        </h1>
        <p className="text-xl text-gray-400">Hệ thống phân tích và tín hiệu chứng khoán Realtime</p>
      </div>

      {/* Menu Điều hướng */}
      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        
        {/* Card 1: Bảng Tín hiệu */}
        <Link 
          href="/signals" 
          className="group bg-[#1e293b] hover:bg-[#2dd4bf]/10 border border-gray-800 hover:border-[#2dd4bf] rounded-3xl p-8 transition-all duration-300 shadow-lg"
        >
          <div className="bg-[#2dd4bf]/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Bell className="text-[#2dd4bf]" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Bảng Tín Hiệu Live</h2>
          <p className="text-gray-400 leading-relaxed">
            Theo dõi các tín hiệu BUY/SELL mạnh nhất trong ngày theo thời gian thực từ hệ thống Siêu Tín Hiệu.
          </p>
        </Link>

        {/* Card 2: Phân tích & Hiệu suất (Dashboard) */}
        <Link 
          href="/dashboard" 
          className="group bg-[#1e293b] hover:bg-blue-500/10 border border-gray-800 hover:border-blue-500 rounded-3xl p-8 transition-all duration-300 shadow-lg"
        >
          <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Activity className="text-blue-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Phân Tích Cổ Phiếu</h2>
          <p className="text-gray-400 leading-relaxed">
            Tra cứu hiệu suất chiến lược, tỷ lệ thắng, lợi nhuận tổng và lịch sử giao dịch chi tiết của từng mã.
          </p>
        </Link>

      </div>
    </div>
  );
}
