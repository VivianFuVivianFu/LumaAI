import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Circle, Trophy, MessageCircle, ArrowRight } from 'lucide-react';

interface Sprint {
  sprintNumber: number;
  title: string;
  description: string;
  durationWeeks: number;
  actions: string[];
}

interface LifeCoachingSessionProps {
  goalTitle: string;
  sprints: Sprint[];
  currentSprintIndex: number;
  onBack: () => void;
}

export const LifeCoachingSession: React.FC<LifeCoachingSessionProps> = ({
  goalTitle,
  sprints,
  currentSprintIndex: initialSprintIndex,
  onBack,
}) => {
  const [currentSprintIndex, setCurrentSprintIndex] = useState(initialSprintIndex);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasAutoProgressed, setHasAutoProgressed] = useState(false);
  const currentSprint = sprints[currentSprintIndex];
  const progress = (completedActions.size / currentSprint.actions.length) * 100;
  const isSprintComplete = progress === 100;

  // Handle sprint completion and auto-progression
  useEffect(() => {
    if (isSprintComplete && !showCelebration && !hasAutoProgressed) {
      setShowCelebration(true);
      setHasAutoProgressed(true);

      // After showing celebration, auto-jump to next sprint if available
      const timer = setTimeout(() => {
        setShowCelebration(false);
        if (currentSprintIndex < sprints.length - 1) {
          setCurrentSprintIndex(currentSprintIndex + 1);
          setCompletedActions(new Set()); // Reset actions for new sprint
          setHasAutoProgressed(false); // Reset for next sprint
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSprintComplete, showCelebration, hasAutoProgressed, currentSprintIndex, sprints.length]);

  const toggleAction = (actionIndex: number) => {
    const actionKey = `${currentSprintIndex}-${actionIndex}`;
    const newCompleted = new Set(completedActions);
    if (newCompleted.has(actionKey)) {
      newCompleted.delete(actionKey);
    } else {
      newCompleted.add(actionKey);
    }
    setCompletedActions(newCompleted);
  };

  const isActionCompleted = (actionIndex: number) => {
    return completedActions.has(`${currentSprintIndex}-${actionIndex}`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{goalTitle}</h2>
            <p className="text-gray-400">Sprint {currentSprint.sprintNumber} of {sprints.length}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-400">{Math.round(progress)}%</div>
            <p className="text-sm text-gray-400">Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Current Sprint Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 rounded-xl"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-lg shadow-lg">
            {currentSprint.sprintNumber}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">{currentSprint.title}</h3>
            <p className="text-gray-300 text-sm">{currentSprint.description}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
              <span>⏱ {currentSprint.durationWeeks} weeks</span>
              <span>📋 {currentSprint.actions.length} actions</span>
            </div>
          </div>
        </div>

        {/* AI Coach Message */}
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-200 text-sm font-medium mb-1">Your Coach:</p>
              <p className="text-gray-300 text-sm leading-relaxed">
                {isSprintComplete
                  ? `🎉 Amazing work! You've completed Sprint ${currentSprint.sprintNumber}. You're building real momentum!`
                  : `Let's focus on Sprint ${currentSprint.sprintNumber}. Remember, small consistent actions lead to big results. Check off each action as you complete it!`}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions Checklist */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>✅</span>
          Sprint Actions
        </h4>

        {currentSprint.actions.map((action, index) => {
          const completed = isActionCompleted(index);
          return (
            <motion.button
              key={index}
              onClick={() => toggleAction(index)}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                completed
                  ? 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30'
                  : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-600'
                  }`}
                >
                  {completed && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm leading-relaxed ${completed ? 'text-gray-300 line-through' : 'text-gray-200'}`}>
                    {action}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Roadmap Visualization */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 rounded-xl"
      >
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Your Progress Journey
        </h4>

        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-700 rounded-full">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentSprintIndex / (sprints.length - 1)) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          {/* Sprint Milestones */}
          <div className="flex justify-between relative">
            {sprints.map((sprint, index) => {
              const isPast = index < currentSprintIndex;
              const isCurrent = index === currentSprintIndex;
              const isFuture = index > currentSprintIndex;

              return (
                <div key={sprint.sprintNumber} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm z-10 border-4 transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-300 text-white shadow-lg shadow-purple-500/50'
                        : isPast
                        ? 'bg-green-500 border-green-300 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-400'
                    }`}
                  >
                    {isPast ? <Check className="w-6 h-6" /> : sprint.sprintNumber}
                  </div>
                  <div className="mt-2 text-center max-w-20">
                    <p className={`text-xs font-medium ${isCurrent ? 'text-purple-300' : isPast ? 'text-green-400' : 'text-gray-400'}`}>
                      Sprint {sprint.sprintNumber}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-2xl text-center max-w-md">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">Sprint Complete!</h3>
              <p className="text-white/90">
                You've completed all actions for Sprint {currentSprint.sprintNumber}. Keep up the amazing work!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="w-full py-3 bg-gray-700 text-gray-200 rounded-xl font-medium hover:bg-gray-600 transition-all"
      >
        Back to Goals
      </button>
    </div>
  );
};
