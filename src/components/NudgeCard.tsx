import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Sparkles, Target, Heart, Brain, MessageCircle, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ExplainabilityModal } from './ExplainabilityModal';
import type { Nudge } from '../hooks/useMasterAgent';

interface NudgeCardProps {
  nudge: Nudge;
  onAccept: (nudgeId: string) => void;
  onDismiss: (nudgeId: string) => void;
  onNavigate?: (route: string) => void;
}

export const NudgeCard = memo(function NudgeCard({ nudge, onAccept, onDismiss, onNavigate }: NudgeCardProps) {
  const [showExplainability, setShowExplainability] = useState(false);

  // Don't show dismissed or accepted nudges
  if (nudge.status !== 'pending') {
    return null;
  }

  const handleAccept = () => {
    onAccept(nudge.id);

    // Navigate to CTA route if provided
    if (nudge.cta_route && onNavigate) {
      onNavigate(nudge.cta_route);
    }
  };

  const handleDismiss = () => {
    onDismiss(nudge.id);
  };

  // Get icon based on category
  const getCategoryIcon = () => {
    switch (nudge.category) {
      case 'goal_progress':
        return Target;
      case 'journal_reminder':
        return Heart;
      case 'tool_suggestion':
        return Brain;
      case 'chat_engagement':
        return MessageCircle;
      default:
        return Sparkles;
    }
  };

  // Get colors based on priority
  const getPriorityStyles = () => {
    switch (nudge.priority) {
      case 'high':
        return {
          bg: 'from-purple-50 to-pink-50',
          badge: 'bg-purple-100 text-purple-700',
          button: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
        };
      case 'medium':
        return {
          bg: 'from-blue-50 to-cyan-50',
          badge: 'bg-blue-100 text-blue-700',
          button: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
        };
      default:
        return {
          bg: 'from-green-50 to-emerald-50',
          badge: 'bg-green-100 text-green-700',
          button: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
        };
    }
  };

  const Icon = getCategoryIcon();
  const styles = getPriorityStyles();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`relative bg-gradient-to-r ${styles.bg} border-0 shadow-sm overflow-hidden`}>
          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => setShowExplainability(true)}
              className="w-6 h-6 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Why this nudge?"
              title="Why this nudge?"
            >
              <HelpCircle className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <button
              onClick={handleDismiss}
              className="w-6 h-6 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Dismiss nudge"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>

          <div className="p-4 pr-10">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gray-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">{nudge.title}</h3>
                  {nudge.priority === 'high' && (
                    <Badge className={`text-xs px-2 py-0.5 ${styles.badge}`}>
                      Priority
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{nudge.message}</p>
              </div>
            </div>

            {/* CTA Button */}
            {nudge.cta_label && (
              <div className="mt-3">
                <Button
                  onClick={handleAccept}
                  size="sm"
                  className={`${styles.button} text-white border-0 shadow-sm hover:shadow-md transition-all`}
                >
                  <span>{nudge.cta_label}</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Explainability Modal */}
        <ExplainabilityModal
          nudge={nudge}
          isOpen={showExplainability}
          onClose={() => setShowExplainability(false)}
        />
      </motion.div>
    </AnimatePresence>
  );
});
