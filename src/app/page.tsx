import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold mb-4 text-white">🚀 Stock Pro</h1>
        <p className="text-xl text-gray-400 mb-10">Realtime tín hiệu từ Siêu Tín Hiệu</p>
        
        <Link 
          href="/dashboard"
          className="inline-block px-10 py-4 bg-green-600 hover:bg-green-700 rounded-2xl text-xl font-semibold transition"
        >
          Vào Dashboard Realtime →
        </Link>
      </div>
    </div>
  );
}
