import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

interface ReviewAndPublishProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
  onPublish: () => void;
  isSubmitting: boolean;
  contentType: 'customer' | 'internal' | 'agent';
}

export function ReviewAndPublish({ data, onChange, onPublish, isSubmitting, contentType }: ReviewAndPublishProps) {
  const config = CONTENT_TYPE_CONFIG[contentType];
  const duplicateCheck = data.duplicateCheck;
  const requiresDuplicateConfirm = contentType === 'customer' && duplicateCheck?.similar && !data.duplicateResolutionConfirmed;
  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const repoLinkForPath = (path: string) =>
    `https://github.com/VentureHomeSolarLLC/agora-studio/blob/main/${path}`;
  const resolveViewUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${baseOrigin}${url}`;
    return url;
  };
  
  const files: { name: string; path: string }[] = [];
  const autoFiles: string[] = [];
  const mergeFiles: string[] = [];
  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  
  if (contentType === 'customer') {
    files.push({ name: 'Customer article', path: 'customer-pages/[id]/_index.md' });
    
    // Auto-extracted files
    const conceptCount = data.agentExtraction?.concepts?.filter((c) => c.include).length || 0;
    const lessonCount = data.agentExtraction?.lessons?.filter((l) => l.include).length || 0;
    const mergeConcepts = data.agentExtraction?.concepts?.filter((c) => c.mergeTargetPath) || [];
    const mergeLessons = data.agentExtraction?.lessons?.filter((l) => l.mergeTargetPath) || [];
    
    if (conceptCount > 0 || lessonCount > 0) {
      const grouped: Record<string, { label: string; concepts: number; lessons: number }> = {};
      data.agentExtraction?.concepts?.filter((c) => c.include).forEach((concept) => {
        const label = concept.forEngram || data.title || 'general';
        const key = toSlug(label);
        grouped[key] = grouped[key] || { label, concepts: 0, lessons: 0 };
        grouped[key].concepts += 1;
      });
      data.agentExtraction?.lessons?.filter((l) => l.include).forEach((lesson) => {
        const label = lesson.forEngram || data.title || 'general';
        const key = toSlug(label);
        grouped[key] = grouped[key] || { label, concepts: 0, lessons: 0 };
        grouped[key].lessons += 1;
      });

      Object.entries(grouped).forEach(([slug, group]) => {
        const parts = [];
        if (group.concepts > 0) parts.push(`${group.concepts} concept${group.concepts > 1 ? 's' : ''}`);
        if (group.lessons > 0) parts.push(`${group.lessons} lesson${group.lessons > 1 ? 's' : ''}`);
        autoFiles.push(`${group.label} → engrams-v2/${slug} (${parts.join(', ')})`);
      });
    }

    if (mergeConcepts.length > 0 || mergeLessons.length > 0) {
      mergeConcepts.forEach((concept) => {
        mergeFiles.push(`Append concept to ${concept.mergeTargetPath} (${concept.mergeTargetTitle || 'existing concept'})`);
      });
      mergeLessons.forEach((lesson) => {
        mergeFiles.push(`Append lesson to ${lesson.mergeTargetPath} (${lesson.mergeTargetTitle || 'existing lesson'})`);
      });
    }
  } else if (contentType === 'internal') {
    files.push({ name: 'Internal doc', path: 'concepts/[id]/_index.md' });
  } else {
    files.push({ name: 'Engram index', path: 'engrams-v2/[id]/_index.md' });
    files.push({ name: 'Skill procedure', path: 'engrams-v2/[id]/SKILL.md' });
    if (data.concepts?.length) {
      files.push({ name: 'Concepts', path: `engrams-v2/[id]/concepts/ (${data.concepts.length} files)` });
    }
    if (data.lessons?.length) {
      files.push({ name: 'Lessons', path: `engrams-v2/[id]/lessons/ (${data.lessons.length} files)` });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review & Publish</h2>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">Ready to Add to Agora Library</h3>
        <p className="text-sm text-green-800">
          Thank you for contributing! Your content will be analyzed and organized for both human and AI consumption.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Type:</span> <p className="font-medium">{config.label}</p></div>
          <div><span className="text-gray-500">Category:</span> <p className="font-medium capitalize">{data.category || 'Not set'}</p></div>
          <div><span className="text-gray-500">Tags:</span> <p className="font-medium">{data.tags?.length || 0}</p></div>
        </div>

        {contentType === 'customer' && duplicateCheck?.similar && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">Potential duplicate content detected</h4>
            <p className="text-sm text-amber-800">
              We found similar existing knowledge. Review the closest matches below.
              If you still want to create a new customer-facing article, confirm and proceed.
            </p>
            <ul className="text-sm text-amber-900 mt-3 space-y-2">
              {duplicateCheck.matches.map((match, i) => (
                <li key={`${match.path}-${i}`} className="flex flex-col">
                  <span className="font-medium">{match.title}</span>
                  <span className="text-xs text-amber-700">
                    {match.type === 'customer-page'
                      ? 'Customer page'
                      : match.type === 'concept'
                      ? 'Concept'
                      : match.type === 'lesson'
                      ? 'Lesson'
                      : match.type === 'skill'
                      ? 'Skill'
                      : match.type === 'engram-v2'
                      ? 'Engram (v2)'
                      : 'Engram'}{' '}
                    • {match.path} • {Math.round(match.score * 100)}% similar
                  </span>
                  <a
                    href={resolveViewUrl(match.viewUrl) || repoLinkForPath(match.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-700 hover:underline mt-1"
                  >
                    Open existing content
                  </a>
                </li>
              ))}
            </ul>
            <label className="flex items-start gap-2 text-sm text-amber-900 mt-4">
              <input
                type="checkbox"
                checked={!!data.duplicateResolutionConfirmed}
                onChange={(e) => onChange({ duplicateResolutionConfirmed: e.target.checked })}
              />
              I understand there is overlapping content and still want to publish a new item.
            </label>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Files to create ({files.length}):</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {files.map((file, i) => (
              <li key={i}>📄 {file.name}: {file.path}</li>
            ))}
          </ul>
        </div>

        {autoFiles.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-1">AI-Detected Agent Training Materials:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {autoFiles.map((file, i) => (
                <li key={i}>🤖 {file}</li>
              ))}
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              These will be created as draft Engram files for review under `engrams-v2`.
            </p>
          </div>
        )}

        {mergeFiles.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="font-medium text-amber-900 mb-1">Updates to Existing Agent Files:</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              {mergeFiles.map((file, i) => (
                <li key={i}>🧩 {file}</li>
              ))}
            </ul>
            <p className="text-xs text-amber-700 mt-2">
              These updates will append new context to existing Engram files.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onPublish}
        disabled={isSubmitting || !data.title || !data.category || requiresDuplicateConfirm}
        className="w-full bg-gray-900 text-white px-6 py-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {requiresDuplicateConfirm
          ? 'Confirm duplicate notice to publish'
          : isSubmitting
          ? 'Publishing to Agora Library...'
          : '📚 Publish to Agora Library'}
      </button>
    </div>
  );
}
