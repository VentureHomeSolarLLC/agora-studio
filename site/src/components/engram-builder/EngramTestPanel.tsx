import { useState } from 'react';
import { EngramFormData } from '@/types/engram';

interface EngramTestPanelProps {
  data: EngramFormData;
}

export function EngramTestPanel({ data }: EngramTestPanelProps) {
  const [allowWrites, setAllowWrites] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const requiredIntegrations = Array.isArray(data.aiAnalysis?.requiredIntegrations)
    ? data.aiAnalysis.requiredIntegrations
    : [];

  const runTest = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const response = await fetch('/api/engrams/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: data, allowWrites }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Test failed');
      }
      const payload = await response.json();
      setTestResult(payload);
    } catch (err: any) {
      setError(err?.message || 'Test failed.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Test Engram</h2>
        <p className="text-gray-500">
          Run a live integration test on the VM to validate credentials and tool access.
        </p>
      </div>

      <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-sm text-amber-900">
        This test hits real systems (Graph, Salesforce, Google). Writes are disabled by default.
      </div>

      <div className="flex items-center gap-3">
        <input
          id="allow-writes"
          type="checkbox"
          checked={allowWrites}
          onChange={(e) => setAllowWrites(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="allow-writes" className="text-sm text-gray-700">
          Allow writes (use test resources only)
        </label>
      </div>

      {requiredIntegrations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Integrations to Test</h3>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
            {requiredIntegrations.map((item: any, idx: number) => (
              <li key={`req-${idx}`}>{item.name}</li>
            ))}
          </ul>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <button
        type="button"
        onClick={runTest}
        disabled={isRunning}
        className="bg-gray-900 text-white px-6 py-3 rounded-lg disabled:opacity-50"
      >
        {isRunning ? 'Running test…' : 'Run test on VM'}
      </button>

      {testResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Test Summary</h3>
            <span className="text-xs text-gray-500">Logs: {testResult.logPath}</span>
          </div>
          <div className="text-sm text-gray-600">
            Passed: {testResult.summary?.passed || 0} · Failed: {testResult.summary?.failed || 0} · Skipped:{' '}
            {testResult.summary?.skipped || 0}
          </div>
          <div className="space-y-2">
            {Array.isArray(testResult.checks) &&
              testResult.checks.map((check: any, idx: number) => (
                <div key={`check-${idx}`} className="flex items-center justify-between text-sm">
                  <span className="text-gray-800">{check.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full border text-xs ${
                      check.status === 'pass'
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        : check.status === 'fail'
                        ? 'border-red-200 text-red-700 bg-red-50'
                        : 'border-gray-200 text-gray-500 bg-gray-50'
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
