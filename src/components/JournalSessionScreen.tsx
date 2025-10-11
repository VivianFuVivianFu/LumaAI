import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Play,
  Pause,
  Square,
  Mic,
  MicOff,
  List,
  Type,
  Save,
  Skip,
  ArrowRight,
  Lightbulb,
  Heart,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { JournalSession, JournalMode, WritingMode } from './JournalScreen';
import { JournalCompletionScreen } from './JournalCompletionScreen';

interface JournalSessionScreenProps {
  session: JournalSession;
  onComplete: (session: JournalSession) => void;
  onBack: () => void;
}

const sessionPrompts = {
  'free-write': [
    "What's on your mind right now? Let your thoughts flow without judgment.",
    "If you could tell your past self one thing, what would it be?",
    "What would make tomorrow 5% easier?"
  ],
  'past': [
    "Think of a turning point that still tugs at you. What happened?",
    "What belief started from that experience? Is it still serving you?",
    "If a friend lived through this exact experience, what would you tell her now?",
    "What themes do you notice in your story? (e.g., resilience, courage, growth)",
    "Is there a ritual of closure or boundary you want to create from this understanding?"
  ],
  'present': [
    "List 3 strengths that people who love you would say you have.",
    "What pattern or habit has been tripping you up lately?",
    "Give me three facts that support this concern, and three that challenge it.",
    "What's one 5-minute experiment you could try this week to shift this pattern?",
    "How could you schedule this experiment or connect it to one of your goals?"
  ],
  'future': [
    "Describe where you wake up in your ideal year. Who is around, and what do you do before noon?",
    "Choose 3 values that anchor this vision (e.g., growth, kindness, sovereignty).",
    "What could derail you from this path? Create an 'If this happens, then I will...' plan.",
    "What are 3 tiny steps you could take in the next 2 weeks toward this future?",
    "Write a short affirmation about who you're becoming. Make it something you'd want to read aloud daily."
  ]
};

const nudgeQuestions = [
  "What's underneath that feeling?",
  "What would you tell a dear friend in this situation?",
  "What's one small truth you're avoiding?",
  "If you couldn't fail, what would you try?",
  "What pattern are you noticing?",
  "What would 'good enough' look like here?",
  "What boundary might help?",
  "What are you grateful for in this moment?"
];

export function JournalSessionScreen({ session, onComplete, onBack }: JournalSessionScreenProps) {
  const [currentSession, setCurrentSession] = useState<JournalSession>(session);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(session.duration);
  const [writingMode, setWritingMode] = useState<WritingMode>('text');
  const [isListening, setIsListening] = useState(false);
  const [showPromptHelper, setShowPromptHelper] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [idleTime, setIdleTime] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const idleIntervalRef = useRef<NodeJS.Timeout>();

  const currentPrompts = sessionPrompts[currentSession.mode] || [];
  const currentPrompt = currentPrompts[Math.min((currentSession.step || 1) - 1, currentPrompts.length - 1)];
  const isGuidedSession = currentSession.mode !== 'free-write';
  const maxTime = currentSession.mode === 'free-write' ? 600 : 300; // 10 min for free-write, 5 min for guided

  // Timer logic
  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
        setCurrentSession(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
      
      // Idle timer
      idleIntervalRef.current = setInterval(() => {
        setIdleTime(prev => {
          if (prev >= 60) {
            setShowNudge(true);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    };
  }, [isTimerRunning]);

  // Auto-save every 3 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (currentSession.content.trim()) {
        // In real app, this would save to Supabase
        console.log('Auto-saving journal entry...');
      }
    }, 3000);

    return () => clearInterval(autoSaveInterval);
  }, [currentSession.content]);

  // Reset idle timer on typing
  useEffect(() => {
    setIdleTime(0);
    setShowNudge(false);
  }, [currentSession.content]);

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleContentChange = (value: string) => {
    const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
    setCurrentSession(prev => ({
      ...prev,
      content: value,
      wordsWritten: wordCount
    }));
  };

  const handleNext = () => {
    if (isGuidedSession && currentSession.step && currentSession.totalSteps) {
      if (currentSession.step < currentSession.totalSteps) {
        // Move to next step
        setCurrentSession(prev => ({
          ...prev,
          step: (prev.step || 0) + 1,
          content: prev.content + '\n\n--- Next Question ---\n\n'
        }));
        setShowPromptHelper(false);
      } else {
        // Complete the session
        handleComplete();
      }
    } else {
      // Free-write session - complete
      handleComplete();
    }
  };

  const handleSkip = () => {
    if (isGuidedSession && currentSession.step && currentSession.totalSteps) {
      if (currentSession.step < currentSession.totalSteps) {
        setCurrentSession(prev => ({
          ...prev,
          step: (prev.step || 0) + 1,
          content: prev.content + '\n\n--- Skipped ---\n\n'
        }));
      } else {
        handleComplete();
      }
    }
  };

  const handleComplete = () => {
    setIsTimerRunning(false);
    const completedSession = {
      ...currentSession,
      isCompleted: true
    };
    setCurrentSession(completedSession);
    setShowCompletion(true);
  };

  const handleVoiceToggle = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsListening(!isListening);
      // In real app, implement voice-to-text functionality
    }
  };

  const handlePromptHelperClick = () => {
    setShowPromptHelper(!showPromptHelper);
  };

  const insertNudgeQuestion = () => {
    const randomNudge = nudgeQuestions[Math.floor(Math.random() * nudgeQuestions.length)];
    const newContent = currentSession.content + (currentSession.content ? '\n\n' : '') + `💭 ${randomNudge}\n\n`;
    handleContentChange(newContent);
    setShowNudge(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show completion screen
  if (showCompletion) {
    return (
      <JournalCompletionScreen
        session={currentSession}
        onComplete={onComplete}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-4 pt-12"
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
        
        <div className="text-center">
          <h1 className="text-gray-900">
            {isGuidedSession ? `Guided: ${currentSession.title}` : currentSession.title}
          </h1>
          {isGuidedSession && (
            <p className="text-gray-600 text-sm">
              Step {currentSession.step}/{currentSession.totalSteps} • {currentSession.title} ({formatTime(maxTime - timeElapsed)} left)
            </p>
          )}
        </div>
        
        <Button
          onClick={() => {
            // Save draft
            console.log('Saving draft...');
          }}
          variant="ghost"
          size="sm"
          className="text-gray-600"
        >
          <Save className="w-4 h-4" />
        </Button>
      </motion.div>

      <div className="px-4 space-y-4 pb-24">
        {/* Writing Area */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
            <div className="p-4 space-y-4">
              {/* Writing Modes */}
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setWritingMode('text')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-all ${
                      writingMode === 'text' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    Type
                  </button>
                  <button
                    onClick={handleVoiceToggle}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-all ${
                      isListening ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    Voice
                  </button>
                  <button
                    onClick={() => setWritingMode('bullet')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-all ${
                      writingMode === 'bullet' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    Bullets
                  </button>
                </div>

                {/* Timer */}
                <div className="flex items-center gap-2 ml-auto">
                  <div className="text-sm text-gray-600">
                    ⏱ {formatTime(timeElapsed)}
                  </div>
                  {!isTimerRunning ? (
                    <Button onClick={handleStartTimer} size="sm" variant="ghost">
                      <Play className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button onClick={handlePauseTimer} size="sm" variant="ghost">
                      <Pause className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Text Area */}
              <Textarea
                ref={textareaRef}
                value={currentSession.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={writingMode === 'bullet' ? '• First thought...\n• Second thought...' : "Start writing..."}
                className="min-h-64 border-0 focus:ring-0 resize-none text-base leading-relaxed"
                style={{ boxShadow: 'none' }}
              />

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{currentSession.wordsWritten} words</span>
                <span>Auto-saved</span>
              </div>
            </div>

            {/* Prompt Helper */}
            <div className="border-t border-gray-100 p-4">
              <button
                onClick={handlePromptHelperClick}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
              >
                <Lightbulb className="w-4 h-4" />
                Prompt helper
              </button>
              
              {showPromptHelper && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 p-3 bg-purple-50 rounded-lg"
                >
                  <p className="text-sm text-purple-800 italic">
                    "{currentPrompt}"
                  </p>
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center justify-between">
                {isGuidedSession && (
                  <Button
                    onClick={handleSkip}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600"
                  >
                    Skip
                  </Button>
                )}
                
                <div className="flex gap-2 ml-auto">
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                  >
                    {isGuidedSession && currentSession.step && currentSession.step < (currentSession.totalSteps || 0) ? (
                      <>Next <ArrowRight className="w-4 h-4 ml-1" /></>
                    ) : (
                      'Complete'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Nudge Modal */}
        {showNudge && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <Card className="bg-white p-6 max-w-sm w-full">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-gray-900 mb-2">Gentle nudge</h3>
                  <p className="text-gray-600 text-sm">
                    Sometimes a question can help unlock your thoughts.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowNudge(false)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Keep writing
                  </Button>
                  <Button
                    onClick={insertNudgeQuestion}
                    size="sm"
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white border-0"
                  >
                    Try a prompt
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Crisis Detection Warning (placeholder) */}
        {currentSession.content.toLowerCase().includes('crisis') && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-24 left-4 right-4"
          >
            <Card className="bg-red-50 border-red-200 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 text-sm">
                    Need immediate support? 
                  </p>
                  <p className="text-red-700 text-xs mt-1">
                    NZ 1737 • AU 13 11 14
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}