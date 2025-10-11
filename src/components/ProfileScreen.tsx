import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  User,
  ChevronRight,
  Bell,
  Shield,
  AlertTriangle,
  Brain,
  Lock,
  CreditCard,
  Key,
  HelpCircle,
  FileText,
  Settings,
  Globe,
  MessageCircle,
  BookOpen,
  Target,
  Eye,
  Info,
  Crown,
  Home
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { user } = useAuth();
  
  // Settings state
  const [chatMemory, setChatMemory] = useState(true);
  const [journalInMemory, setJournalInMemory] = useState(false);
  const [goalContext, setGoalContext] = useState(true);
  const [trainingOptIn, setTrainingOptIn] = useState(false);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
        
        <h1 className="text-lg text-gray-900">My Profile</h1>
        
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
        {/* Profile Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm p-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              
              {/* Name and Details */}
              <div className="flex-1">
                <h2 className="text-gray-900 mb-1">{user?.name || 'User'}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>She/Her</span>
                  <span>•</span>
                  <span>{userTimezone}</span>
                </div>
              </div>

              {/* Edit Button */}
              <Button variant="ghost" size="sm" className="text-gray-600">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>



        {/* Notifications */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="space-y-3">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h3>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
              <div className="p-4 space-y-3">
                <button className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg -m-2">
                  <span className="text-gray-900">Check-ins</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg -m-2">
                  <span className="text-gray-900">Weekly summaries</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Safety */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="space-y-3">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Safety
            </h3>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
              <button className="w-full p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-gray-900">Crisis Support</p>
                      <p className="text-sm text-gray-600">NZ 1737 • AU 13 11 14</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            </Card>
          </div>
        </motion.div>

        {/* Memory & Data */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="space-y-3">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Memory & Data
            </h3>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm p-6 space-y-4">
              {/* Chat Memory */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">Chat memory</span>
                </div>
                <Switch
                  checked={chatMemory}
                  onCheckedChange={setChatMemory}
                />
              </div>

              {/* Journal in Memory */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">Journal in memory</span>
                </div>
                <Switch
                  checked={journalInMemory}
                  onCheckedChange={setJournalInMemory}
                />
              </div>

              {/* Goal Context */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">Goal context</span>
                </div>
                <Switch
                  checked={goalContext}
                  onCheckedChange={setGoalContext}
                />
              </div>

              {/* Training Opt-in */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">Training opt-in</span>
                      <button className="text-purple-600 hover:text-purple-700">
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 text-left">Learn more</p>
                  </div>
                </div>
                <Switch
                  checked={trainingOptIn}
                  onCheckedChange={setTrainingOptIn}
                />
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Subscription & Billing */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="space-y-3">
            <h3 className="text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription & Billing
            </h3>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
              <button className="w-full p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Crown className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-gray-900">Plan</p>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                        Free
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            </Card>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="space-y-3">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security
            </h3>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
              <button className="w-full p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">Password</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            </Card>
          </div>
        </motion.div>

        {/* AI Transparency */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="space-y-3">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              AI Transparency
            </h3>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
              <div className="p-4 space-y-3">
                <button className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg -m-2">
                  <span className="text-gray-900">About the AI</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg -m-2">
                  <span className="text-gray-900">Why this suggestion?</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Legal & Consents */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="space-y-3">
            <h3 className="text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Legal & Consents
            </h3>
            
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
              <div className="p-4 space-y-3">
                <button className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg -m-2">
                  <span className="text-gray-900">Non-medical Care</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg -m-2">
                  <span className="text-gray-900">Terms & Privacy</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg -m-2">
                  <span className="text-gray-900">Consent History</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* App Version & Support */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>Luma v1.0.0</p>
            <p>Made with 💜 for ambitious women</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}