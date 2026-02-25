interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === current;
        const isCompleted = stepNum < current;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : isCompleted
                    ? 'bg-[#7AEFB1] text-gray-900'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span className={`text-xs mt-2 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${isCompleted ? 'bg-[#7AEFB1]' : 'bg-gray-100'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
