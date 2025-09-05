'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// ✅ correct path: from app/admin-dashboard -> ../../lib/withBase
import { withBase } from '/workspace/rag-bot/ui/app/lib/withBase.ts';

export default function AdminDashboard() {
  const router = useRouter();

  // Only render the dashboard after we check auth on the client
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    // Run on client: check admin login flag
    const adminStatus = typeof window !== 'undefined'
      ? localStorage.getItem('adminLoggedIn')
      : null;

    if (adminStatus === 'true') {
      setIsAuthenticated(true);
      setReady(true);
    } else {
      // Not logged in → go to login (use replace so user cannot go back)
      router.replace(withBase('/admin-login'));
    }
  }, [router]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
    // TODO: uploadFilesToBackend(newFiles)
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('adminLoggedIn');
    } catch {}
    // Back to home (replace)
    router.replace(withBase('/'));
  };

  // Show a minimal splash while we are checking auth on client
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-300 flex items-center justify-center">
        <div className="text-white text-xl">Authenticating...</div>
      </div>
    );
  }

  // If somehow not authed after ready, show nothing (we already redirected)
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-300 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
              <i className="ri-admin-line text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Console</h1>
              <p className="text-gray-600">Chemistry Assistant Management System</p>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Back to Home (no prefetch to avoid proxy prefetch issues) */}
            <Link
              href={withBase('/')}
              prefetch={false}
              className="text-purple-600 hover:text-purple-800 cursor-pointer"
            >
              Back to Home
            </Link>

            {/* (optional) Go to Chat */}
            <Link
              href={withBase('/chat')}
              prefetch={false}
              className="text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Chat
            </Link>

            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            File Upload Management
          </h2>

          {/* Upload */}
          <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 mb-6 text-center">
            <input
              id="fileUpload"
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="fileUpload" className="cursor-pointer">
              <i className="ri-cloud-line text-6xl text-purple-400 mb-4"></i>
              <p className="text-gray-600 text-lg mb-2">
                Click to upload files or drag and drop here
              </p>
              <p className="text-gray-500 text-sm">
                Supports PDF, DOC, TXT and other formats
              </p>
            </label>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Uploaded Files</h3>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
                  >
                    <div className="flex items-center">
                      <i className="ri-file-text-line text-2xl text-blue-600 mr-3"></i>
                      <div>
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-xl"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
