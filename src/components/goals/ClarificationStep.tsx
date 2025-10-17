import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ClarificationQuestion {
  question: string;
  purpose: string;
}

interface ClarificationStepProps {
  questions: ClarificationQuestion[];
  onSubmit: (answers: Array<{ questionId: number; answer: string }>) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export const ClarificationStep: React.FC<ClarificationStepProps> = ({
  questions,
  onSubmit,
  onSkip,
  isLoading = false,
}) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = () => {
    const answersArray = questions
      .map((_, index) => ({
        questionId: index,
        answer: answers[index] || '',
      }))
      .filter((answer) => answer.answer.trim() !== '');

    onSubmit(answersArray);
  };

  const allQuestionsAnswered = questions.every(
    (_, index) => answers[index]?.trim()
  );
  const hasAtLeastOneAnswer = Object.values(answers).some((a) => a?.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
          <span className="text-3xl">💭</span>
        </div>
        <h2 className="text-2xl font-bold text-white">
          Let's Clarify Your Goal
        </h2>
        <p className="text-gray-400">
          Answer these questions to help create a personalized action plan
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, index) => {
          const isExpanded = expandedQuestion === index;
          const hasAnswer = answers[index]?.trim();

          return (
            <motion.div
              key={index}
              className={`
                border-2 rounded-xl overflow-hidden transition-all duration-200
                ${
                  isExpanded
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500/5 to-pink-500/5'
                    : hasAnswer
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-gray-700 bg-gray-800/50'
                }
              `}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Question Header */}
              <button
                onClick={() =>
                  setExpandedQuestion(isExpanded ? null : index)
                }
                className="w-full p-4 text-left flex items-start gap-3 hover:bg-white/5 transition-colors"
              >
                <div
                  className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                  ${
                    hasAnswer
                      ? 'bg-green-500 text-white'
                      : isExpanded
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }
                `}
                >
                  {hasAnswer ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{q.question}</h3>
                  <p className="text-sm text-gray-400 mt-1">{q.purpose}</p>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 text-gray-400"
                >
                  ▼
                </motion.div>
              </button>

              {/* Answer Input */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-700"
                  >
                    <div className="p-4">
                      <textarea
                        value={answers[index] || ''}
                        onChange={(e) =>
                          handleAnswerChange(index, e.target.value)
                        }
                        placeholder="Share your thoughts..."
                        className="w-full bg-white border border-gray-300 rounded-lg p-3 text-black placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                        rows={4}
                        disabled={isLoading}
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Optional - Skip if not applicable
                        </p>
                        {hasAnswer && (
                          <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={() => {
                              handleAnswerChange(index, '');
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Clear
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {Object.keys(answers).filter((k) => answers[Number(k)]?.trim()).length} of{' '}
            {questions.length} answered
          </span>
          <span className="text-gray-500">Optional</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{
              width: `${
                (Object.keys(answers).filter((k) => answers[Number(k)]?.trim())
                  .length /
                  questions.length) *
                100
              }%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onSkip}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Skip for Now
        </button>
        <button
          onClick={handleSubmit}
          disabled={!hasAtLeastOneAnswer || isLoading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⚙️
              </motion.span>
              Generating Plan...
            </span>
          ) : allQuestionsAnswered ? (
            'Generate Action Plan'
          ) : (
            'Continue with Answers'
          )}
        </button>
      </div>

      {/* Info Note */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <p className="text-sm text-blue-300">
              <strong>Tip:</strong> The more context you provide, the better your
              personalized action plan will be. But don't worry - you can skip
              questions and still get a great plan!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
