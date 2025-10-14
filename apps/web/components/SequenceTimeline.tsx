import { SequenceStep } from "@/lib/api";

interface SequenceTimelineProps {
  steps: SequenceStep[];
}

export function SequenceTimeline({ steps }: SequenceTimelineProps) {
  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Add steps to see the sequence timeline</p>
      </div>
    );
  }

  // Calculate cumulative delays for positioning
  const cumulativeDelays = steps.reduce((acc, step, index) => {
    if (index === 0) {
      acc.push(0);
    } else {
      acc.push(acc[index - 1] + steps[index].delay_days);
    }
    return acc;
  }, [] as number[]);

  const maxDelay = Math.max(...cumulativeDelays);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 border border-indigo-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Sequence Timeline
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300"></div>

        {/* Timeline steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const cumulativeDelay = cumulativeDelays[index];
            const toneEmoji = {
              professional: "💼",
              friendly: "😊",
              urgent: "⚡",
            }[step.tone];

            return (
              <div
                key={index}
                className="flex flex-col items-center flex-1"
                style={{
                  flexGrow: index === 0 ? 0.5 : 1,
                }}
              >
                {/* Circle marker */}
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center text-2xl
                  transition-all duration-300 hover:scale-110
                  ${index === 0
                    ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-300'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-300'
                  }
                  border-4 border-white z-10
                `}>
                  {index === 0 ? '🚀' : toneEmoji}
                </div>

                {/* Step info */}
                <div className="mt-4 text-center max-w-[150px]">
                  <div className={`
                    inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mb-2
                    ${index === 0
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    }
                  `}>
                    {index === 0 ? 'Initial Email' : `Follow-up ${index}`}
                  </div>

                  <div className="text-sm font-medium text-gray-900 mb-1 truncate" title={step.subject}>
                    {step.subject}
                  </div>

                  <div className="text-xs text-gray-600 mb-1 capitalize">
                    {step.tone} tone
                  </div>

                  {index === 0 ? (
                    <div className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                      Day 0
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                      Day {cumulativeDelay}
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        (+{step.delay_days}d from previous)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="mt-8 pt-6 border-t border-indigo-200 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-700">
                <span className="font-semibold">{steps.length}</span> total email{steps.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">
                <span className="font-semibold">{cumulativeDelays[cumulativeDelays.length - 1]}</span> day{cumulativeDelays[cumulativeDelays.length - 1] !== 1 ? 's' : ''} duration
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500 italic">
            Timeline runs until recipient replies or all steps complete
          </div>
        </div>
      </div>
    </div>
  );
}
