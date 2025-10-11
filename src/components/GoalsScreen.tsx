import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Target, 
  Plus, 
  Home,
  Calendar,
  Clock,
  Heart,
  Briefcase,
  GraduationCap,
  Users,
  Dumbbell,
  DollarSign,
  Star,
  Lightbulb,
  CircleCheck,
  TrendingUp,
  MessageSquare,
  MoreHorizontal,
  Activity,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { AddGoalModal } from './AddGoalModal';
import { GoalCard } from './GoalCard';
import { PeerGroupSection } from './PeerGroupSection';

interface GoalsScreenProps {
  onBack: () => void;
  onShowChat: () => void;
  onShowJournal: () => void;
  onShowTools: () => void;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  timeframe: 'short' | 'long';
  progress: number;
  weeklyActions: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  aiInsight?: string;
}

// Goal categories with icons and colors
export const goalCategories = [
  { id: 'health', name: 'Health & Wellness', icon: Heart, bgClass: 'bg-red-100', textClass: 'text-red-600' },
  { id: 'career', name: 'Career & Work', icon: Briefcase, bgClass: 'bg-blue-100', textClass: 'text-blue-600' },
  { id: 'learning', name: 'Learning & Growth', icon: GraduationCap, bgClass: 'bg-green-100', textClass: 'text-green-600' },
  { id: 'relationships', name: 'Relationships', icon: Users, bgClass: 'bg-pink-100', textClass: 'text-pink-600' },
  { id: 'fitness', name: 'Fitness & Exercise', icon: Dumbbell, bgClass: 'bg-orange-100', textClass: 'text-orange-600' },
  { id: 'financial', name: 'Financial Goals', icon: DollarSign, bgClass: 'bg-yellow-100', textClass: 'text-yellow-600' },
  { id: 'personal', name: 'Personal Development', icon: Star, bgClass: 'bg-purple-100', textClass: 'text-purple-600' },
  { id: 'creative', name: 'Creative Projects', icon: Lightbulb, bgClass: 'bg-indigo-100', textClass: 'text-indigo-600' }
];

export function GoalsScreen({ onBack, onShowChat, onShowJournal, onShowTools }: GoalsScreenProps) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddGoalForm, setShowAddGoalForm] = useState(true); // Always show form at top
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'short' | 'long' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);

  const handleAddGoal = (goalData: any) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: goalData.title,
      description: goalData.description || '',
      category: goalData.category,
      timeframe: goalData.timeframe,
      progress: 0,
      weeklyActions: [
        { id: '1', text: 'Complete initial planning', completed: false },
        { id: '2', text: 'Set up daily routine', completed: false },
        { id: '3', text: 'Track first milestone', completed: false }
      ]
    };
    setGoals([...goals, newGoal]);
    setShowAddGoal(false);
  };

  const getInsightForCategory = (category: string) => {
    const insights = {
      health: 'Focus on small, consistent habits for lasting health improvements.',
      career: 'Building professional skills takes time, but each step compounds.',
      learning: 'Every new skill you learn opens doors to unexpected opportunities.',
      relationships: 'Strong relationships are built through consistent, genuine connection.',
      fitness: 'Physical strength builds mental resilience. Start small and be consistent.',
      financial: 'Financial freedom comes from making smart choices consistently over time.',
      personal: 'Personal growth happens in the space between comfort and challenge.',
      creative: 'Creativity flourishes when you give yourself permission to experiment.'
    };
    return insights[category as keyof typeof insights] || 'You\'re making progress, keep going!';
  };

  const toggleActionComplete = (goalId: string, actionId: string) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        const updatedActions = goal.weeklyActions.map(action => 
          action.id === actionId 
            ? { ...action, completed: !action.completed }
            : action
        );
        
        // Update progress based on completed actions
        const completedCount = updatedActions.filter(a => a.completed).length;
        const progress = Math.round((completedCount / updatedActions.length) * 100);
        
        return {
          ...goal,
          weeklyActions: updatedActions,
          progress
        };
      }
      return goal;
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-6 pt-12"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex items-center gap-2">
          <span>🎯</span>
          <h1 className="text-lg text-gray-900">Goals</h1>
        </div>
        
        <motion.button 
          onClick={onBack}
          className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home className="w-5 h-5 text-white" />
        </motion.button>
      </motion.div>

      <div className="px-6 space-y-6 pb-24">
        {/* Add Goal Form Section - Always visible at top */}
        {showAddGoalForm && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-sm">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-center text-gray-900">Set your goals — we'll achieve them together</h2>
              </div>
              
              {/* Step Indicator */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-center gap-4">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        step === currentStep 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' 
                          : step < currentStep
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <span className="text-sm">{step}</span>
                      </div>
                      {step < 3 && (
                        <div className={`w-12 h-0.5 mx-2 ${
                          step < currentStep ? 'bg-purple-200' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                {/* Step 1: Choose Timeframe */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-gray-900 mb-2">Choose timeframe</h3>
                      <p className="text-gray-600 text-sm mb-4">How long do you want to work on this goal?</p>
                    </div>

                    <div className="space-y-3">
                      {/* Short-term option */}
                      <button
                        onClick={() => setSelectedTimeframe('short')}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          selectedTimeframe === 'short'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-purple-500" />
                          <div>
                            <h4 className="text-gray-900 mb-1">Short-term</h4>
                            <p className="text-gray-600 text-sm">≤ 3 months</p>
                          </div>
                        </div>
                      </button>

                      {/* Long-term option */}
                      <button
                        onClick={() => setSelectedTimeframe('long')}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          selectedTimeframe === 'long'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-purple-500" />
                          <div>
                            <h4 className="text-gray-900 mb-1">Long-term</h4>
                            <p className="text-gray-600 text-sm">6-12 months</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Choose Category */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-gray-900 mb-2">Choose category</h3>
                      <p className="text-gray-600 text-sm mb-4">What area of your life does this goal focus on?</p>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {goalCategories.map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                              selectedCategory === category.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg ${category.bgClass} flex items-center justify-center`}>
                                <IconComponent className={`w-4 h-4 ${category.textClass}`} />
                              </div>
                              <span className="text-gray-900">{category.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Describe Goal */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-gray-900 mb-2">Describe your goal</h3>
                      <p className="text-gray-600 text-sm mb-4">What do you want to achieve? Include any challenging parts.</p>
                    </div>

                    {/* Category + Timeframe Tag */}
                    {selectedCategory && selectedTimeframe && (
                      <div className="mb-4">
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                          {goalCategories.find(c => c.id === selectedCategory)?.name} • {selectedTimeframe === 'short' ? 'Short-term' : 'Long-term'}
                        </Badge>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Goal Title */}
                      <div>
                        <label className="block text-gray-900 mb-2">Goal Title</label>
                        <Input
                          type="text"
                          placeholder="e.g., Daily meditation practice"
                          value={goalTitle}
                          onChange={(e) => setGoalTitle(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      {/* Description & Challenges */}
                      <div>
                        <label className="block text-gray-900 mb-2">Description & Challenges</label>
                        <Textarea
                          placeholder="Describe what you want to achieve and what might be challenging about it..."
                          value={goalDescription}
                          onChange={(e) => setGoalDescription(e.target.value)}
                          className="w-full min-h-24"
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                {currentStep === 1 ? (
                  <div className="flex justify-end w-full">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={!selectedTimeframe}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </Button>
                  </div>
                ) : currentStep === 2 ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="text-gray-600 border-gray-300 hover:bg-gray-100"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={!selectedCategory}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="text-gray-600 border-gray-300 hover:bg-gray-100"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        if (goalTitle.trim() && selectedCategory && selectedTimeframe) {
                          const newGoal = {
                            title: goalTitle.trim(),
                            description: goalDescription.trim(),
                            category: selectedCategory,
                            timeframe: selectedTimeframe
                          };
                          handleAddGoal(newGoal);
                          // Reset form
                          setCurrentStep(1);
                          setSelectedTimeframe(null);
                          setSelectedCategory(null);
                          setGoalTitle('');
                          setGoalDescription('');
                          setShowAddGoalForm(false);
                        }
                      }}
                      disabled={!goalTitle.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Goal
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Goals Header - Show when form is hidden */}
        {!showAddGoalForm && (
          <motion.div
            className="text-center space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Target className="w-6 h-6 text-purple-600" />
                <h2 className="text-gray-900">My Goals</h2>
              </div>
              <p className="text-gray-600 text-sm">
                "Every step you take today shapes tomorrow."
              </p>
            </div>
            
            <Button
              onClick={() => setShowAddGoalForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl h-12 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add a Goal
            </Button>
          </motion.div>
        )}

        {/* Goals List */}
        {goals.length > 0 && (
          <motion.div
            className="space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                goalCategories={goalCategories}
                onToggleAction={toggleActionComplete}
                getInsightForCategory={getInsightForCategory}
              />
            ))}
          </motion.div>
        )}

        {/* Peer Support Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <PeerGroupSection 
            goals={goals} 
            categories={goalCategories} 
          />
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <motion.div
        className="fixed bottom-6 left-6 right-6"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-2">
          <div className="grid grid-cols-4 gap-1">
            {[
              { icon: MessageSquare, label: 'Chat', active: false, onClick: onShowChat },
              { icon: Target, label: 'Goals', active: true, onClick: () => {} },
              { icon: Activity, label: 'Journal', active: false, onClick: onShowJournal },
              { icon: Star, label: 'Tools', active: false, onClick: onShowTools }
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <motion.button
                  key={item.label}
                  onClick={item.onClick}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
                    item.active
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <AddGoalModal
          onClose={() => setShowAddGoal(false)}
          onSubmit={handleAddGoal}
          goalCategories={goalCategories}
        />
      )}
    </div>
  );
}