import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Bell, 
  MessageCircle, 
  Target, 
  BookOpen, 
  Star,
  Heart,
  Users,
  Brain,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Slider } from './ui/slider';

interface DashboardProps {
  userName: string;
  onShowProfile: () => void;
  onShowGoals: () => void;
  onShowTools: () => void;
  onShowJournal: () => void;
  onShowChat: () => void;
}

const moodEmojis = [
  { emoji: '😞', label: 'Struggling', value: 1 },
  { emoji: '😐', label: 'Low', value: 2 },
  { emoji: '🙂', label: 'Okay', value: 3 },
  { emoji: '😀', label: 'Good', value: 4 },
  { emoji: '😍', label: 'Great', value: 5 },
  { emoji: '🌟', label: 'Amazing', value: 6 }
];

const supportOptions = [
  {
    id: 'conversation',
    title: 'Constructive Conversation',
    description: 'Talk through feelings with a supportive companion who truly listens.',
    icon: MessageCircle
  },
  {
    id: 'clarity',
    title: 'Gain Clarity',
    description: 'Untangle thoughts and emotions with psychology-informed guidance.',
    icon: Brain
  },
  {
    id: 'empower',
    title: 'Empower Yourself',
    description: 'Reframe challenges into growth and strengthen your confidence.',
    icon: Star
  },
  {
    id: 'goals',
    title: 'Achieve Your Goals',
    description: 'Turn aspirations into clear, doable action steps with coaching support.',
    icon: Target
  }
];

// Mock data for Progress & Wellbeing - in real app, this would come from Supabase + DeepSeek R1
const progressData = {
  moodTrend: [3, 4, 5, 6, 5, 4, 5], // Last 7 days (1-6 scale)
  trendDirection: 'steady', // 'improving', 'steady', 'dip'
  streaks: {
    journaling: 3,
    reflection: 5
  },
  activeGoal: {
    title: 'Build healthy boundaries',
    progress: 60,
    nextMilestone: 'Draft first script'
  },
  aiSummary: 'Your energy has been steady this week, and your journaling streak is growing. You\'re 60% toward your boundary goal—next step: draft your first script.'
};

export function Dashboard({ userName, onShowProfile, onShowGoals, onShowTools, onShowJournal, onShowChat }: DashboardProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodSliderValue, setMoodSliderValue] = useState([3]); // Default to neutral (3 out of 5)
  const [journeyCardIndex, setJourneyCardIndex] = useState(0);
  const [moodSubmitted, setMoodSubmitted] = useState(false);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '🌞', message: 'Wishing you a calm and focused day' };
    if (hour < 17) return { text: 'Good afternoon', emoji: '🌞', message: 'Wishing you a calm and focused day' };
    if (hour < 21) return { text: 'Good evening', emoji: '🌅', message: 'Time to reflect and recharge' };
    return { text: 'Good night', emoji: '🌙', message: 'Winding down with gentle care' };
  };

  const greeting = getGreeting();

  const handleMoodSelect = (moodValue: number) => {
    setSelectedMood(moodValue);
    // Here you would save to Supabase: mood_checkins table
  };

  const handleMoodLongPress = (moodValue: number) => {
    setSelectedMood(moodValue);
    // Here you would open a modal for adding a note
    console.log('Long press - add note for mood:', moodValue);
  };

  const handleMoodSubmit = async () => {
    try {
      // Here you would submit to Supabase mood_checkins table
      console.log('Submitting mood to Supabase:', {
        mood_value: moodSliderValue[0],
        timestamp: new Date().toISOString(),
        user_id: 'current_user_id' // Would come from auth context
      });
      
      setMoodSubmitted(true);
      
      // Reset submitted state after 3 seconds
      setTimeout(() => {
        setMoodSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting mood:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <motion.div
        className="flex justify-between items-center p-6 pt-12"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.button 
          onClick={onShowProfile}
          className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-white/50 hover:shadow-md hover:bg-white/90 transition-all duration-200 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
          <span className="text-gray-900">My profile</span>
        </motion.button>
        
        <motion.button 
          className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home className="w-5 h-5 text-white" />
        </motion.button>
      </motion.div>



      <div className="px-6 space-y-6 pb-24">
        {/* Greeting Section - Moved to Top */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <Card className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 backdrop-blur-sm border-white/50 shadow-sm">
            <div className="p-4">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">{greeting.emoji}</span>
                <div className="text-center">
                  <h2 className="text-lg text-gray-900">
                    {greeting.text}, {userName}
                  </h2>
                  <p className="text-gray-600 text-sm">{greeting.message}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Separator className="mt-6" />
        </motion.div>

        {/* Mood Check-in Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-sm">
            <div className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-gray-900 mb-1">Mood Check-in</h3>
                  <p className="text-gray-600 text-sm">How are you feeling right now?</p>
                </div>
                <Button
                  onClick={handleMoodSubmit}
                  disabled={moodSubmitted}
                  className={`px-4 py-2 text-sm transition-all duration-200 ${
                    moodSubmitted 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                  } border-0 rounded-lg shadow-sm hover:shadow-md`}
                >
                  {moodSubmitted ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submitted</span>
                    </div>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="px-2">
                  <Slider
                    value={moodSliderValue}
                    onValueChange={setMoodSliderValue}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-600 px-2">
                  <span>Low</span>
                  <span>Neutral</span>
                  <span>Good</span>
                  <span>Energized</span>
                </div>
                
                <div className="text-center">
                  <span className="text-sm text-gray-700">
                    {moodSliderValue[0] === 1 && "Low"}
                    {moodSliderValue[0] === 2 && "Getting by"}
                    {moodSliderValue[0] === 3 && "Neutral"}
                    {moodSliderValue[0] === 4 && "Good"}
                    {moodSliderValue[0] === 5 && "Energized"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
          
          <Separator className="mt-6" />
        </motion.div>

        {/* How can I support you today */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-gray-900 mb-1">💜 How can I support you today?</h3>
            </div>
            
            <div className="space-y-3">
              {/* Chat with Luma */}
              <motion.button
                onClick={onShowChat}
                className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3 text-left">
                  <MessageCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-gray-900">Chat with Luma</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Luma isn't a therapist. She's an intelligent AI companion, informed by psychology and neuroscience, and trained in CBT, DBT, IFS, and attachment healing — here to support your journey.
                    </p>
                  </div>
                </div>
              </motion.button>
              
              {/* Reflect with Luma */}
              <motion.button
                onClick={onShowJournal}
                className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3 text-left">
                  <BookOpen className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-gray-900">Reflect with Luma</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Journal: Discover and empower yourself with science-backed writing.
                    </p>
                  </div>
                </div>
              </motion.button>
              
              {/* Thrive with Luma */}
              <motion.button
                onClick={onShowGoals}
                className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3 text-left">
                  <Target className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-gray-900">Thrive with Luma</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Goals: Break goals into sprints, track progress, and celebrate growth milestones, and connect with like-minded women on the same path.
                    </p>
                  </div>
                </div>
              </motion.button>
              
              {/* Practice with Luma */}
              <motion.button
                onClick={onShowTools}
                className="w-full p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3 text-left">
                  <Star className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-gray-900">Practice with Luma</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Tools: Empower yourself with Luma's Tools — build awareness through mood and pattern insights, strengthen your mindset and communication, and practice simple techniques for emotional balance.
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
          
          <Separator className="mt-6" />
        </motion.div>

        {/* Progress & Wellbeing Snapshot */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-gray-900 mb-1">Progress and Wellbeing</h3>
              <p className="text-sm text-gray-600">Your growth at a glance</p>
              <p className="text-xs text-gray-500 italic">(Example preview — your own progress will appear here once you begin using Luma)</p>
            </div>
            
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-sm">
              <div className="p-4 space-y-4">
                {/* Mood Tracker */}
                <div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <div>
                        <h4 className="text-gray-900">Mood Chart</h4>
                        <p className="text-sm text-gray-600">Track how your mood shifts over the month.</p>
                      </div>
                    </div>
                    
                    {/* Chart Area */}
                    <div className="bg-gray-50 rounded-lg p-6 relative">
                      <svg viewBox="0 0 300 200" className="w-full h-48">
                        {/* Grid lines */}
                        <defs>
                          <pattern id="grid" width="60" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="300" height="200" fill="url(#grid)" />
                        
                        {/* Y-Axis */}
                        <line x1="40" y1="20" x2="40" y2="180" stroke="#6b7280" strokeWidth="2"/>
                        
                        {/* X-Axis */}
                        <line x1="40" y1="180" x2="280" y2="180" stroke="#6b7280" strokeWidth="2"/>
                        
                        {/* Y-Axis Labels */}
                        <text x="35" y="30" textAnchor="end" className="fill-gray-600 text-xs">Very Good</text>
                        <text x="35" y="60" textAnchor="end" className="fill-gray-600 text-xs">Good</text>
                        <text x="35" y="100" textAnchor="end" className="fill-gray-600 text-xs">Neutral</text>
                        <text x="35" y="140" textAnchor="end" className="fill-gray-600 text-xs">Low</text>
                        <text x="35" y="175" textAnchor="end" className="fill-gray-600 text-xs">Very Low</text>
                        
                        {/* X-Axis Labels */}
                        <text x="70" y="195" textAnchor="middle" className="fill-gray-600 text-xs">1st week</text>
                        <text x="130" y="195" textAnchor="middle" className="fill-gray-600 text-xs">2nd week</text>
                        <text x="190" y="195" textAnchor="middle" className="fill-gray-600 text-xs">3rd week</text>
                        <text x="240" y="195" textAnchor="middle" className="fill-gray-600 text-xs">4th week</text>
                        
                        {/* Mood label */}
                        <text x="25" y="15" textAnchor="middle" className="fill-gray-600 text-xs">Mood</text>
                        <text x="150" y="210" textAnchor="middle" className="fill-gray-600 text-xs">Monthly</text>
                        
                        {/* Sample data points and line */}
                        {/* Week 1: Low (y=140) */}
                        <circle cx="70" cy="140" r="4" fill="#3b82f6" />
                        {/* Week 2: Very Low (y=170) */}
                        <circle cx="130" cy="170" r="4" fill="#6366f1" />
                        {/* Week 3: Good (y=60) */}
                        <circle cx="190" cy="60" fill="#f59e0b" r="4" />
                        {/* Week 4: Very Good (y=30) */}
                        <circle cx="240" cy="30" r="4" fill="#ef4444" />
                        
                        {/* Connecting lines */}
                        <polyline 
                          points="70,140 130,170 190,60 240,30" 
                          fill="none" 
                          stroke="#6b7280" 
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Activities Record */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Activities Record:</span>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Journaling {progressData.streaks.journaling} days</span>
                      <span>•</span>
                      <span>Reflection {progressData.streaks.reflection} days</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Goal Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-900">Goal: "{progressData.activeGoal.title}"</span>
                    <span className="text-purple-600">{progressData.activeGoal.progress}% complete</span>
                  </div>
                  <div className="space-y-2">
                    <Progress 
                      value={progressData.activeGoal.progress} 
                      className="h-2"
                    />
                    <p className="text-sm text-gray-600">
                      Next milestone: {progressData.activeGoal.nextMilestone}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                {/* AI Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {progressData.aiSummary}
                  </p>
                </div>
                
                <Separator />
                
                {/* Encouraging Message */}
                <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <div>
                      <p className="text-sm text-purple-700 leading-relaxed">
                        <span className="font-medium">✨ Start today</span> by checking in your mood or writing a short journal entry. The more you share, the more Luma can reflect your real journey back to you.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          </div>
          
          <Separator className="mt-6" />
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
              { icon: MessageCircle, label: 'Chat', active: false, onClick: onShowChat },
              { icon: Target, label: 'Goals', active: false, onClick: onShowGoals },
              { icon: BookOpen, label: 'Journal', active: false, onClick: onShowJournal },
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
    </div>
  );
}