import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Check,
  ArrowLeft,
  Sparkles,
  Target,
  Users,
  Lock,
  Unlock,
  Heart,
  Brain,
  Star,
  Plus,
  Share,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { JournalSession } from './JournalScreen';

interface JournalCompletionScreenProps {
  session: JournalSession;
  onComplete: (session: JournalSession) => void;
  onBack: () => void;
}

interface JournalSummary {
  insights: string[];
  themes: string[];
  actionSuggestion: string;
  affirmation: string;
  emotions: string[];
}

export function JournalCompletionScreen({ session, onComplete, onBack }: JournalCompletionScreenProps) {
  const [summary, setSummary] = useState<JournalSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(true);
  const [useForMemory, setUseForMemory] = useState(!session.excludeFromMemory);
  const [shareToPeers, setShareToPeers] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [linkedToGoal, setLinkedToGoal] = useState(false);

  // Simulate AI summary generation
  useEffect(() => {
    const generateSummary = async () => {
      // In real app, this would call the DeepSeek R1 API through together.ai
      setTimeout(() => {
        const mockSummary: JournalSummary = {
          insights: generateInsights(session),
          themes: generateThemes(session),
          actionSuggestion: generateActionSuggestion(session),
          affirmation: generateAffirmation(session),
          emotions: extractEmotions(session.content)
        };
        setSummary(mockSummary);
        setIsGeneratingSummary(false);
      }, 2000);
    };

    generateSummary();
  }, [session]);

  const generateInsights = (session: JournalSession): string[] => {
    const insights = {
      'free-write': [
        'You processed multiple thoughts simultaneously, showing mental flexibility',
        'Your writing reveals a pattern of self-reflection and growth mindset',
        'You tend to connect current experiences to future possibilities'
      ],
      'past': [
        'You show remarkable resilience in reframing difficult experiences',
        'Your narrative demonstrates growth from past challenges into wisdom',
        'You can separate events from meanings, which is a sign of emotional maturity'
      ],
      'present': [
        'You have strong self-awareness about your patterns and triggers',
        'You balance acknowledging challenges with recognizing your strengths',
        'You\'re ready to take small, concrete steps toward positive change'
      ],
      'future': [
        'Your vision is grounded in your values, not just external achievements',
        'You think systematically about potential obstacles and solutions',
        'You understand that small daily actions create meaningful change'
      ]
    };

    return insights[session.mode] || insights['free-write'];
  };

  const generateThemes = (session: JournalSession): string[] => {
    const commonThemes = ['growth', 'resilience', 'self-compassion', 'boundaries', 'courage', 'clarity', 'connection'];
    return commonThemes.slice(0, 3);
  };

  const generateActionSuggestion = (session: JournalSession): string => {
    const actions = {
      'free-write': 'Schedule 10 minutes tomorrow morning for reflection before checking your phone',
      'past': 'Write a brief letter of gratitude to your younger self for getting you here',
      'present': 'Practice the 5-minute experiment you identified for one week',
      'future': 'Take one of your tiny steps today—even 5 minutes counts'
    };

    return actions[session.mode] || actions['free-write'];
  };

  const generateAffirmation = (session: JournalSession): string => {
    const affirmations = {
      'free-write': 'I trust my inner wisdom to guide me through uncertainty.',
      'past': 'I honor my journey and carry its lessons with grace and strength.',
      'present': 'I see my strengths clearly and meet my challenges with compassion.',
      'future': 'I am becoming the woman I\'m meant to be, one day at a time.'
    };

    return affirmations[session.mode] || affirmations['free-write'];
  };

  const extractEmotions = (content: string): string[] => {
    // Simple emotion detection based on keywords
    const emotionKeywords = {
      'grateful': 'gratitude',
      'anxious': 'anxiety',
      'excited': 'excitement',
      'sad': 'sadness',
      'angry': 'anger',
      'peaceful': 'peace',
      'confused': 'confusion',
      'hopeful': 'hope',
      'frustrated': 'frustration',
      'content': 'contentment'
    };

    const emotions: string[] = [];
    const lowerContent = content.toLowerCase();
    
    Object.entries(emotionKeywords).forEach(([keyword, emotion]) => {
      if (lowerContent.includes(keyword)) {
        emotions.push(emotion);
      }
    });

    return emotions.length > 0 ? emotions.slice(0, 3) : ['reflection', 'processing'];
  };

  const handleAddToGoals = () => {
    if (summary?.actionSuggestion) {
      // In real app, this would create a new goal or add to existing one
      setLinkedToGoal(true);
      console.log('Adding to goals:', summary.actionSuggestion);
    }
  };

  const handleComplete = () => {
    const updatedSession = {
      ...session,
      excludeFromMemory: !useForMemory,
      tags: summary?.themes || [],
      emotions: summary?.emotions || []
    };
    
    onComplete(updatedSession);
  };

  const formatSessionStats = () => {
    const minutes = Math.floor(session.duration / 60);
    const seconds = session.duration % 60;
    return `${minutes}m ${seconds}s • ${session.wordsWritten} words`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-6 pt-12"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h1 className="text-lg text-gray-900">Session Complete</h1>
        
        <div className="w-10 h-10"></div>
      </motion.div>

      <div className="px-6 space-y-6 pb-24">
        {/* Completion Celebration */}
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-gray-900 mb-2">Beautiful work! ✨</h2>
          <p className="text-gray-600 text-sm">
            {formatSessionStats()}
          </p>
        </motion.div>

        {/* AI Summary */}
        {isGeneratingSummary ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-600 animate-pulse" />
                </div>
                <h3 className="text-gray-900">AI is reflecting on your session...</h3>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </Card>
          </motion.div>
        ) : summary && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {/* Insights */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-gray-900">AI Summary</h3>
              </div>
              <div className="space-y-3">
                {summary.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Themes */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-gray-900">Themes</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.themes.map((theme, index) => (
                  <Badge key={index} variant="secondary" className="bg-white/70">
                    {theme}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Action Suggestion */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-0 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-gray-900">One tiny action</h3>
              </div>
              <p className="text-gray-700 text-sm mb-4">
                {summary.actionSuggestion}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddToGoals}
                  disabled={linkedToGoal}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white border-0"
                >
                  {linkedToGoal ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Added to Goals
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Add to Goals
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Affirmation */}
            <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-0 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-pink-600" />
                </div>
                <h3 className="text-gray-900">Affirmation</h3>
              </div>
              <p className="text-gray-700 italic text-center py-4 px-2 bg-white/50 rounded-lg">
                "{summary.affirmation}"
              </p>
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-pink-600 hover:text-pink-700"
                >
                  <Star className="w-4 h-4 mr-1" />
                  Save affirmation
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Privacy Controls */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm p-6">
            <h3 className="text-gray-900 mb-4">Privacy & Sharing</h3>
            <div className="space-y-4">
              {/* Memory Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    useForMemory ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    {useForMemory ? (
                      <Unlock className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm">Use for memory</p>
                    <p className="text-gray-600 text-xs">Help AI remember context for future sessions</p>
                  </div>
                </div>
                <Switch
                  checked={useForMemory}
                  onCheckedChange={setUseForMemory}
                />
              </div>

              {/* Peer Sharing Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    shareToPeers ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {shareToPeers ? (
                      <Share className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Users className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm">Share insight with peer circle</p>
                    <p className="text-gray-600 text-xs">Share a redacted insight (off by default)</p>
                  </div>
                </div>
                <Switch
                  checked={shareToPeers}
                  onCheckedChange={setShareToPeers}
                />
              </div>

              {/* Privacy Details */}
              <button
                onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
              >
                {showPrivacyDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Privacy details
              </button>

              {showPrivacyDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3"
                >
                  <p className="mb-2">
                    • Your entries are private by default and encrypted
                  </p>
                  <p className="mb-2">
                    • AI summaries can be disabled per-entry
                  </p>
                  <p>
                    • You control what's shared and what's remembered
                  </p>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* End Ritual */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-0 shadow-sm p-6 text-center">
            <p className="text-purple-800 text-sm mb-4">
              Take a moment for a gentle closing ritual:
            </p>
            <p className="text-purple-700 text-sm italic">
              "What's one kind thing future-you will thank you for?"
            </p>
          </Card>
        </motion.div>

        {/* Complete Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button
            onClick={handleComplete}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl h-12"
          >
            Complete Session
          </Button>
        </motion.div>
      </div>
    </div>
  );
}