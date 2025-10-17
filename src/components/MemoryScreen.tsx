import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Brain,
  Search,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  Tag,
  TrendingUp,
  Home,
  Filter,
  X,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface MemoryScreenProps {
  onBack: () => void;
}

interface MemoryBlock {
  id: string;
  content_text: string;
  summary: string;
  block_type: string;
  source_feature: string;
  themes: string[];
  relevance_score: number;
  privacy_level: 'low' | 'medium' | 'high';
  created_at: string;
  retrieval_count: number;
  exclude_from_memory: boolean;
}

interface MemorySettings {
  memory_enabled: boolean;
  auto_create_blocks: boolean;
  retention_days: number;
  privacy_mode: 'balanced' | 'private' | 'open';
  exclude_crisis_content: boolean;
}

const API_BASE_URL = 'http://localhost:4000/api/v1';

export function MemoryScreen({ onBack }: MemoryScreenProps) {
  const [view, setView] = useState<'blocks' | 'search' | 'insights' | 'settings'>('blocks');
  const [memoryBlocks, setMemoryBlocks] = useState<MemoryBlock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemoryBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [memorySettings, setMemorySettings] = useState<MemorySettings | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  // Load memory blocks on mount
  useEffect(() => {
    loadMemoryBlocks();
    loadMemorySettings();
  }, []);

  const loadMemoryBlocks = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/memory/blocks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMemoryBlocks(data.data.blocks);
      }
    } catch (error) {
      console.error('Failed to load memory blocks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemorySettings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/memory/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMemorySettings(data.data.settings);
      }
    } catch (error) {
      console.error('Failed to load memory settings:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/memory/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 20,
          similarity_threshold: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data.results.blocks || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExcludeBlock = async (blockId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/memory/blocks/${blockId}/exclude`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMemoryBlocks(prev => prev.filter(b => b.id !== blockId));
      }
    } catch (error) {
      console.error('Failed to exclude block:', error);
    }
  };

  const handleUpdateSettings = async (updates: Partial<MemorySettings>) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/memory/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        setMemorySettings(data.data.settings);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const getBlockTypeIcon = (blockType: string) => {
    switch (blockType) {
      case 'goal':
        return '🎯';
      case 'insight':
        return '💡';
      case 'challenge':
        return '⚡';
      case 'reflection':
        return '✨';
      default:
        return '📝';
    }
  };

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <Lock className="w-3 h-3 text-red-600" />;
      case 'medium':
        return <Lock className="w-3 h-3 text-yellow-600" />;
      default:
        return <Unlock className="w-3 h-3 text-green-600" />;
    }
  };

  const filteredBlocks = selectedFilter === 'all'
    ? memoryBlocks
    : memoryBlocks.filter(b => b.source_feature === selectedFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-6 pt-12 bg-white/80 backdrop-blur-sm border-b border-white/20"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900 text-lg">Memory</h1>
            <p className="text-xs text-gray-600">Your personal context engine</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
        >
          <Home className="w-5 h-5 text-white" />
        </button>
      </motion.div>

      {/* View Tabs */}
      <motion.div
        className="flex gap-2 p-6 overflow-x-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {[
          { id: 'blocks', label: 'My Memories', icon: Brain },
          { id: 'search', label: 'Search', icon: Search },
          { id: 'insights', label: 'Insights', icon: TrendingUp },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                view === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      <div className="px-6 pb-24 space-y-4">
        {/* Memory Blocks View */}
        {view === 'blocks' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="blocks-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'journal', 'goals', 'chat', 'tools'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedFilter === filter
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'bg-white/50 text-gray-600 hover:bg-white/80'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              {/* Memory Blocks List */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading memories...</p>
                </div>
              ) : filteredBlocks.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm p-12 text-center">
                  <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-gray-900 text-lg mb-2">No memories yet</h3>
                  <p className="text-gray-600 text-sm">
                    As you use Luma, important moments will be saved here automatically.
                  </p>
                </Card>
              ) : (
                filteredBlocks.map((block, index) => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
                      <div className="p-4">
                        {/* Block Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getBlockTypeIcon(block.block_type)}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 capitalize">
                                  {block.block_type}
                                </span>
                                {getPrivacyIcon(block.privacy_level)}
                              </div>
                              <p className="text-xs text-gray-500">
                                from {block.source_feature} • {new Date(block.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedBlockId(expandedBlockId === block.id ? null : block.id)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {expandedBlockId === block.id ? (
                                <EyeOff className="w-4 h-4 text-gray-600" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                            <button
                              onClick={() => handleExcludeBlock(block.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>

                        {/* Summary */}
                        <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                          {block.summary || block.content_text.substring(0, 150) + '...'}
                        </p>

                        {/* Themes */}
                        {block.themes && block.themes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {block.themes.map((theme, i) => (
                              <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700 text-xs">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Score: {block.relevance_score.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            <span>Retrieved {block.retrieval_count}x</span>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {expandedBlockId === block.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {block.content_text}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Search View */}
        {view === 'search' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="search-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Search Input */}
              <Card className="bg-white/80 backdrop-blur-sm p-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search your memories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                  >
                    {isSearching ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Semantic search powered by AI - find memories by meaning, not just keywords
                </p>
              </Card>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-gray-900 font-medium">Results ({searchResults.length})</h3>
                  {searchResults.map((block) => (
                    <Card key={block.id} className="bg-white/80 backdrop-blur-sm p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getBlockTypeIcon(block.block_type)}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 mb-2">{block.summary || block.content_text.substring(0, 200)}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="capitalize">{block.block_type}</span>
                            <span>•</span>
                            <span>{block.source_feature}</span>
                            <span>•</span>
                            <span>{new Date(block.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Insights View */}
        {view === 'insights' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="insights-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm p-12 text-center">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-gray-900 text-lg mb-2">Weekly Insights Coming Soon</h3>
                <p className="text-gray-600 text-sm">
                  AI-generated summaries of your patterns and progress will appear here.
                </p>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Settings View */}
        {view === 'settings' && memorySettings && (
          <AnimatePresence mode="wait">
            <motion.div
              key="settings-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <Card className="bg-white/80 backdrop-blur-sm p-6">
                <h3 className="text-gray-900 font-medium mb-4">Memory Settings</h3>

                <div className="space-y-4">
                  {/* Memory Enabled */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enable Memory</p>
                      <p className="text-xs text-gray-600">Allow Luma to remember your interactions</p>
                    </div>
                    <button
                      onClick={() => handleUpdateSettings({ memory_enabled: !memorySettings.memory_enabled })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        memorySettings.memory_enabled ? 'bg-indigo-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          memorySettings.memory_enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Privacy Mode */}
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Privacy Mode</p>
                    <div className="flex gap-2">
                      {['open', 'balanced', 'private'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => handleUpdateSettings({ privacy_mode: mode as any })}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            memorySettings.privacy_mode === mode
                              ? 'bg-indigo-500 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exclude Crisis Content */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Exclude Crisis Content</p>
                      <p className="text-xs text-gray-600">Don't save highly sensitive moments</p>
                    </div>
                    <button
                      onClick={() => handleUpdateSettings({ exclude_crisis_content: !memorySettings.exclude_crisis_content })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        memorySettings.exclude_crisis_content ? 'bg-indigo-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          memorySettings.exclude_crisis_content ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Card>

              {/* Info Card */}
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium text-gray-900 mb-1">How Memory Works</p>
                    <p className="text-xs leading-relaxed">
                      Luma automatically saves important insights, patterns, and context from your interactions.
                      This helps provide more personalized support over time. You have full control over what's
                      remembered and can delete anything at any time.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
