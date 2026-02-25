import { EngramFormData } from '@/types/engram';

interface ReviewAndPublishProps {
  data: EngramFormData;
  onPublish: () => void;
  isSubmitting: boolean;
}

export function ReviewAndPublish({ data, onPublish, isSubmitting }: ReviewAndPublishProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Review & Publish</h2>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="font-medium text-gray-900">Engram Summary</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Title:</span>
            <p className="font-medium">{data.title || 'Not set'}</p>
          </div>
          <div>
            <span className="text-gray-500">Category:</span>
            <p className="font-medium capitalize">{data.category || 'Not set'}</p>
          </div>
          <div>
            <span className="text-gray-500">Difficulty:</span>
            <p className="font-medium capitalize">{data.skill.difficulty}</p>
          </div>
          <div>
            <span className="text-gray-500">Time Estimate:</span>
            <p className="font-medium">{data.skill.time_estimate}</p>
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

        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Files that will be created ({2 + (data.concepts?.length || 0) + (data.lessons?.length || 0)}):
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>📄 _index.md (entry point)</li>
            <li>📄 SKILL.md (procedure)</li>
            {data.concepts?.map((c, i) => (
              <li key={i}>📄 concepts/{c.title.toLowerCase().replace(/\s+/g, '-')}.md</li>
            ))}
            {data.lessons?.map((l, i) => (
              <li key={i}>📄 lessons/{l.date}-{l.title.toLowerCase().replace(/\s+/g, '-')}.md</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Publishing will create a commit in the agora-studio repository.
          The engram will be live after the next Vercel deployment.
        </p>
      </div>

      <button
        onClick={onPublish}
        disabled={isSubmitting || !data.title || !data.category || data.skill.steps.length === 0}
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
          'Publish Engram'
        )}
      </button>
    </div>
  );
}
