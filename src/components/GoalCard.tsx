import { motion } from 'motion/react';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Goal, goalCategories } from './GoalsScreen';

interface GoalCardProps {
  goal: Goal;
  onToggleAction: (goalId: string, actionId: string) => void;
  goalCategories: typeof goalCategories;
  getInsightForCategory: (categoryId: string) => string;
}

export function GoalCard({ goal, onToggleAction, goalCategories, getInsightForCategory }: GoalCardProps) {
  const category = goalCategories.find(cat => cat.id === goal.category);
  const CategoryIcon = category?.icon || Sparkles;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
      {/* Goal Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${category?.bgClass || 'bg-purple-100'} rounded-lg flex items-center justify-center`}>
              <CategoryIcon className={`w-5 h-5 ${category?.textClass || 'text-purple-700'}`} />
            </div>
            <div>
              <h3 className="text-gray-900 mb-1">{goal.title}</h3>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={`${category?.bgClass || 'bg-purple-100'} ${category?.textClass || 'text-purple-700'} border-0 text-xs`}
                >
                  {category?.name || 'Personal Growth'}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="text-xs border-gray-300 text-gray-600"
                >
                  {goal.timeframe === 'short' ? 'Short-term' : 'Long-term'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm text-gray-900">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>
      </div>

      {/* Weekly Actions */}
      <div className="px-6 pb-4">
        <h4 className="text-gray-900 mb-3">This Week's Plan</h4>
        <div className="space-y-2">
          {goal.weeklyActions.map((action) => (
            <motion.button
              key={action.id}
              onClick={() => onToggleAction(goal.id, action.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {action.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <span 
                className={`${
                  action.completed 
                    ? 'text-gray-500 line-through' 
                    : 'text-gray-900'
                }`}
              >
                {action.title}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* AI Insight */}
      <div className={`mx-6 mb-6 p-4 bg-gradient-to-r ${category?.gradientClass || 'from-purple-400 to-purple-500'} rounded-lg`}>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="text-white text-sm">
              <span className="opacity-90">AI Insight:</span> "{getInsightForCategory(goal.category)}"
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}