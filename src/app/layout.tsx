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
      <body className="bg-gray-950 text-white">
        {children}
      </body>
    </html>
  );
}
