
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-300 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <i className="ri-error-warning-line text-8xl text-purple-600 mb-4"></i>
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
          <p className="text-lg text-blue-100 mb-8">
            The page you are looking for does not exist.
          </p>
        </div>
        
        <Link href="/" className="bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 inline-block cursor-pointer">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
