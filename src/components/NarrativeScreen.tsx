import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Sparkles, ChevronRight, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toolsApi } from '../lib/api';
import { useMasterAgent } from '../hooks/useMasterAgent';

interface NarrativeScreenProps {
  onBack: () => void;
}

interface NarrativeResult {
  id: string;
  title: string;
  chapter_past: string;
  chapter_present: string;
  chapter_future: string;
  future_choice: string;
  created_at: string;
}

export function NarrativeScreen({ onBack }: NarrativeScreenProps) {
  const { logEvent } = useMasterAgent();
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [contextDescription, setContextDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [narrative, setNarrative] = useState<NarrativeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!contextDescription.trim()) {
      setError('Please describe your situation');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await toolsApi.createNarrative({
        context_description: contextDescription,
      });

      setNarrative(result.narrative);
      setStep('result');

      // Phase 3: Log narrative completion event
      logEvent({
        event_type: 'tool_completed',
        feature_area: 'tools',
        event_data: {
          tool_type: 'narrative',
          narrative_id: result.narrative.id,
        },
      });
    } catch (err: any) {
      console.error('Failed to create narrative:', err);
      setError(err.message || 'Failed to generate narrative. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setContextDescription('');
    setNarrative(null);
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
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900">My New Narrative</h1>
            <p className="text-sm text-gray-600">Rewrite your story</p>
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
                    Transform Your Story
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    This tool uses narrative therapy to help you reframe your life story from a place
                    of victimhood to one of agency and growth. You're not defined by what happened to
                    you - you're the author of what comes next.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6 mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  What's your situation? <span className="text-red-500">*</span>
                </span>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  Describe a challenge, pattern, or life situation you'd like to reframe
                </p>
                <textarea
                  value={contextDescription}
                  onChange={(e) => setContextDescription(e.target.value)}
                  placeholder="Share your story - where you've been, where you are now, and where you want to go..."
                  className="mt-2 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  rows={6}
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
              disabled={isLoading || !contextDescription.trim()}
              className="w-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Crafting Your Narrative...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Generate Narrative</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </motion.div>
        )}

        {step === 'result' && narrative && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto space-y-4"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{narrative.title}</h2>
              <p className="text-sm text-gray-500">
                Created {new Date(narrative.created_at).toLocaleDateString()}
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Chapter 1: The Past</h3>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {narrative.chapter_past}
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Chapter 2: The Present</h3>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {narrative.chapter_present}
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-orange-50 border-pink-200 p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Chapter 3: The Future</h3>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {narrative.chapter_future}
              </p>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/50 p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Your Choice</h3>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {narrative.future_choice}
              </p>
            </Card>

            <Button
              onClick={handleReset}
              className="w-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Create Another Narrative
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
