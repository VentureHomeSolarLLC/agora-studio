import { EngramFormData, ContentType, CONTENT_TYPE_CONFIG, AgentProfile, AGENT_DOMAIN_SUGGESTIONS } from '@/types/engram';

interface BasicInfoFormProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
  contentType: ContentType;
}

export function BasicInfoForm({ data, onChange, contentType }: BasicInfoFormProps) {
  const config = CONTENT_TYPE_CONFIG[contentType];
  const agentProfile = data.agentProfile;
  const isKnowledgeOnly = agentProfile?.skillMode === 'knowledge';

  const updateAgentProfile = (updates: Partial<AgentProfile>) => {
    onChange({ agentProfile: { ...agentProfile, ...updates } });
  };

  const asList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
  const asText = (values?: string[]) => values?.join(', ') || '';
  const asLines = (values?: string[]) => values?.join('\n') || '';
  const linesToList = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean);
  const setSkillMode = (mode: AgentProfile['skillMode']) => {
    const updates: Partial<AgentProfile> = { skillMode: mode };
    if (mode === 'knowledge') {
      updates.skillType = 'knowledge';
    } else if (agentProfile?.skillType === 'knowledge') {
      updates.skillType = 'procedural';
    }
    updateAgentProfile(updates);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Basic Information</h2>
        <p className="text-gray-500">{config.promptTitle}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={config.promptTitle}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Brief description..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        />
      </div>

      {contentType === 'agent' && (
        <div className="space-y-6 border-t pt-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Skill Profile</h3>
            <p className="text-sm text-gray-500">
              Define the outcome, triggers, and constraints so the agent knows exactly when and how to run this skill.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium mb-3">Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSkillMode('procedure')}
                className={`px-4 py-3 rounded-lg border text-sm font-medium ${
                  !isKnowledgeOnly
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Procedure
              </button>
              <button
                type="button"
                onClick={() => setSkillMode('knowledge')}
                className={`px-4 py-3 rounded-lg border text-sm font-medium ${
                  isKnowledgeOnly
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Knowledge-only
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Procedure mode expects step-by-step execution. Knowledge-only mode captures reference material without required steps.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {!isKnowledgeOnly && (
              <div>
                <label className="block text-sm font-medium mb-2">Skill Type</label>
                <select
                  value={agentProfile?.skillType || 'procedural'}
                  onChange={(e) => updateAgentProfile({ skillType: e.target.value as AgentProfile['skillType'] })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
                >
                  <option value="consultation">Consultation</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="procedural">Procedural</option>
                  <option value="creative">Creative</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Risk Level</label>
              <select
                value={agentProfile?.riskLevel || 'medium'}
                onChange={(e) => updateAgentProfile({ riskLevel: e.target.value as AgentProfile['riskLevel'] })}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Knowledge Classification {isKnowledgeOnly && <span className="text-red-500">*</span>}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Domain</label>
                <input
                  list="agent-domain-suggestions"
                  value={agentProfile?.domain || ''}
                  onChange={(e) => updateAgentProfile({ domain: e.target.value })}
                  placeholder="e.g., operations"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
                />
                <datalist id="agent-domain-suggestions">
                  {AGENT_DOMAIN_SUGGESTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subdomains</label>
                <input
                  type="text"
                  value={asText(agentProfile?.subdomains)}
                  onChange={(e) => updateAgentProfile({ subdomains: asList(e.target.value) })}
                  placeholder="e.g., energy_savings, efficiency"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated.</p>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Trigger Questions</label>
              <textarea
                value={asLines(agentProfile?.triggerQuestions)}
                onChange={(e) => updateAgentProfile({ triggerQuestions: linesToList(e.target.value) })}
                placeholder="Add one question per line\nExample: How can I save on my electric bill?"
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
              />
              <p className="text-xs text-gray-400 mt-1">These help agents route questions to the right Engram.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Outcome (Definition of Done)</label>
            <textarea
              value={agentProfile?.outcome || ''}
              onChange={(e) => updateAgentProfile({ outcome: e.target.value })}
              placeholder="Describe what success looks like..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Triggers</label>
            <input
              type="text"
              value={asText(agentProfile?.triggers)}
              onChange={(e) => updateAgentProfile({ triggers: asList(e.target.value) })}
              placeholder="e.g., customer wants to add EV charger, breaker panel full"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated phrases that should activate the skill.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Required Inputs</label>
            <input
              type="text"
              value={asText(agentProfile?.requiredInputs)}
              onChange={(e) => updateAgentProfile({ requiredInputs: asList(e.target.value) })}
              placeholder="e.g., site survey, utility account, panel photos"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Constraints / No-Go Rules</label>
            <textarea
              value={asText(agentProfile?.constraints)}
              onChange={(e) => updateAgentProfile({ constraints: asList(e.target.value) })}
              placeholder="e.g., do not schedule same-day installs, never promise incentives"
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Allowed Systems</label>
            <input
              type="text"
              value={asText(agentProfile?.allowedSystems)}
              onChange={(e) => updateAgentProfile({ allowedSystems: asList(e.target.value) })}
              placeholder="e.g., Aurora, Salesforce, Enphase portal"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Escalation Criteria</label>
            <textarea
              value={asText(agentProfile?.escalationCriteria)}
              onChange={(e) => updateAgentProfile({ escalationCriteria: asList(e.target.value) })}
              placeholder="e.g., customer requests financing exception, safety concerns found"
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stop Conditions</label>
            <textarea
              value={asText(agentProfile?.stopConditions)}
              onChange={(e) => updateAgentProfile({ stopConditions: asList(e.target.value) })}
              placeholder="e.g., missing required docs, unsafe electrical condition"
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
