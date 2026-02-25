import { LessonInput } from '@/types/engram';

interface LessonsBuilderProps {
  data: LessonInput[];
  onChange: (data: LessonInput[]) => void;
}

export function LessonsBuilder({ data, onChange }: LessonsBuilderProps) {
  const addLesson = () => {
    onChange([
      ...data,
      {
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        severity: 'medium',
      },
    ]);
  };

  const updateLesson = (index: number, updates: Partial<LessonInput>) => {
    const newLessons = [...data];
    newLessons[index] = { ...newLessons[index], ...updates };
    onChange(newLessons);
  };

  const removeLesson = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lessons Learned</h2>
        <button onClick={addLesson} className="text-sm px-3 py-1 bg-[#F7FF96] text-gray-900 rounded-lg font-medium">+ Add Lesson</button>
      </div>

      <p className="text-sm text-gray-500">
        Lessons are edge cases, bugs, and gotchas discovered while working with this engram.
        They help future agents avoid the same pitfalls.
      </p>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
          No lessons yet. Click "Add Lesson" to document learned experiences.
        </div>
      )}

      {data.map((lesson, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Lesson {index + 1}</span>
            <button onClick={() => removeLesson(index)} className="p-1 hover:bg-red-100 text-red-600 rounded">×</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={lesson.date}
                onChange={(e) => updateLesson(index, { date: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Severity</label>
              <select
                value={lesson.severity || 'medium'}
                onChange={(e) => updateLesson(index, { severity: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={lesson.title}
              onChange={(e) => updateLesson(index, { title: e.target.value })}
              placeholder="e.g., FICO Edge Case with High Income"
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={lesson.content}
              onChange={(e) => updateLesson(index, { content: e.target.value })}
              placeholder="Describe the problem, root cause, and solution..."
              rows={5}
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Author (optional)</label>
            <input
              type="text"
              value={lesson.author || ''}
              onChange={(e) => updateLesson(index, { author: e.target.value })}
              placeholder="rex@venturehome.com"
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
