import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  MessageCircle,
  Target,
  BookOpen,
  Sparkles,
  Home
} from 'lucide-react';
import { ToolCard } from './ToolCard';
import { NudgeCard } from './NudgeCard';
import { BrainExerciseScreen } from './BrainExerciseScreen';
import { NarrativeScreen } from './NarrativeScreen';
import { FutureMeScreen } from './FutureMeScreen';
import { useMasterAgent } from '../hooks/useMasterAgent';

interface ToolsScreenProps {
  onBack: () => void;
  onShowChat?: () => void;
  onShowGoals?: () => void;
  onShowJournal?: () => void;
}

const tools = [
  {
    id: 'reframe-mindset',
    icon: '🧠',
    title: 'Empower My Brain',
    purpose: 'Neuroplasticity Exercises',
    flow: '',
    route: '/tools/reframe'
  },
  {
    id: 'my-new-narrative',
    icon: '✍️',
    title: 'My New Narrative',
    purpose: 'Turn your journaling into a powerful life story.',
    flow: '',
    route: '/tools/narrative'
  },
  {
    id: 'future-me',
    icon: '🌟',
    title: 'Future Me',
    purpose: 'Visualize who you\'re becoming with affirmations.',
    flow: '',
    route: '/tools/future-me'
  }
];

export function ToolsScreen({ onBack, onShowChat, onShowGoals, onShowJournal }: ToolsScreenProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Phase 3: Master Agent hook
  const { fetchNudges, acceptNudge, dismissNudge } = useMasterAgent();
  const [toolsNudges, setToolsNudges] = useState<any[]>([]);

  // Load nudges on mount
  useEffect(() => {
    const loadNudges = async () => {
      const nudges = await fetchNudges('tools');
      setToolsNudges(nudges);
    };
    loadNudges();
  }, [fetchNudges]);

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
  };

  const handleToolBack = () => {
    setActiveTool(null);
  };

  // Render specific tool screen
  if (activeTool === 'reframe-mindset') {
    return <BrainExerciseScreen onBack={handleToolBack} />;
  }

  if (activeTool === 'my-new-narrative') {
    return <NarrativeScreen onBack={handleToolBack} />;
  }

  if (activeTool === 'future-me') {
    return <FutureMeScreen onBack={handleToolBack} />;
  }

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

      <div className="px-6 space-y-8 pb-24">
        {/* Tools Header */}
        <motion.div
          className="text-center space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🔧</span>
            <h2 className="text-xl text-gray-900">Tools</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            "Grow your mind, your story, and your future self."
          </p>
        </motion.div>

        {/* Nudges Section */}
        {toolsNudges.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-3"
          >
            {toolsNudges
              .filter((nudge) => nudge.status === 'pending')
              .map((nudge) => (
                <NudgeCard
                  key={nudge.id}
                  nudge={nudge}
                  onAccept={acceptNudge}
                  onDismiss={dismissNudge}
                  onNavigate={(route) => {
                    if (route.includes('goals')) onShowGoals?.();
                    else if (route.includes('journal')) onShowJournal?.();
                    else if (route.includes('chat')) onShowChat?.();
                  }}
                />
              ))}
          </motion.div>
        )}

        {/* Tools List */}
        <motion.div
          className="space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <ToolCard
                icon={tool.icon}
                title={tool.title}
                purpose={tool.purpose}
                flow={tool.flow}
                route={tool.route}
                onClick={() => handleToolClick(tool.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Tip */}
        <motion.div
          className="text-center pt-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-gray-500 text-sm">
            Tip: Each tool is light, safe, and personal.
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
              { icon: BookOpen, label: 'Journal', active: false, onClick: onShowJournal || onBack },
              { icon: Sparkles, label: 'Tools', active: true, onClick: () => {} }
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