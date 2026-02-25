import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

interface ReviewAndPublishProps {
  data: EngramFormData;
  onPublish: () => void;
  isSubmitting: boolean;
  contentType: 'customer' | 'internal' | 'agent';
}

export function ReviewAndPublish({ data, onPublish, isSubmitting, contentType }: ReviewAndPublishProps) {
  const config = CONTENT_TYPE_CONFIG[contentType];
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Review & Publish</h2>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-[#F7FF96] text-gray-900 rounded-full text-sm font-medium">
            {config.label}
          </span>
          <span className="text-gray-500">→ {config.outputPath}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Title:</span>
            <p className="font-medium">{data.title || 'Not set'}</p>
          </div>
          <div>
            <span className="text-gray-500">Category:</span>
            <p className="font-medium capitalize">{data.category || 'Not set'}</p>
          </div>
        </div>

        <div>
          <span className="text-gray-500 text-sm">Tags:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {data.tags?.length ? (
              data.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 bg-gray-200 rounded-full">{tag}</span>
              ))
            ) : (
              <span className="text-sm text-gray-400">No tags</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-gray-500 text-sm">Audience:</span>
          <p className="font-medium capitalize">{data.audience?.join(', ') || config.audience.join(', ')}</p>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium text-gray-900 mb-2">Content Preview</h4>
          <div className="bg-white rounded p-3 text-sm text-gray-600 max-h-40 overflow-y-auto">
            {data.rawContent?.substring(0, 300)}
            {data.rawContent && data.rawContent.length > 300 ? '...' : ''}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Publishing will create a commit in the agora-studio repository.
          {contentType === 'agent' ? ' AI agents will be able to use these instructions.' : 
           contentType === 'customer' ? ' This will appear on the help site for customers.' :
           ' This will be available for employee reference.'}
        </p>
      </div>

      <button
        onClick={onPublish}
        disabled={isSubmitting || !data.title || !data.category}
        className="w-full bg-gray-900 text-white px-6 py-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Publishing...
          </>
        ) : (
          `Publish ${config.label}`
        )}
      </button>
    </div>
  );
}
