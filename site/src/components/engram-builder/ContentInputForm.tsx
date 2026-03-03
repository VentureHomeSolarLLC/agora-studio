import { useEffect, useRef, useState } from 'react';
import { EngramFormData, CONTENT_TYPE_CONFIG } from '@/types/engram';

interface ContentInputFormProps {
  data: EngramFormData;
  onChange: (updates: Partial<EngramFormData>) => void;
  contentType: 'customer' | 'internal' | 'agent';
}

export function ContentInputForm({ data, onChange, contentType }: ContentInputFormProps) {
  const config = CONTENT_TYPE_CONFIG[contentType];
  const isAgent = contentType === 'agent';
  const importMode = data.agentImportMode || 'notes';
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const transcript = data.recordingTranscript || '';
  const canRecord =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof (navigator.mediaDevices as any).getDisplayMedia === 'function' &&
    typeof (window as any).MediaRecorder !== 'undefined';

  useEffect(() => {
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [recordingUrl]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const stopStreams = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    stopStreams();
    setIsRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    setRecordingError(null);
    setRecordingSeconds(0);
    setRecordingBlob(null);
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
        setRecordingBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        chunksRef.current = [];
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      const startedAt = Date.now();
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setRecordingSeconds(elapsed);
        if (elapsed >= 300) {
          stopRecording();
        }
      }, 1000);
    } catch (error: any) {
      setRecordingError(error?.message || 'Unable to start screen recording.');
      stopStreams();
      setIsRecording(false);
    }
  };

  const clearRecording = () => {
    setRecordingBlob(null);
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
    }
  };

  const transcribeRecording = async () => {
    if (!recordingBlob) return;
    setRecordingError(null);
    if (recordingBlob.size > 25 * 1024 * 1024) {
      setRecordingError('Recording is larger than 25MB. Please keep recordings under ~5 minutes.');
      return;
    }
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      const file = new File([recordingBlob], 'screen-recording.webm', { type: recordingBlob.type || 'video/webm' });
      formData.append('file', file);
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Transcription failed.');
      }
      const result = await response.json();
      onChange({ recordingTranscript: result.text || '' });
    } catch (error: any) {
      setRecordingError(error?.message || 'Transcription failed.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const insertTranscript = () => {
    if (!transcript) return;
    const marker = 'Screen Recording Transcript:';
    if (data.rawContent?.includes(marker)) return;
    const next = `${data.rawContent?.trim() || ''}\n\n${marker}\n${transcript}`.trim();
    onChange({ rawContent: next });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">{config.label} Content</h2>
        <p className="text-gray-500">{config.promptContent}</p>
        {data.title && (
          <p className="text-sm text-gray-400 mt-2">
            Title: <span className="text-gray-600">{data.title}</span>
          </p>
        )}
      </div>

      {isAgent && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Skill Source</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChange({ agentImportMode: 'notes' })}
              className={`px-4 py-3 rounded-lg border text-sm font-medium ${
                importMode === 'notes'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Draft new skill
            </button>
            <button
              type="button"
              onClick={() => onChange({ agentImportMode: 'monolith' })}
              className={`px-4 py-3 rounded-lg border text-sm font-medium ${
                importMode === 'monolith'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Import existing SKILL.md
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {importMode === 'monolith'
              ? 'Paste a full SKILL.md file and we will split it into Engram-ready concepts and lessons.'
              : 'Start with rough notes and we will build a new Engram skill from scratch.'}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.rawContent}
          onChange={(e) => onChange({ rawContent: e.target.value })}
          placeholder={
            isAgent && importMode === 'monolith'
              ? 'Paste the full SKILL.md content here (including any headings or YAML).'
              : "Paste your content here. Don't worry about formatting - the AI will structure it."
          }
          rows={12}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
        />
        <p className="text-sm text-gray-400 mt-2">
          Tip: {contentType === 'agent' 
            ? (importMode === 'monolith'
              ? 'Include the full skill content — we will detect concepts, lessons, and where they belong.'
              : 'Use bullet points or numbered steps if you have them.')
            : contentType === 'customer'
            ? 'Write naturally, like you are explaining to a friend.'
            : 'Include all technical details, edge cases, and gotchas.'}
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Screen Recording (optional)</h3>
        <p className="text-xs text-gray-500 mb-3">
          Record a walkthrough to capture details you might forget. We’ll transcribe it and use the transcript during AI analysis.
        </p>
        {!canRecord && (
          <p className="text-xs text-red-600">Screen recording isn’t supported in this browser.</p>
        )}
        {recordingError && (
          <p className="text-xs text-red-600">{recordingError}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!canRecord}
            className={`px-3 py-2 rounded-lg text-xs font-medium border ${
              isRecording ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            {isRecording ? 'Stop recording' : 'Start recording'}
          </button>
          {recordingBlob && (
            <>
              <button
                type="button"
                onClick={transcribeRecording}
                disabled={isTranscribing}
                className="px-3 py-2 rounded-lg text-xs font-medium border bg-gray-900 text-white border-gray-900 disabled:opacity-50"
              >
                {isTranscribing ? 'Transcribing…' : 'Transcribe recording'}
              </button>
              <button
                type="button"
                onClick={clearRecording}
                className="px-3 py-2 rounded-lg text-xs font-medium border bg-white text-gray-700 border-gray-200"
              >
                Clear recording
              </button>
            </>
          )}
          {isRecording && (
            <span className="text-xs text-gray-500">Recording: {formatDuration(recordingSeconds)} (max 05:00)</span>
          )}
        </div>
        {recordingUrl && (
          <div className="mt-3">
            <video className="w-full rounded-lg border border-gray-200" controls src={recordingUrl} />
          </div>
        )}
        {transcript && (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Transcript</label>
            <textarea
              value={transcript}
              onChange={(e) => onChange({ recordingTranscript: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={insertTranscript}
                className="text-xs px-3 py-1 rounded-full bg-emerald-600 text-white"
              >
                Insert transcript into content
              </button>
              <span className="text-xs text-gray-400">Transcript is automatically included in AI analysis.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
