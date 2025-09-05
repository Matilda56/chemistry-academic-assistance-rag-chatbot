'use client';

import Link from 'next/link';
// from app/student-login -> ../../lib/withBase
import { withBase } from '/workspace/rag-bot/ui/app/lib/withBase.ts';

export default function StudentLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-300 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-graduation-cap-line text-3xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Student Login</h1>
          <p className="text-gray-600 mt-2">
            Click the button below to start chatting with the chemistry assistant
          </p>
        </div>

        <Link
          href={withBase('/chat')}
          prefetch={false}
          className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-chat-3-line mr-3" />
          Start Chat
        </Link>

        <div className="text-center mt-6">
          <Link
            href={withBase('/')}
            prefetch={false}
            className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
