import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Target,
  BookOpen,
  Sparkles,
  Mic,
  MicOff,
  Home,
  Heart,
  Brain,
  Lightbulb
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { NudgeCard } from './NudgeCard';
import { chatApi } from '../lib/api';
import { useMasterAgent } from '../hooks/useMasterAgent';

interface ChatScreenProps {
  onBack: () => void;
  onShowGoals?: () => void;
  onShowJournal?: () => void;
  onShowTools?: () => void;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'luma';
  timestamp: Date;
  type?: 'text' | 'suggestion';
}

export function ChatScreen({ onBack, onShowGoals, onShowJournal, onShowTools }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi there! I'm Luma, your AI companion for mental wellness and personal growth. I'm here to support you with psychology-informed guidance, using approaches from CBT, DBT, IFS, and attachment healing. How are you feeling today?",
      sender: 'luma',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Phase 3: Master Agent hook
  const { logEvent, fetchNudges, acceptNudge, dismissNudge } = useMasterAgent();
  const [chatNudges, setChatNudges] = useState<any[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        const result = await chatApi.createConversation('New Chat with Luma');
        setConversationId(result.conversation.id);

        // Phase 3: Log conversation start event
        logEvent({
          event_type: 'conversation_started',
          feature_area: 'chat',
          event_data: {
            conversation_id: result.conversation.id,
          },
        });
      } catch (error) {
        console.error('Failed to create conversation:', error);
      } finally {
        setIsLoadingConversation(false);
      }
    };

    initConversation();
  }, []);

  // Load nudges on mount
  useEffect(() => {
    const loadNudges = async () => {
      const nudges = await fetchNudges('chat');
      setChatNudges(nudges);
    };
    loadNudges();
  }, [fetchNudges]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    const currentInput = inputMessage;
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Create placeholder for streaming response
    const streamingMessageId = (Date.now() + 1).toString();
    const streamingMessage: ChatMessage = {
      id: streamingMessageId,
      content: '',
      sender: 'luma',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, streamingMessage]);

    try {
      // Call backend API with streaming
      const result = await chatApi.sendMessage(
        conversationId,
        currentInput,
        (chunk) => {
          // Update the streaming message with new chunks
          setMessages(prev =>
            prev.map(msg =>
              msg.id === streamingMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
      );

      // Update with final assistant message data
      setMessages(prev =>
        prev.map(msg =>
          msg.id === streamingMessageId
            ? {
                ...msg,
                id: result.assistantMessage.id,
                content: result.assistantMessage.content,
                timestamp: new Date(result.assistantMessage.created_at),
              }
            : msg
        )
      );

      // Phase 3: Log message sent event
      logEvent({
        event_type: 'message_sent',
        feature_area: 'chat',
        event_data: {
          conversation_id: conversationId,
          message_length: currentInput.length,
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);

      // Replace streaming message with error fallback
      setMessages(prev =>
        prev.map(msg =>
          msg.id === streamingMessageId
            ? {
                ...msg,
                content: generateResponse(currentInput),
              }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('anxious') || input.includes('worried') || input.includes('stress')) {
      return "I hear that you're feeling anxious. That's completely valid - anxiety is our mind's way of trying to protect us. Let's explore this together. Can you tell me what specific thoughts or situations are contributing to these feelings right now?";
    }
    
    if (input.includes('sad') || input.includes('down') || input.includes('depressed')) {
      return "Thank you for sharing that you're feeling down. It takes courage to acknowledge these feelings. Remember that what you're experiencing is temporary, even though it might not feel that way right now. What has been weighing on your heart lately?";
    }
    
    if (input.includes('goal') || input.includes('achieve') || input.includes('want to')) {
      return "I love hearing about your aspirations! Setting meaningful goals is such an important part of personal growth. When we break down our dreams into manageable steps, they become much more achievable. What specific goal would you like to work on together?";
    }
    
    if (input.includes('relationship') || input.includes('friend') || input.includes('family')) {
      return "Relationships can be both our greatest source of joy and our biggest challenge. It sounds like there's something on your mind about your connections with others. Healthy relationships require vulnerability, boundaries, and communication. What's been happening in your relationships lately?";
    }
    
    return "Thank you for sharing that with me. I'm here to listen and support you through whatever you're experiencing. Your feelings are valid, and it's okay to not have everything figured out. What would feel most helpful to explore together right now?";
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // In real app, implement voice recording functionality
  };

  const suggestedPrompts = [
    "I'm feeling overwhelmed with work",
    "Help me set a meaningful goal",  
    "I want to improve my relationships",
    "I'm struggling with self-doubt"
  ];

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
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900">Chat with Luma</h1>
            <p className="text-sm text-gray-600">Your AI wellness companion</p>
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

      {/* Chat Messages */}
      <div className="flex-1 px-6 py-4 pb-32 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="space-y-4">
          {/* Nudges Section */}
          {chatNudges.length > 0 && (
            <div className="space-y-3 mb-6">
              {chatNudges
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
                      else if (route.includes('tools')) onShowTools?.();
                    }}
                  />
                ))}
            </div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                {message.sender === 'luma' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Heart className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-600">Luma</span>
                  </div>
                )}
                <Card className={`p-4 ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0' 
                    : 'bg-white/80 backdrop-blur-sm border-white/50'
                }`}>
                  <p className={`leading-relaxed ${
                    message.sender === 'user' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {message.content}
                  </p>
                </Card>
                <p className={`text-xs text-gray-500 mt-1 ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-start"
            >
              <div className="max-w-[80%]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Heart className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-600">Luma is typing...</span>
                </div>
                <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length === 1 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <p className="text-sm text-gray-600 mb-3">You can try asking:</p>
            <div className="space-y-2">
              {suggestedPrompts.map((prompt, index) => (
                <motion.button
                  key={index}
                  onClick={() => setInputMessage(prompt)}
                  className="block w-full text-left p-3 bg-white/60 hover:bg-white/80 rounded-xl border border-white/50 transition-all duration-200"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-700">{prompt}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <motion.div
        className="fixed bottom-20 left-6 right-6"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="bg-white/90 backdrop-blur-md border-white/20 shadow-xl">
          <div className="p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Share what's on your mind..."
                  className="w-full bg-transparent resize-none border-none outline-none placeholder-gray-500 text-gray-900 min-h-[20px] max-h-32"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleVoiceToggle}
                  size="sm"
                  variant={isRecording ? "destructive" : "ghost"}
                  className="w-10 h-10 p-0 rounded-full"
                >
                  {isRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  disabled={!inputMessage.trim()}
                  className="w-10 h-10 p-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

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
              { icon: MessageCircle, label: 'Chat', active: true, onClick: () => {} },
              { icon: Target, label: 'Goals', active: false, onClick: onShowGoals || onBack },
              { icon: BookOpen, label: 'Journal', active: false, onClick: onShowJournal || onBack },
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