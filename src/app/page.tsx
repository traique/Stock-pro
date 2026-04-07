import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-6">Stock Pro</h1>
        <p className="text-xl text-gray-400 mb-10">Realtime signals từ Siêu Tín Hiệu</p>
        <Link 
          href="/dashboard"
          className="px-10 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-xl font-semibold inline-block"
        >
          Vào Dashboard Realtime →
        </Link>
      </div>
    </div>
  );
}
