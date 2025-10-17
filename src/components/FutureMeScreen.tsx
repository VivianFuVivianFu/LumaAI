import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, ChevronRight, Home, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toolsApi } from '../lib/api';
import { useMasterAgent } from '../hooks/useMasterAgent';

interface FutureMeScreenProps {
  onBack: () => void;
}

interface FutureMeResult {
  id: string;
  visualization_script: string;
  affirmation_1: string;
  affirmation_2: string;
  affirmation_3: string;
  if_then_anchor: string;
  created_at: string;
}

export function FutureMeScreen({ onBack }: FutureMeScreenProps) {
  const { logEvent } = useMasterAgent();
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [goalOrTheme, setGoalOrTheme] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exercise, setExercise] = useState<FutureMeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!goalOrTheme.trim()) {
      setError('Please enter a goal or theme');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await toolsApi.createFutureMeExercise({
        goal_or_theme: goalOrTheme,
      });

      setExercise(result.exercise);
      setStep('result');

      // Phase 3: Log future me exercise completion event
      logEvent({
        event_type: 'tool_completed',
        feature_area: 'tools',
        event_data: {
          tool_type: 'future_me',
          exercise_id: result.exercise.id,
        },
      });
    } catch (err: any) {
      console.error('Failed to create future me exercise:', err);
      setError(err.message || 'Failed to generate exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setGoalOrTheme('');
    setExercise(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <motion.div
        className="flex justify-between items-center p-6 pt-12 bg-white/80 backdrop-blur-sm border-b border-white/20"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-white/50 hover:shadow-md hover:bg-white/90 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
          <span className="text-gray-900">Back</span>
        </motion.button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900">Future Me</h1>
            <p className="text-sm text-gray-600">Visualize your best self</p>
          </div>
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

      {/* Content */}
      <div className="px-6 py-8 pb-24">
        {step === 'input' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Meet Your Future Self
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    This exercise uses visualization and affirmations to help you connect with your
                    ideal future self. Research shows that mentally rehearsing success increases the
                    likelihood of achieving your goals.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6 mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  What goal or theme would you like to focus on? <span className="text-red-500">*</span>
                </span>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  Examples: "confidence in social situations", "consistent self-care routine", "career success"
                </p>
                <textarea
                  value={goalOrTheme}
                  onChange={(e) => setGoalOrTheme(e.target.value)}
                  placeholder="Describe the future version of yourself you want to embody..."
                  className="mt-2 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  rows={4}
                />
              </label>
            </Card>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl"
              >
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !goalOrTheme.trim()}
              className="w-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Visualization...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Generate Exercise</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </motion.div>
        )}

        {step === 'result' && exercise && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto space-y-4"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Future Me Exercise</h2>
              <p className="text-sm text-gray-500">
                Created {new Date(exercise.created_at).toLocaleDateString()}
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Visualization Script</h3>
              </div>
              <p className="text-sm text-purple-700 mb-3 italic">
                Find a quiet place, close your eyes, and read this slowly...
              </p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {exercise.visualization_script}
              </p>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Daily Affirmations</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed pt-0.5">{exercise.affirmation_1}</p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl">
                  <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed pt-0.5">{exercise.affirmation_2}</p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed pt-0.5">{exercise.affirmation_3}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">If-Then Anchor</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Use this implementation intention to turn your vision into action:
              </p>
              <p className="text-gray-800 leading-relaxed font-medium bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
                {exercise.if_then_anchor}
              </p>
            </Card>

            <Card className="bg-blue-50 border-blue-200 p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Practice Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Read your visualization script every morning</li>
                    <li>Say your affirmations out loud with conviction</li>
                    <li>Practice your if-then anchor in real situations</li>
                    <li>Notice when you're already being your future self</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleReset}
              className="w-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Create Another Exercise
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
