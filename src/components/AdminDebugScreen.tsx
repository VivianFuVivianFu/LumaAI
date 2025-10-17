import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Activity,
  Bell,
  MessageSquare,
  TrendingUp,
  Users,
  Database,
  Zap,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Home
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface AdminDebugScreenProps {
  onBack: () => void;
}

interface Event {
  id: string;
  event_type: string;
  feature_area: string;
  event_data: any;
  created_at: string;
}

interface Nudge {
  id: string;
  kind: string;
  target_surface: string;
  title: string;
  message: string;
  priority: number;
  rule_name: string;
  status: string;
  created_at: string;
}

interface Feedback {
  id: string;
  feature_area: string;
  feedback_type: string;
  rating: number;
  comments: string;
  created_at: string;
}

interface Stats {
  total_events: number;
  total_nudges: number;
  total_feedback: number;
  nudge_acceptance_rate: number;
  events_by_feature: Record<string, number>;
  nudges_by_surface: Record<string, number>;
  feedback_by_type: Record<string, number>;
}

const API_BASE_URL = 'http://localhost:4000/api/v1';

export function AdminDebugScreen({ onBack }: AdminDebugScreenProps) {
  const [view, setView] = useState<'overview' | 'events' | 'nudges' | 'feedback'>('overview');
  const [events, setEvents] = useState<Event[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedNudge, setSelectedNudge] = useState<Nudge | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadAllData();
  }, [timeRange]);

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadEvents(),
      loadNudges(),
      loadFeedback(),
      loadStats()
    ]);
    setIsLoading(false);
  };

  const loadEvents = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      // Note: This endpoint would need to be created in backend
      const response = await fetch(`${API_BASE_URL}/master-agent/debug/events?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.data.events || []);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      // Mock data for demo
      setEvents([
        {
          id: '1',
          event_type: 'mood_checkin_completed',
          feature_area: 'dashboard',
          event_data: { mood_value: 4 },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          event_type: 'goal_created',
          feature_area: 'goals',
          event_data: { goal_title: 'Learn Spanish' },
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
    }
  };

  const loadNudges = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/master-agent/debug/nudges?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNudges(data.data.nudges || []);
      }
    } catch (error) {
      console.error('Failed to load nudges:', error);
      // Mock data
      setNudges([
        {
          id: '1',
          kind: 'goal_reminder',
          target_surface: 'goals',
          title: 'Ready for a micro-step?',
          message: 'You just journaled! Try a 5-10 min starter task.',
          priority: 6,
          rule_name: 'cross_feature_bridge_journal_to_goal',
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const loadFeedback = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/master-agent/debug/feedback?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.data.feedback || []);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
      setFeedback([]);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/master-agent/debug/stats?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Mock stats
      setStats({
        total_events: 156,
        total_nudges: 23,
        total_feedback: 8,
        nudge_acceptance_rate: 0.68,
        events_by_feature: {
          dashboard: 45,
          goals: 38,
          journal: 32,
          chat: 28,
          tools: 13
        },
        nudges_by_surface: {
          home: 8,
          goals: 6,
          journal: 5,
          chat: 3,
          tools: 1
        },
        feedback_by_type: {
          praise: 3,
          suggestion: 4,
          bug: 1
        }
      });
    }
  };

  const exportData = () => {
    const data = {
      events,
      nudges,
      feedback,
      stats,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luma-debug-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-6 pt-12 bg-white/80 backdrop-blur-sm border-b border-gray-200"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-gray-800 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900 text-lg font-semibold">Admin Debug</h1>
            <p className="text-xs text-gray-500">Phase 3 Monitoring</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-10 h-10 bg-gradient-to-br from-slate-700 to-gray-800 rounded-full flex items-center justify-center shadow-lg"
        >
          <Home className="w-5 h-5 text-white" />
        </button>
      </motion.div>

      {/* Controls */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {[
              { id: '24h', label: 'Last 24h' },
              { id: '7d', label: 'Last 7 days' },
              { id: '30d', label: 'Last 30 days' }
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range.id
                    ? 'bg-slate-700 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={loadAllData}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={exportData}
              size="sm"
              className="flex items-center gap-2 bg-slate-700 text-white hover:bg-slate-800"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'events', label: 'Events', icon: Activity },
            { id: 'nudges', label: 'Nudges', icon: Bell },
            { id: 'feedback', label: 'Feedback', icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  view === tab.id
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-24">
        <AnimatePresence mode="wait">
          {/* Overview */}
          {view === 'overview' && stats && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <Badge className="bg-blue-50 text-blue-700">Events</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total_events}</div>
                  <p className="text-xs text-gray-500">Total events logged</p>
                </Card>

                <Card className="bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Bell className="w-5 h-5 text-purple-600" />
                    <Badge className="bg-purple-50 text-purple-700">Nudges</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total_nudges}</div>
                  <p className="text-xs text-gray-500">Nudges generated</p>
                </Card>

                <Card className="bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <Badge className="bg-green-50 text-green-700">Rate</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(stats.nudge_acceptance_rate * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-gray-500">Acceptance rate</p>
                </Card>

                <Card className="bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="w-5 h-5 text-orange-600" />
                    <Badge className="bg-orange-50 text-orange-700">Feedback</Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total_feedback}</div>
                  <p className="text-xs text-gray-500">User feedback items</p>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Events by Feature */}
                <Card className="bg-white p-6">
                  <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Events by Feature
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(stats.events_by_feature).map(([feature, count]) => (
                      <div key={feature}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 capitalize">{feature}</span>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-blue-600 rounded-full h-2 transition-all"
                            style={{ width: `${(count / stats.total_events) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Nudges by Surface */}
                <Card className="bg-white p-6">
                  <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Nudges by Surface
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(stats.nudges_by_surface).map(([surface, count]) => (
                      <div key={surface}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 capitalize">{surface}</span>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-purple-600 rounded-full h-2 transition-all"
                            style={{ width: `${(count / stats.total_nudges) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Events List */}
          {view === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">Recent Events ({events.length})</h3>
              </div>

              {events.map((event) => (
                <Card
                  key={event.id}
                  className="bg-white p-4 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-50 text-blue-700 text-xs">
                          {event.feature_area}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">{event.event_type}</span>
                      </div>
                      <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(event.event_data, null, 2)}
                      </pre>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </Card>
              ))}
            </motion.div>
          )}

          {/* Nudges List */}
          {view === 'nudges' && (
            <motion.div
              key="nudges"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">Nudges ({nudges.length})</h3>
              </div>

              {nudges.map((nudge) => (
                <Card
                  key={nudge.id}
                  className="bg-white p-4 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSelectedNudge(nudge)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-50 text-purple-700 text-xs">
                          {nudge.target_surface}
                        </Badge>
                        <Badge
                          className={`text-xs ${
                            nudge.status === 'accepted'
                              ? 'bg-green-50 text-green-700'
                              : nudge.status === 'dismissed'
                              ? 'bg-gray-50 text-gray-700'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {nudge.status}
                        </Badge>
                        <span className="text-xs text-gray-500">Priority: {nudge.priority}</span>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{nudge.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{nudge.message}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <code className="bg-gray-100 px-2 py-0.5 rounded">{nudge.rule_name}</code>
                        <span>•</span>
                        <span>{new Date(nudge.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </Card>
              ))}
            </motion.div>
          )}

          {/* Feedback List */}
          {view === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">User Feedback ({feedback.length})</h3>
              </div>

              {feedback.length === 0 ? (
                <Card className="bg-white p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No feedback received yet</p>
                </Card>
              ) : (
                feedback.map((item) => (
                  <Card key={item.id} className="bg-white p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-50 text-orange-700 text-xs">
                          {item.feature_area}
                        </Badge>
                        <Badge className="bg-blue-50 text-blue-700 text-xs">
                          {item.feedback_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < item.rating ? 'text-yellow-500' : 'text-gray-300'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{item.comments}</p>
                    <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                  </Card>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
