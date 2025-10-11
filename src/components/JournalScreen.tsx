import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  BookOpen,
  Sparkles,
  Target,
  MessageCircle,
  Home
} from 'lucide-react';
import { JournalSessionScreen } from './JournalSessionScreen';
import { JournalCard } from './JournalCard';

export type JournalMode = 'free-write' | 'past' | 'present' | 'future';
export type WritingMode = 'text' | 'voice' | 'bullet';

export interface JournalSession {
  id: string;
  mode: JournalMode;
  track?: string;
  step?: number;
  totalSteps?: number;
  title: string;
  prompt?: string;
  content: string;
  duration: number;
  wordsWritten: number;
  createdAt: Date;
  isCompleted: boolean;
  isPrivate: boolean;
  excludeFromMemory: boolean;
  tags: string[];
  emotions: string[];
  linkedGoalId?: string;
}

interface JournalScreenProps {
  onBack: () => void;
  onShowChat?: () => void;
  onShowGoals?: () => void;
  onShowTools?: () => void;
}

const journalTracks = [
  {
    mode: 'past' as JournalMode,
    title: 'Past',
    description: 'Map your story. Find patterns. Release old weight.',
    timeEstimate: '~5 min',
    buttonText: 'Begin',
    emoji: '📖'
  },
  {
    mode: 'present' as JournalMode,
    title: 'Present',
    description: 'See clearly who you are today. Own your strengths, shift your patterns.',
    timeEstimate: '~5 min',
    buttonText: 'Begin',
    emoji: '💚'
  },
  {
    mode: 'future' as JournalMode,
    title: 'Future',
    description: 'Picture your future with clarity. Create your path forward.',
    timeEstimate: '~5 min',
    buttonText: 'Begin',
    emoji: '🌅'
  },
  {
    mode: 'free-write' as JournalMode,
    title: 'Free-Write',
    description: 'Empty page. Write freely for 5–10 minutes.',
    timeEstimate: '5–10 min',
    buttonText: 'Start',
    emoji: '✨'
  }
];

export function JournalScreen({ onBack, onShowChat, onShowGoals, onShowTools }: JournalScreenProps) {
  const [activeSession, setActiveSession] = useState<JournalSession | null>(null);
  const [lastSession, setLastSession] = useState<JournalSession | null>(null);
  const [streak, setStreak] = useState(0);

  const handleStartSession = (mode: JournalMode) => {
    const track = journalTracks.find(t => t.mode === mode);
    if (!track) return;

    const newSession: JournalSession = {
      id: Date.now().toString(),
      mode,
      track: mode,
      step: mode === 'free-write' ? undefined : 1,
      totalSteps: mode === 'free-write' ? undefined : 5,
      title: track.title,
      prompt: getInitialPrompt(mode),
      content: '',
      duration: 0,
      wordsWritten: 0,
      createdAt: new Date(),
      isCompleted: false,
      isPrivate: true,
      excludeFromMemory: false,
      tags: [],
      emotions: []
    };

    setActiveSession(newSession);
  };

  const handleResumeSession = () => {
    if (lastSession) {
      setActiveSession({ ...lastSession });
    }
  };

  const handleSessionComplete = (session: JournalSession) => {
    setLastSession(session);
    setActiveSession(null);
    if (session.isCompleted) {
      setStreak(streak + 1);
    }
  };

  const getInitialPrompt = (mode: JournalMode): string => {
    const prompts = {
      'free-write': "What's on your mind right now? Let your thoughts flow without judgment.",
      'past': "Think of a turning point that still tugs at you. What happened, and what did it teach you?",
      'present': "List 3 strengths that people who love you would say you have. Start with the first one that comes to mind.",
      'future': "Describe where you wake up in your ideal year. Who is around, and what do you do before noon?"
    };
    return prompts[mode];
  };

  // Show session screen if active
  if (activeSession) {
    return (
      <JournalSessionScreen
        session={activeSession}
        onComplete={handleSessionComplete}
        onBack={() => setActiveSession(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9ff]">
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
        
        <div></div>
        
        <motion.button 
          onClick={onBack}
          className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home className="w-5 h-5 text-white" />
        </motion.button>
      </motion.div>

      <div className="px-5 space-y-8 pb-24">
        {/* Main Header */}
        <motion.div
          className="text-center space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2 className="text-gray-900 text-2xl">✍️ Journaling Path</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Make sense of your past, understand your present, and design your future.
          </p>
        </motion.div>

        {/* Journal Cards */}
        <motion.div 
          className="space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {journalTracks.map((track, index) => (
            <motion.div
              key={track.mode}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <JournalCard
                emoji={track.emoji}
                title={track.title}
                description={track.description}
                timeEstimate={track.timeEstimate}
                buttonText={track.buttonText}
                mode={track.mode}
                onStart={handleStartSession}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Privacy Note */}
        <motion.div
          className="text-center pt-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <p className="text-gray-500 text-xs">
            🔒 Private: Only you control what's remembered.
          </p>
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
              { icon: MessageCircle, label: 'Chat', active: false, onClick: onShowChat || onBack },
              { icon: Target, label: 'Goals', active: false, onClick: onShowGoals || onBack },
              { icon: BookOpen, label: 'Journal', active: true, onClick: () => {} },
              { icon: Sparkles, label: 'Tools', active: false, onClick: onShowTools || onBack }
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
                  <span className="text-xs">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}