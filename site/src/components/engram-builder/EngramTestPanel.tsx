import { useEffect, useState } from 'react';
import { EngramFormData } from '@/types/engram';

interface EngramTestPanelProps {
  data: EngramFormData;
}

export function EngramTestPanel({ data }: EngramTestPanelProps) {
  const [allowWrites, setAllowWrites] = useState(false);
  const [isRunningHealth, setIsRunningHealth] = useState(false);
  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);
  const [agentResult, setAgentResult] = useState<any>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [healthLog, setHealthLog] = useState<string>('');
  const [agentLog, setAgentLog] = useState<string>('');
  const requiredIntegrations = Array.isArray(data.aiAnalysis?.requiredIntegrations)
    ? data.aiAnalysis.requiredIntegrations
    : [];

  const runHealthCheck = async () => {
    setIsRunningHealth(true);
    setHealthError(null);
    setHealthLog('');
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
      setHealthResult(payload);
    } catch (err: any) {
      setHealthError(err?.message || 'Health checks failed.');
    } finally {
      setIsRunningHealth(false);
    }
  };

  const runAgentExecution = async () => {
    setIsRunningAgent(true);
    setAgentError(null);
    setAgentLog('');
    try {
      const response = await fetch('/api/engrams/test-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: data, allowWrites }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Agent execution failed');
      }
      const payload = await response.json();
      setAgentResult(payload);
    } catch (err: any) {
      setAgentError(err?.message || 'Agent execution failed.');
    } finally {
      setIsRunningAgent(false);
    }
  };

  const healthPassed = Boolean(healthResult && healthResult.summary?.failed === 0);

  useEffect(() => {
    if (!healthResult?.logPath || !isRunningHealth) return;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch('/api/engrams/test-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logPath: healthResult.logPath }),
        });
        if (response.ok) {
          const payload = await response.json();
          setHealthLog(payload.text || '');
        }
      } catch {
        // ignore log polling errors
      }
    }, 1500);
    return () => window.clearInterval(interval);
  }, [healthResult?.logPath, isRunningHealth]);

  useEffect(() => {
    if (!agentResult?.logPath || !isRunningAgent) return;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch('/api/engrams/test-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logPath: agentResult.logPath }),
        });
        if (response.ok) {
          const payload = await response.json();
          setAgentLog(payload.text || '');
        }
      } catch {
        // ignore log polling errors
      }
    }, 1500);
    return () => window.clearInterval(interval);
  }, [agentResult?.logPath, isRunningAgent]);
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

      {healthError && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{healthError}</div>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runHealthCheck}
          disabled={isRunningHealth}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {isRunningHealth ? 'Running health checks…' : 'Run integration health checks'}
        </button>
        <button
          type="button"
          onClick={runAgentExecution}
          disabled={isRunningAgent || !healthPassed}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {isRunningAgent ? 'Running agent execution…' : 'Run full sub-agent execution'}
        </button>
      </div>
      {!healthPassed && healthResult && (
        <p className="text-xs text-amber-700 mt-2">
          Fix failed health checks before running the full execution.
        </p>
      )}

      {healthResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Test Summary</h3>
            <span className="text-xs text-gray-500">Logs: {healthResult.logPath}</span>
          </div>
          <div className="text-sm text-gray-600">
            Passed: {healthResult.summary?.passed || 0} · Failed: {healthResult.summary?.failed || 0} · Skipped:{' '}
            {healthResult.summary?.skipped || 0}
          </div>
          <div className="space-y-2">
            {Array.isArray(healthResult.checks) &&
              healthResult.checks.map((check: any, idx: number) => (
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
          {healthLog && (
            <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-64 overflow-auto">
              {healthLog}
            </pre>
          )}
        </div>
      )}

      {agentError && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{agentError}</div>}

      {agentResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Agent Execution</h3>
            <span className="text-xs text-gray-500">Logs: {agentResult.logPath}</span>
          </div>
          <div className="text-sm text-gray-600">
            Test ID: {agentResult.testId}
          </div>
          {agentResult.summary && (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm text-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">OpenClaw Summary</span>
                <span
                  className={`px-2 py-0.5 rounded-full border text-xs ${
                    agentResult.summary.status === 'pass'
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                      : agentResult.summary.status === 'fail'
                      ? 'border-red-200 text-red-700 bg-red-50'
                      : 'border-gray-200 text-gray-500 bg-gray-50'
                  }`}
                >
                  {agentResult.summary.status || 'unknown'}
                </span>
              </div>
              {Array.isArray(agentResult.summary.missingInputs) && agentResult.summary.missingInputs.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Missing inputs</div>
                  <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                    {agentResult.summary.missingInputs.map((item: string, idx: number) => (
                      <li key={`missing-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(agentResult.summary.unclearSteps) && agentResult.summary.unclearSteps.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Unclear steps / conflicts</div>
                  <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                    {agentResult.summary.unclearSteps.map((item: string, idx: number) => (
                      <li key={`unclear-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(agentResult.summary.simulatedActions) && agentResult.summary.simulatedActions.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Simulated external actions</div>
                  <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                    {agentResult.summary.simulatedActions.map((item: string, idx: number) => (
                      <li key={`sim-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(agentResult.summary.filesWritten) && agentResult.summary.filesWritten.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Files written</div>
                  <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                    {agentResult.summary.filesWritten.map((item: string, idx: number) => (
                      <li key={`files-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(agentResult.summary.notes) && agentResult.summary.notes.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Notes</div>
                  <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                    {agentResult.summary.notes.map((item: string, idx: number) => (
                      <li key={`notes-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {agentLog && (
            <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-64 overflow-auto">
              {agentLog}
            </pre>
          )}
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-64 overflow-auto">
            {JSON.stringify(agentResult.result || {}, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
