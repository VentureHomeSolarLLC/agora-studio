import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

interface ReviewAndPublishProps {
  data: EngramFormData;
  onPublish: () => void;
  isSubmitting: boolean;
  contentType: 'customer' | 'internal' | 'agent';
}

export function ReviewAndPublish({ data, onPublish, isSubmitting, contentType }: ReviewAndPublishProps) {
  const config = CONTENT_TYPE_CONFIG[contentType];
  const analysis = data.aiAnalysis;
  
  const files = [];
  const autoFiles = [];
  
  if (contentType === 'customer') {
    files.push({ name: 'Customer article', path: 'customer-pages/[id]/_index.md' });
    
    // Auto-extracted files
    const conceptCount = analysis?.agentTrainingPotential?.suggestedConcepts?.length || 0;
    const lessonCount = analysis?.agentTrainingPotential?.suggestedLessons?.length || 0;
    
    if (conceptCount > 0) {
      autoFiles.push(`${conceptCount} concept file${conceptCount > 1 ? 's' : ''} for agent training`);
    }
    if (lessonCount > 0) {
      autoFiles.push(`${lessonCount} lesson file${lessonCount > 1 ? 's' : ''} for agent training`);
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
              These will be created as drafts for your review. They help AI agents learn from your customer content.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onPublish}
        disabled={isSubmitting || !data.title || !data.category}
        className="w-full bg-gray-900 text-white px-6 py-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? 'Publishing to Agora Library...' : '📚 Publish to Agora Library'}
      </button>
    </div>
  );
}
