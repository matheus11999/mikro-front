import React, { useState, useEffect } from 'react';
import { supabase, testConnection, debugConfig } from '../lib/supabaseClient';

const SupabaseDebug = () => {
  const [config, setConfig] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<boolean | null>(null);
  const [authTest, setAuthTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setConfig(debugConfig());
  }, []);

  const runConnectionTest = async () => {
    setLoading(true);
    try {
      const result = await testConnection();
      setConnectionTest(result);
    } catch (error) {
      setConnectionTest(false);
      console.error('Connection test failed:', error);
    }
    setLoading(false);
  };

  const runAuthTest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      setAuthTest({ data, error });
    } catch (error) {
      setAuthTest({ error });
    }
    setLoading(false);
  };

  const testDatabase = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('count')
        .limit(1);
      
      console.log('Database test result:', { data, error });
      alert(`Database test: ${error ? 'FAILED - ' + error.message : 'SUCCESS'}`);
    } catch (error) {
      console.error('Database test error:', error);
      alert('Database test FAILED: ' + (error as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Supabase Debug Panel</h1>
      
      {/* Configuration */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Configuration</h2>
        <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      {/* Tests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Connection Test</h3>
          <button
            onClick={runConnectionTest}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
          {connectionTest !== null && (
            <div className={`mt-2 text-sm ${connectionTest ? 'text-green-600' : 'text-red-600'}`}>
              {connectionTest ? '✅ Connection OK' : '❌ Connection Failed'}
            </div>
          )}
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Auth Test</h3>
          <button
            onClick={runAuthTest}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Auth'}
          </button>
          {authTest && (
            <div className="mt-2 text-xs">
              <pre className="bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(authTest, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Database Test</h3>
          <button
            onClick={testDatabase}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Database'}
          </button>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Environment Variables</h2>
        <div className="space-y-2 text-sm">
          <div>
            <strong>VITE_SUPABASE_URL:</strong> 
            <span className={`ml-2 ${import.meta.env.VITE_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}`}>
              {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not Set'}
            </span>
          </div>
          <div>
            <strong>VITE_SUPABASE_KEY:</strong>
            <span className={`ml-2 ${import.meta.env.VITE_SUPABASE_KEY ? 'text-green-600' : 'text-red-600'}`}>
              {import.meta.env.VITE_SUPABASE_KEY ? '✅ Set' : '❌ Not Set'}
            </span>
          </div>
          <div>
            <strong>VITE_SUPABASE_SERVICE_ROLE:</strong>
            <span className={`ml-2 ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE ? 'text-green-600' : 'text-gray-500'}`}>
              {import.meta.env.VITE_SUPABASE_SERVICE_ROLE ? '✅ Set' : '⚠️ Optional'}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions for EasyPanel</h3>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Go to your EasyPanel project settings</li>
          <li>Navigate to Environment Variables section</li>
          <li>Add the required variables: VITE_SUPABASE_URL, VITE_SUPABASE_KEY</li>
          <li>Rebuild/redeploy your application</li>
          <li>Run the tests above to verify configuration</li>
        </ol>
      </div>
    </div>
  );
};

export default SupabaseDebug; 