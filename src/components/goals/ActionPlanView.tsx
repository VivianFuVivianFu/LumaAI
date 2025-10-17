import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { goalsApi } from '../../lib/api';

interface Sprint {
  sprintNumber: number;
  title: string;
  description: string;
  durationWeeks: number;
  actions: string[];
}

interface Risk {
  risk: string;
  mitigation: string;
}

interface ActionPlanData {
  smartStatement: string;
  totalSprints: number;
  sprints: Sprint[];
  risks: Risk[];
  encouragement: string;
  reasoning?: string; // New field for AI explanation
}

interface ActionPlanViewProps {
  planData: ActionPlanData;
  goalId: string;
  onComplete?: () => void;
  onPlanAdjusted?: (newPlanData: ActionPlanData) => void;
}

export const ActionPlanView: React.FC<ActionPlanViewProps> = ({
  planData,
  goalId,
  onComplete,
  onPlanAdjusted,
}) => {
  const [expandedSprint, setExpandedSprint] = useState<number | null>(0);
  const [showRisks, setShowRisks] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-2">
          <span className="text-4xl">✨</span>
        </div>
        <h2 className="text-3xl font-bold text-white">
          Your Action Plan is Ready!
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          We've created a personalized roadmap to help you achieve your goal
        </p>
      </motion.div>

      {/* SMART Statement */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-xl"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Your SMART Goal
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {planData.smartStatement}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Timeline Overview */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-sm text-gray-400">Journey Timeline</p>
              <p className="text-lg font-semibold text-white">
                {planData.totalSprints} Sprints
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Total Actions</p>
            <p className="text-lg font-semibold text-purple-400">
              {planData.sprints.reduce(
                (sum, sprint) => sum + sprint.actions.length,
                0
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Visual Roadmap - Progression Track */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 rounded-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🗺️</span>
          <div>
            <h3 className="text-lg font-semibold text-white">Your Roadmap to Success</h3>
            <p className="text-sm text-gray-400">Track your progress across all sprints</p>
          </div>
        </div>

        {/* Horizontal Timeline */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-700 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: '0%' }}
            />
          </div>

          {/* Sprint Milestones */}
          <div className="flex justify-between relative">
            {planData.sprints.map((sprint, index) => {
              const isFirst = index === 0;
              const isLast = index === planData.sprints.length - 1;
              const isCurrent = index === 0; // TODO: Track actual current sprint

              return (
                <div key={sprint.sprintNumber} className="flex flex-col items-center">
                  {/* Milestone Dot */}
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm z-10 border-4
                    ${isCurrent
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-300 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-700 border-gray-600 text-gray-400'
                    }
                  `}>
                    {sprint.sprintNumber}
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center max-w-20">
                    <p className={`text-xs font-medium ${isCurrent ? 'text-purple-300' : 'text-gray-400'}`}>
                      Sprint {sprint.sprintNumber}
                    </p>
                    {isFirst && (
                      <p className="text-xs text-green-400 mt-1">▶ Start</p>
                    )}
                    {isLast && (
                      <p className="text-xs text-yellow-400 mt-1">★ Goal!</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-700"></div>
              <span>Upcoming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Completed</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sprints */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <span>🚀</span>
          Sprint Breakdown
        </h3>

        {planData.sprints.map((sprint, index) => {
          const isExpanded = expandedSprint === index;
          const progress = 0; // TODO: Calculate from completed actions

          return (
            <motion.div
              key={sprint.sprintNumber}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="border-2 border-gray-700 rounded-xl overflow-hidden bg-gray-800/50 hover:border-gray-600 transition-colors"
            >
              {/* Sprint Header */}
              <button
                onClick={() =>
                  setExpandedSprint(isExpanded ? null : index)
                }
                className="w-full p-5 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-lg">
                    {sprint.sprintNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-1">
                          {sprint.title}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {sprint.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-gray-500">
                            ⏱ {sprint.durationWeeks} weeks
                          </span>
                          <span className="text-xs text-gray-500">
                            📋 {sprint.actions.length} actions
                          </span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0 text-gray-400 text-xl"
                      >
                        ▼
                      </motion.div>
                    </div>

                    {/* Progress Bar */}
                    {progress > 0 && (
                      <div className="mt-3">
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Sprint Actions */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-700"
                  >
                    <div className="p-5 space-y-3">
                      {sprint.actions.map((action, actionIndex) => (
                        <motion.div
                          key={actionIndex}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: actionIndex * 0.05 }}
                          className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-600 flex items-center justify-center text-xs text-gray-500">
                            {actionIndex + 1}
                          </div>
                          <p className="flex-1 text-sm text-gray-300">
                            {action}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Risks Section */}
      {planData.risks.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => setShowRisks(!showRisks)}
            className="w-full p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl hover:bg-yellow-500/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="text-left">
                  <h4 className="font-semibold text-yellow-300">
                    Potential Challenges & Solutions
                  </h4>
                  <p className="text-sm text-yellow-500/70">
                    {planData.risks.length} items to be aware of
                  </p>
                </div>
              </div>
              <motion.span
                animate={{ rotate: showRisks ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-yellow-400"
              >
                ▼
              </motion.span>
            </div>
          </button>

          <AnimatePresence>
            {showRisks && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 space-y-3"
              >
                {planData.risks.map((risk, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-red-400 font-semibold text-sm">
                          Risk:
                        </span>
                        <p className="text-gray-300 text-sm">{risk.risk}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400 font-semibold text-sm">
                          Solution:
                        </span>
                        <p className="text-gray-300 text-sm">
                          {risk.mitigation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* AI Reasoning - Conversational Explanation */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-xl"
      >
        <div className="flex items-start gap-4">
          <span className="text-3xl">🤖</span>
          <div className="flex-1 space-y-3">
            <h4 className="font-semibold text-blue-300 mb-2">
              Why We Designed Your Plan This Way
            </h4>
            <p className="text-gray-300 leading-relaxed">
              {planData.reasoning || `I've created this ${planData.totalSprints}-sprint plan based on your goal, timeframe, and circumstances. Each sprint builds on the previous one, creating sustainable momentum.

              The actions are sequenced to help you build foundational skills first, then progressively tackle more complex challenges. This approach reduces overwhelm and increases your chances of success.

              The risks section prepares you for common obstacles, so you'll know exactly how to respond when challenges arise.`}
            </p>
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 mt-4">
              <p className="text-sm text-blue-200">
                <strong>Key principle:</strong> Consistency beats intensity. Small, regular actions compound into remarkable results over time.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Encouragement */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-xl"
      >
        <div className="flex items-start gap-4">
          <span className="text-3xl">💪</span>
          <div className="flex-1">
            <h4 className="font-semibold text-green-300 mb-2">
              You've Got This!
            </h4>
            <p className="text-gray-300 leading-relaxed">
              {planData.encouragement}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Conversational Confirmation Dialog */}
      {!showConfirmDialog && onComplete && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-xl"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">💬</span>
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="font-semibold text-purple-300 mb-2">
                  Does this plan feel right for you?
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Take a moment to review your action plan. If something doesn't feel quite right, or you'd like to adjust the pacing or focus, let me know! This plan is meant to support you, not stress you out.
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Any adjustments or concerns? (Optional - you can also accept as-is)"
                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-black placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                  rows={3}
                />

                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (feedback.trim()) {
                        setIsAdjusting(true);
                        try {
                          const result = await goalsApi.adjustActionPlan(goalId, feedback);
                          if (onPlanAdjusted) {
                            onPlanAdjusted(result.planData);
                          }
                          setFeedback('');
                          alert('✨ Your action plan has been adjusted based on your feedback!');
                        } catch (error) {
                          console.error('Failed to adjust action plan:', error);
                          alert('Failed to adjust action plan. Please try again.');
                        } finally {
                          setIsAdjusting(false);
                        }
                      } else {
                        setShowConfirmDialog(true);
                      }
                    }}
                    disabled={isAdjusting}
                    className="flex-1 py-3 bg-gray-700 text-gray-200 rounded-xl font-medium hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdjusting ? 'Adjusting...' : feedback.trim() ? 'Request Adjustments' : 'Skip Feedback'}
                  </button>
                  <button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={isAdjusting}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Looks Perfect! ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Final Action Button - After Confirmation */}
      {showConfirmDialog && onComplete && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <p className="text-green-300 font-medium">
              ✓ Great! Your action plan is ready to activate
            </p>
          </div>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={onComplete}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-xl"
          >
            Start Your Journey 🚀
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};
