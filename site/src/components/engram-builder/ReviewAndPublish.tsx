import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

interface ReviewAndPublishProps {
  data: EngramFormData;
  onPublish: () => void;
  isSubmitting: boolean;
  contentType: 'customer' | 'internal' | 'agent';
}

export function ReviewAndPublish({ data, onPublish, isSubmitting, contentType }: ReviewAndPublishProps) {
  const config = CONTENT_TYPE_CONFIG[contentType];
  
  // Determine what files will be created
  const files = [];
  if (contentType === 'customer') {
    files.push('📄 customer-pages/[id]/_index.md');
  } else if (contentType === 'internal') {
    files.push('📄 concepts/[id]/_index.md');
  } else {
    files.push('📄 engrams-v2/[id]/_index.md');
    files.push('📄 engrams-v2/[id]/SKILL.md');
    if (data.concepts?.length > 0) {
      files.push(`📄 engrams-v2/[id]/concepts/ (${data.concepts.length} files)`);
    }
    if (data.lessons?.length > 0) {
      files.push(`📄 engrams-v2/[id]/lessons/ (${data.lessons.length} files)`);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review & Publish</h2>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">🎉 Ready to Add to Agora Library</h3>
        <p className="text-sm text-green-800">
          Thank you for contributing to Venture Home's knowledge base! Your content will help train AI agents 
          and assist team members for years to come.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Type:</span>
            <p className="font-medium">{config.label}</p>
          </div>
          <div>
            <span className="text-gray-500">Category:</span>
            <p className="font-medium capitalize">{data.category || 'Not set'}</p>
          </div>
          <div>
            <span className="text-gray-500">Audience:</span>
            <p className="font-medium capitalize">{data.audience?.join(', ')}</p>
          </div>
          <div>
            <span className="text-gray-500">Tags:</span>
            <p className="font-medium">{data.tags?.length || 0} tags</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Files that will be created ({files.length}):</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {files.map((file, i) => (
              <li key={i}>{file}</li>
            ))}
          </ul>
        </div>

        {contentType === 'customer' && data.aiAnalysis?.suggestedAdditions?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              <strong>💡 Tip:</strong> This content could also generate {data.aiAnalysis.suggestedAdditions.length} 
              agent training materials. Consider converting to AI Agent Instructions for maximum value.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onPublish}
        disabled={isSubmitting || !data.title || !data.category}
        className="w-full bg-gray-900 text-white px-6 py-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Publishing to Agora Library...
          </>
        ) : (
          '📚 Publish to Agora Library'
        )}
      </button>
    </div>
  );
}
