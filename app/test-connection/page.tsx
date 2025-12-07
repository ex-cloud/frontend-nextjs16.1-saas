'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { healthApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function TestConnectionPage() {
  const { user, isAuthenticated } = useAuth();

  const { data: healthCheck, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Backend Connection Test</h1>

      <div className="space-y-6">
        {/* Health Check */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">API Health Check</h2>
          {isLoading && (
            <p className="text-gray-600">Checking backend connection...</p>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-medium">Connection Error</p>
              <p className="text-red-600 text-sm mt-1">
                {error instanceof Error ? error.message : 'Failed to connect to backend'}
              </p>
            </div>
          )}
          {healthCheck && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-800 font-medium">✓ Connected Successfully</p>
              <pre className="text-sm mt-2 bg-gray-50 p-3 rounded overflow-auto">
                {JSON.stringify(healthCheck, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Auth Status */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Status:</span>{' '}
              <span className={isAuthenticated ? 'text-green-600' : 'text-gray-600'}>
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </p>
            {user && (
              <div className="mt-3 bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium mb-2">User Info:</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Environment Info */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">API URL:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
              </code>
            </p>
            <p>
              <span className="font-medium">Environment:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {process.env.NODE_ENV}
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
