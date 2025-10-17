import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface WeeklyAction {
  id: string;
  action_text: string;
  completed: boolean;
  week_number: number;
}

interface SprintCardProps {
  sprintNumber: number;
  title: string;
  description: string;
  weeklyActions: WeeklyAction[];
  onToggleAction: (actionId: string, completed: boolean) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const SprintCard: React.FC<SprintCardProps> = ({
  sprintNumber,
  title,
  description,
  weeklyActions,
  onToggleAction,
  isExpanded = false,
  onToggleExpand,
}) => {
  // Group actions by week
  const actionsByWeek = weeklyActions.reduce((acc, action) => {
    if (!acc[action.week_number]) {
      acc[action.week_number] = [];
    }
    acc[action.week_number].push(action);
    return acc;
  }, {} as Record<number, WeeklyAction[]>);

  const weeks = Object.keys(actionsByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  // Calculate progress
  const completedCount = weeklyActions.filter((a) => a.completed).length;
  const totalCount = weeklyActions.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isCompleted = completedCount === totalCount && totalCount > 0;

  return (
    <motion.div
      layout
      className={`
        border-2 rounded-xl overflow-hidden transition-all duration-200
        ${
          isCompleted
            ? 'border-green-500/50 bg-green-500/5'
            : isExpanded
            ? 'border-purple-500 bg-gradient-to-br from-purple-500/5 to-pink-500/5'
            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
        }
      `}
    >
      {/* Sprint Header */}
      <button
        onClick={onToggleExpand}
        className="w-full p-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Sprint Number Badge */}
          <div
            className={`
            flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-lg
            ${
              isCompleted
                ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }
          `}
          >
            {isCompleted ? '✓' : sprintNumber}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  {title}
                  {isCompleted && (
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                      Complete
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-400">{description}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-gray-500">
                    📅 {weeks.length} weeks
                  </span>
                  <span className="text-xs text-gray-500">
                    ✓ {completedCount}/{totalCount} actions
                  </span>
                </div>
              </div>

              {/* Expand Icon */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 text-gray-400 text-xl"
              >
                ▼
              </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    isCompleted
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Sprint Content - Weekly Actions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-700"
          >
            <div className="p-5 space-y-4">
              {weeks.map((weekNumber) => {
                const weekActions = actionsByWeek[weekNumber];
                const weekCompleted = weekActions.every((a) => a.completed);

                return (
                  <motion.div
                    key={weekNumber}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: weekNumber * 0.05 }}
                    className={`
                      p-4 rounded-lg border
                      ${
                        weekCompleted
                          ? 'bg-green-500/5 border-green-500/30'
                          : 'bg-gray-900/50 border-gray-700'
                      }
                    `}
                  >
                    {/* Week Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h5
                        className={`font-semibold ${
                          weekCompleted ? 'text-green-400' : 'text-white'
                        }`}
                      >
                        Week {weekNumber}
                      </h5>
                      {weekCompleted && (
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                          ✓ Complete
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {weekActions.map((action, actionIndex) => (
                        <motion.div
                          key={action.id}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: actionIndex * 0.03 }}
                          className={`
                            flex items-start gap-3 p-3 rounded-lg transition-all
                            ${
                              action.completed
                                ? 'bg-gray-800/50'
                                : 'bg-gray-800 hover:bg-gray-700/80'
                            }
                          `}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() =>
                              onToggleAction(action.id, !action.completed)
                            }
                            className={`
                              flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                              ${
                                action.completed
                                  ? 'bg-gradient-to-br from-green-500 to-emerald-500 border-green-500'
                                  : 'border-gray-600 hover:border-purple-500'
                              }
                            `}
                          >
                            {action.completed && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-white text-sm font-bold"
                              >
                                ✓
                              </motion.span>
                            )}
                          </button>

                          {/* Action Text */}
                          <p
                            className={`
                              flex-1 text-sm transition-all
                              ${
                                action.completed
                                  ? 'text-gray-500 line-through'
                                  : 'text-gray-300'
                              }
                            `}
                          >
                            {action.action_text}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
