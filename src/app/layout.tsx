// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stock Pro - Realtime Signals từ Siêu Tín Hiệu',
  description: 'Dashboard realtime MA20 + MACD từ sieutinhieu.vn',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      {/* Đã xóa bg-gray-950 và text-white để tránh xung đột giao diện */}
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
