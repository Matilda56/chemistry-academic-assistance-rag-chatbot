'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { withBase } from '/workspace/rag-bot/ui/app/lib/withBase.ts';

export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const bubbleTransform = {
    transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.01}px)`,
    transition: 'transform 0.1s ease-out',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Made by tag */}
        <div className="absolute top-6 right-6 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
          <span className="text-xs text-gray-600">Made by Peiyin</span>
        </div>

        {/* Robot icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
            <i className="ri-robot-2-line text-4xl text-white"></i>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-700 mb-3 drop-shadow">
          Chemistry Academic Assistant
        </h1>
        <p className="text-lg text-gray-600 mb-8 drop-shadow-sm">
          Your intelligent chemistry learning partner
        </p>

        {/* Speech bubble */}
        <div className="mb-8 flex justify-center" style={bubbleTransform}>
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-6 py-4 shadow-xl max-w-sm relative">
            <p className="text-gray-700 text-sm leading-relaxed">
              I&apos;m the Chemistry Academic assistant at
              <br />
              Durham University. What would you like to know?
            </p>
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
              <div className="w-6 h-6 bg-white/90 rotate-45"></div>
            </div>
          </div>
        </div>

        {/* Login buttons */}
        <div className="flex gap-6 justify-center">
          <Link
            href={withBase('/admin-login')}
            prefetch={false}
            className="inline-flex items-center justify-center bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-xl transform hover:scale-105 transition-all duration-200 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-admin-line mr-2" />
            Admin Login
          </Link>

          <Link
            href={withBase('/student-login')}
            prefetch={false}
            className="inline-flex items-center justify-center bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-xl transform hover:scale-105 transition-all duration-200 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-graduation-cap-line mr-2" />
            Student Login
          </Link>
        </div>
      </div>
    </div>
  );
}
