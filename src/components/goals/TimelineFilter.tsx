import React from 'react';
import { motion } from 'motion/react';

interface TimelineFilterProps {
  selectedTimeline: 'all' | '3-months' | '6-months' | '12-months';
  onTimelineChange: (timeline: 'all' | '3-months' | '6-months' | '12-months') => void;
  goalCounts?: {
    all: number;
    '3-months': number;
    '6-months': number;
    '12-months': number;
  };
}

const timelineOptions = [
  {
    value: 'all' as const,
    label: 'All Goals',
    description: 'View all your goals',
    icon: '🎯',
  },
  {
    value: '3-months' as const,
    label: '3 Months',
    description: 'Quick wins & habits',
    icon: '⚡',
  },
  {
    value: '6-months' as const,
    label: '6 Months',
    description: 'Skill building',
    icon: '🚀',
  },
  {
    value: '12-months' as const,
    label: '12 Months',
    description: 'Transformation',
    icon: '🌟',
  },
];

export const TimelineFilter: React.FC<TimelineFilterProps> = ({
  selectedTimeline,
  onTimelineChange,
  goalCounts,
}) => {
  return (
    <div className="w-full mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {timelineOptions.map((option) => {
          const isSelected = selectedTimeline === option.value;
          const count = goalCounts?.[option.value] || 0;

          return (
            <motion.button
              key={option.value}
              onClick={() => onTimelineChange(option.value)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                ${
                  isSelected
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-pink-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                  layoutId="timeline-selection"
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 flex items-start gap-3">
                <div className="text-2xl">{option.icon}</div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-semibold ${
                        isSelected ? 'text-white' : 'text-gray-200'
                      }`}
                    >
                      {option.label}
                    </h3>
                    {count > 0 && (
                      <span
                        className={`
                          px-2 py-0.5 text-xs rounded-full font-medium
                          ${
                            isSelected
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-700 text-gray-300'
                          }
                        `}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm mt-1 ${
                      isSelected ? 'text-gray-300' : 'text-gray-400'
                    }`}
                  >
                    {option.description}
                  </p>
                </div>
              </div>

              {/* Active Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
