'use client';

import dynamic from 'next/dynamic';

const PhaserGame = dynamic(() => import('../components/PhaserGame'), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
      <h1 className="text-4xl font-bold my-4">Typing Game</h1>
      <PhaserGame />
    </div>
  );
}