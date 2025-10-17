# Complete Implementation Guide - Ready to Code

**Date**: 2025-10-13
**Priority**: Week 1 & Week 2 Tasks
**Estimated Time**: 20-25 hours total

---

## ✅ Phase 1: API Client Updates (DONE)

### File: `src/lib/api.ts`

**Changes Applied**:
1. ✅ Fixed `goalsApi.createGoal` type - `clarifications` now array
2. ✅ Added `chatApi` - All 4 methods (create, send, get, getAll)
3. ✅ Added `toolsApi` - All 3 tools (brain, narrative, future-me)

**Result**: API client now supports all Phase 2 features!

---

## 📋 Phase 2: Connect Chat to Backend API (30 minutes)

### File: `src/components/ChatScreen.tsx`

**Current Status**: Uses mock responses with `generateResponse()`

**Changes Needed**:

#### Step 1: Add Imports
```typescript
// Add to top of file
import { chatApi } from '../lib/api';
```

#### Step 2: Add State for Conversation ID
```typescript
// Add after existing state
const [conversationId, setConversationId] = useState<string | null>(null);
const [isLoadingConversation, setIsLoadingConversation] = useState(true);
```

#### Step 3: Create Conversation on Mount
```typescript
// Add useEffect to initialize conversation
useEffect(() => {
  const initializeConversation = async () => {
    try {
      const result = await chatApi.createConversation('Chat with Luma');
      setConversationId(result.conversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // Fallback to mock mode if API fails
    } finally {
      setIsLoadingConversation(false);
    }
  };

  initializeConversation();
}, []);
```

#### Step 4: Replace handleSendMessage
```typescript
const handleSendMessage = async () => {
  if (!inputMessage.trim()) return;

  const userMessageContent = inputMessage.trim();

  // Add user message immediately
  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    content: userMessageContent,
    sender: 'user',
    timestamp: new Date(),
  };

  setMessages(prev => [...prev, userMessage]);
  setInputMessage('');
  setIsTyping(true);

  try {
    // Try to use real API if conversation exists
    if (conversationId) {
      const response = await chatApi.sendMessage(conversationId, userMessageContent);

      const lumaResponse: ChatMessage = {
        id: response.assistantMessage.id,
        content: response.assistantMessage.content,
        sender: 'luma',
        timestamp: new Date(response.assistantMessage.created_at),
      };

      setMessages(prev => [...prev, lumaResponse]);
    } else {
      // Fallback to mock response if no conversation
      throw new Error('No conversation available');
    }
  } catch (error) {
    console.error('Failed to send message, using fallback:', error);

    // Fallback to mock response
    setTimeout(() => {
      const lumaResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(userMessageContent),
        sender: 'luma',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, lumaResponse]);
    }, 1500);
  } finally {
    setIsTyping(false);
  }
};
```

**Benefits**:
- ✅ Real AI responses from backend
- ✅ Graceful fallback to mock if API fails
- ✅ Conversation persistence
- ✅ Error handling

---

## 🛠️ Phase 3: Build Tools UI Components (6-8 hours)

### Tool #1: Brain Exercise Screen (2-3 hours)

**File**: `src/components/tools/BrainExerciseScreen.tsx` (NEW)

```typescript
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Brain, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toolsApi } from '../../lib/api';

interface BrainExerciseScreenProps {
  onBack: () => void;
}

export function BrainExerciseScreen({ onBack }: BrainExerciseScreenProps) {
  const [context, setContext] = useState('');
  const [thought, setThought] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!context.trim() || !thought.trim()) {
      alert('Please fill in both fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await toolsApi.createBrainExercise({
        context_description: context,
        original_thought: thought,
      });
      setResult(response);
    } catch (error) {
      console.error('Failed to create exercise:', error);
      alert('Failed to create exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setContext('');
    setThought('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-24">
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

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        className="px-6 mt-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          Empower My Brain
        </h1>
        <p className="text-gray-600 mt-2">
          Neuroplasticity exercises to reframe negative thoughts
        </p>
      </motion.div>

      {/* Content */}
      <motion.div
        className="px-6 mt-8 space-y-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {!result ? (
          <Card className="p-6 bg-white/90 backdrop-blur-md border-white/20 shadow-xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Context & Situation
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Describe the situation that triggered this thought... (e.g., 'I keep thinking I'm not good enough for my job')"
                  className="w-full h-24 px-4 py-3 bg-white border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Thought
                </label>
                <textarea
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  placeholder="What exactly is the thought? (e.g., 'I'm a fraud and everyone will realize it')"
                  className="w-full h-24 px-4 py-3 bg-white border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isLoading || !context.trim() || !thought.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Reframe...
                  </>
                ) : (
                  'Generate Reframe'
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Reframe Card */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                💚 {result.exercise.title}
              </h3>
              <p className="text-green-800 text-lg leading-relaxed">
                {result.exercise.reframe}
              </p>
            </Card>

            {/* Micro Action Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🎯 Micro-Action (1-2 minutes)
              </h3>
              <p className="text-blue-800 leading-relaxed">
                {result.exercise.micro_action}
              </p>
            </Card>

            {/* Why It Helps Card */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-xl">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                ✨ Why This Helps
              </h3>
              <p className="text-purple-800 leading-relaxed">
                {result.exercise.why_it_helps}
              </p>
            </Card>

            {/* Steps */}
            {result.steps && result.steps.length > 0 && (
              <Card className="p-6 bg-white/90 backdrop-blur-md border-white/20 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  📝 Practice Steps
                </h3>
                <ol className="space-y-2">
                  {result.steps.map((step: any) => (
                    <li key={step.step_number} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {step.step_number}
                      </span>
                      <p className="text-gray-700">{step.instruction}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full py-6"
            >
              Try Another Thought
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

### Tool #2: Narrative Screen (2-3 hours)

**File**: `src/components/tools/NarrativeScreen.tsx` (NEW)

```typescript
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toolsApi } from '../../lib/api';

interface NarrativeScreenProps {
  onBack: () => void;
}

export function NarrativeScreen({ onBack }: NarrativeScreenProps) {
  const [context, setContext] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!context.trim()) {
      alert('Please describe your situation');
      return;
    }

    setIsLoading(true);
    try {
      const response = await toolsApi.createNarrative({
        context_description: context,
      });
      setResult(response);
    } catch (error) {
      console.error('Failed to create narrative:', error);
      alert('Failed to create narrative. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setContext('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 pb-24">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-6 pt-12"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <button onClick={onBack} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div className="px-6 mt-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          My New Narrative
        </h1>
        <p className="text-gray-600 mt-2">
          Turn your journaling into a powerful life story
        </p>
      </motion.div>

      {/* Content */}
      <motion.div className="px-6 mt-8 space-y-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {!result ? (
          <Card className="p-6 bg-white/90 backdrop-blur-md border-white/20 shadow-xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe Your Situation
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Share what you've been experiencing... (e.g., 'I've been feeling stuck since losing my job last year')"
                  className="w-full h-32 px-4 py-3 bg-white border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isLoading || !context.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white py-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Narrative...
                  </>
                ) : (
                  'Create My Story'
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Title Card */}
            <Card className="p-6 bg-white/90 backdrop-blur-md border-white/20 shadow-xl text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {result.narrative.title}
              </h2>
            </Card>

            {/* Past Chapter */}
            <Card className="p-6 bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                📖 Chapter 1: The Past
              </h3>
              <p className="text-slate-700 leading-relaxed">
                {result.narrative.chapter_past}
              </p>
            </Card>

            {/* Present Chapter */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                ✨ Chapter 2: The Present
              </h3>
              <p className="text-blue-800 leading-relaxed">
                {result.narrative.chapter_present}
              </p>
            </Card>

            {/* Future Chapter */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                🌟 Chapter 3: The Future
              </h3>
              <p className="text-green-800 leading-relaxed">
                {result.narrative.chapter_future}
              </p>
            </Card>

            {/* Future Choice */}
            <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-xl text-center">
              <p className="text-lg font-semibold text-amber-900 italic">
                "{result.narrative.future_choice}"
              </p>
            </Card>

            <Button onClick={handleReset} variant="outline" className="w-full py-6">
              Create Another Narrative
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

### Tool #3: Future Me Screen (2-3 hours)

**File**: `src/components/tools/FutureMeScreen.tsx` (NEW)

```typescript
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toolsApi } from '../../lib/api';

interface FutureMeScreenProps {
  onBack: () => void;
}

export function FutureMeScreen({ onBack }: FutureMeScreenProps) {
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!goal.trim()) {
      alert('Please enter a goal or theme');
      return;
    }

    setIsLoading(true);
    try {
      const response = await toolsApi.createFutureMeExercise({
        goal_or_theme: goal,
      });
      setResult(response);
    } catch (error) {
      console.error('Failed to create exercise:', error);
      alert('Failed to create exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setGoal('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 pb-24">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-6 pt-12"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <button onClick={onBack} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div className="px-6 mt-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          Future Me
        </h1>
        <p className="text-gray-600 mt-2">
          Visualize who you're becoming with affirmations
        </p>
      </motion.div>

      {/* Content */}
      <motion.div className="px-6 mt-8 space-y-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {!result ? (
          <Card className="p-6 bg-white/90 backdrop-blur-md border-white/20 shadow-xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Goal or Theme
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="What do you want to work toward? (e.g., 'I want to feel confident speaking up in meetings')"
                  className="w-full h-24 px-4 py-3 bg-white border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isLoading || !goal.trim()}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white py-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Visualization...
                  </>
                ) : (
                  'Visualize Future Me'
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Visualization Script */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-xl">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">
                🌟 Your Visualization (2-3 minutes)
              </h3>
              <p className="text-purple-800 leading-relaxed whitespace-pre-line">
                {result.exercise.visualization_script}
              </p>
            </Card>

            {/* Affirmations */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                💫 Daily Affirmations
              </h3>
              <div className="space-y-2">
                <p className="text-blue-800 italic">"{result.exercise.affirmation_1}"</p>
                <p className="text-blue-800 italic">"{result.exercise.affirmation_2}"</p>
                <p className="text-blue-800 italic">"{result.exercise.affirmation_3}"</p>
              </div>
            </Card>

            {/* If-Then Anchor */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                ⚡ If-Then Anchor
              </h3>
              <p className="text-green-800 leading-relaxed">
                {result.exercise.if_then_anchor}
              </p>
            </Card>

            <Button onClick={handleReset} variant="outline" className="w-full py-6">
              Create Another Visualization
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

### Update ToolsScreen to Navigate (15 minutes)

**File**: `src/components/ToolsScreen.tsx`

**Add State**:
```typescript
const [activeScreen, setActiveScreen] = useState<'list' | 'brain' | 'narrative' | 'future-me'>('list');
```

**Update handleToolClick**:
```typescript
const handleToolClick = (toolId: string) => {
  switch(toolId) {
    case 'reframe-mindset':
      setActiveScreen('brain');
      break;
    case 'my-new-narrative':
      setActiveScreen('narrative');
      break;
    case 'future-me':
      setActiveScreen('future-me');
      break;
  }
};
```

**Conditional Rendering**:
```typescript
if (activeScreen === 'brain') {
  return <BrainExerciseScreen onBack={() => setActiveScreen('list')} />;
}

if (activeScreen === 'narrative') {
  return <NarrativeScreen onBack={() => setActiveScreen('list')} />;
}

if (activeScreen === 'future-me') {
  return <FutureMeScreen onBack={() => setActiveScreen('list')} />;
}

// Existing list view
return (
  <div className="min-h-screen...">
    {/* Current code */}
  </div>
);
```

---

## 🎯 WEEK 2: Phase 3 Frontend Integration (8-10 hours)

This comprehensive guide continues with Phase 3 implementation in a separate document: `PHASE3_FRONTEND_GUIDE.md`

---

## 📊 Progress Tracking

### Week 1 Checklist
- [x] ✅ API client updated (goals, chat, tools)
- [ ] ⏳ ChatScreen connected to API (30 min)
- [ ] ⏳ BrainExerciseScreen built (2-3 hours)
- [ ] ⏳ NarrativeScreen built (2-3 hours)
- [ ] ⏳ FutureMeScreen built (2-3 hours)
- [ ] ⏳ ToolsScreen navigation updated (15 min)

### Testing After Week 1
```bash
# Test Chat
1. Open chat
2. Send message
3. Verify AI responds (not mock)

# Test Tools
1. Open "Empower My Brain"
2. Fill in context + thought
3. Verify reframe generated
4. Test other two tools similarly
```

---

## ⚡ Quick Start Commands

```bash
# Ensure backend is running
cd backend && npm run dev

# In another terminal, run frontend
cd .. && npm run dev

# Open browser
http://localhost:3000
```

---

**Ready to Implement!** 🚀

All code is provided above. Copy-paste each section into the respective files, test as you go, and you'll have Phase 2 fully functional within 6-8 hours of focused work.
