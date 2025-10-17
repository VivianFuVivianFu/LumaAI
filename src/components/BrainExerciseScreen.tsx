import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Brain, Sparkles, ChevronRight, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toolsApi } from '../lib/api';
import { useMasterAgent } from '../hooks/useMasterAgent';

interface BrainExerciseScreenProps {
  onBack: () => void;
}

interface ExerciseResult {
  id: string;
  title: string;
  reframe: string;
  micro_action: string;
  why_it_helps: string;
  created_at: string;
}

interface AlternativeExercise {
  title: string;
  reframe: string;
  micro_action: string;
}

export function BrainExerciseScreen({ onBack }: BrainExerciseScreenProps) {
  const { logEvent } = useMasterAgent();
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [contextDescription, setContextDescription] = useState('');
  const [originalThought, setOriginalThought] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exercise, setExercise] = useState<ExerciseResult | null>(null);
  const [alternativeExercises, setAlternativeExercises] = useState<AlternativeExercise[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!contextDescription.trim() || !originalThought.trim()) {
      setError('Please fill in both fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await toolsApi.createBrainExercise({
        context_description: contextDescription,
        original_thought: originalThought,
      });

      setExercise(result.exercise);
      setAlternativeExercises(result.alternative_exercises || []);
      setStep('result');

      // Phase 3: Log brain exercise completion event
      logEvent({
        event_type: 'tool_completed',
        feature_area: 'tools',
        event_data: {
          tool_type: 'brain_exercise',
          exercise_id: result.exercise.id,
          has_alternatives: (result.alternative_exercises || []).length > 0,
        },
      });
    } catch (err: any) {
      console.error('Failed to create brain exercise:', err);
      setError(err.message || 'Failed to generate exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setContextDescription('');
    setOriginalThought('');
    setExercise(null);
    setAlternativeExercises([]);
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
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900">Empower My Brain</h1>
            <p className="text-sm text-gray-600">Neuroplasticity Exercises for Mental Health and Inner Strength</p>
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
                    Let's empower who you are.
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Reshape unhelpful thought patterns and develop more balanced, empowering perspectives.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6 mb-4">
              <label className="block mb-3">
                <span className="text-sm font-medium text-gray-700">
                  What's the situation? <span className="text-red-500">*</span>
                </span>
                <textarea
                  value={contextDescription}
                  onChange={(e) => setContextDescription(e.target.value)}
                  placeholder="Describe what happened or what you're dealing with..."
                  className="mt-2 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  rows={3}
                />
              </label>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6 mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  What's the thought you're having? <span className="text-red-500">*</span>
                </span>
                <textarea
                  value={originalThought}
                  onChange={(e) => setOriginalThought(e.target.value)}
                  placeholder="What are you telling yourself about this situation?"
                  className="mt-2 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  rows={3}
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
              disabled={isLoading || !contextDescription.trim() || !originalThought.trim()}
              className="w-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Exercise...</span>
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{exercise.title}</h2>
              <p className="text-sm text-gray-500">
                Created {new Date(exercise.created_at).toLocaleDateString()}
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Reframed Thought</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{exercise.reframe}</p>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Micro-Action</h3>
              <p className="text-gray-700 leading-relaxed">{exercise.micro_action}</p>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Why This Helps</h3>
              <p className="text-gray-700 leading-relaxed">{exercise.why_it_helps}</p>
            </Card>

            {alternativeExercises.length > 0 && (
              <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-green-200 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🌟</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">More Exercise Options</h3>
                    <p className="text-sm text-gray-600 mt-1">Try these alternative approaches for the same challenge</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {alternativeExercises.map((alt, index) => (
                    <div key={index} className="p-4 bg-white/70 rounded-lg border border-green-200 hover:bg-white/90 hover:border-green-300 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{alt.title}</h4>
                      </div>
                      <div className="ml-8 space-y-2">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-green-700">Reframe:</span> {alt.reframe}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-green-700">Action:</span> {alt.micro_action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-100/50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    💡 <strong>Tip:</strong> Different approaches work for different moments. Try each one and see which resonates most.
                  </p>
                </div>
              </Card>
            )}

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
