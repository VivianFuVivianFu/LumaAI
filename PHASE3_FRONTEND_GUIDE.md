# Phase 3 Frontend Integration - Complete Implementation Guide

**Duration**: Week 2 (8-10 hours)
**Prerequisites**: Week 1 tasks complete (Chat + Tools working)

---

## Overview

Phase 3 adds the **Master Agent / Neuronetwork System** to the frontend. This provides:
- 🎯 Event logging from all features
- 💡 AI-generated nudges on surfaces
- 👍 User feedback collection
- 🧠 Personalization over time

---

## 🎯 Part 1: useMasterAgent Hook (2 hours)

### File: `src/hooks/useMasterAgent.ts` (NEW)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../lib/api';

// Master Agent API types
interface MasterAgentEvent {
  event_type: string;
  source_feature: string;
  source_id: string;
  event_data?: Record<string, any>;
}

interface Nudge {
  id: string;
  nudge_kind: string;
  surface: string;
  title: string;
  body: string;
  cta_text: string;
  cta_link: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'accepted' | 'dismissed' | 'expired';
  created_at: string;
  expires_at: string;
}

interface Feedback {
  feedback_type: string;
  target_type: string;
  target_id: string;
  rating?: number;
  comment?: string;
}

export function useMasterAgent() {
  const [isEnabled, setIsEnabled] = useState(true);

  // Log an event (fire-and-forget)
  const logEvent = useCallback(async (event: MasterAgentEvent) => {
    if (!isEnabled) return;

    try {
      await fetchApi('/master-agent/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to log event:', error);
      // Silent failure - don't block user experience
    }
  }, [isEnabled]);

  // Get nudges for a surface
  const getNudges = useCallback(async (surface: string): Promise<Nudge[]> => {
    if (!isEnabled) return [];

    try {
      const result = await fetchApi<{ nudges: Nudge[] }>(
        `/master-agent/nudges/${surface}`,
        { method: 'GET' }
      );
      return result.nudges || [];
    } catch (error) {
      console.error('Failed to get nudges:', error);
      return [];
    }
  }, [isEnabled]);

  // Accept a nudge
  const acceptNudge = useCallback(async (nudgeId: string) => {
    if (!isEnabled) return;

    try {
      await fetchApi(`/master-agent/nudges/${nudgeId}/accept`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to accept nudge:', error);
    }
  }, [isEnabled]);

  // Dismiss a nudge
  const dismissNudge = useCallback(async (nudgeId: string) => {
    if (!isEnabled) return;

    try {
      await fetchApi(`/master-agent/nudges/${nudgeId}/dismiss`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to dismiss nudge:', error);
    }
  }, [isEnabled]);

  // Record feedback
  const recordFeedback = useCallback(async (feedback: Feedback) => {
    if (!isEnabled) return;

    try {
      await fetchApi('/master-agent/feedback', {
        method: 'POST',
        body: JSON.stringify(feedback),
      });
    } catch (error) {
      console.error('Failed to record feedback:', error);
    }
  }, [isEnabled]);

  return {
    logEvent,
    getNudges,
    acceptNudge,
    dismissNudge,
    recordFeedback,
    isEnabled,
    setIsEnabled,
  };
}
```

---

## 💡 Part 2: NudgeCard Component (3 hours)

### File: `src/components/NudgeCard.tsx` (NEW)

```typescript
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Sparkles, Target, BookOpen, Brain, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Nudge {
  id: string;
  nudge_kind: string;
  surface: string;
  title: string;
  body: string;
  cta_text: string;
  cta_link: string;
  priority: 'high' | 'medium' | 'low';
}

interface NudgeCardProps {
  nudge: Nudge;
  onAccept: (nudgeId: string) => void;
  onDismiss: (nudgeId: string) => void;
}

const NUDGE_ICONS: Record<string, React.ReactNode> = {
  cross_feature: <Sparkles className="w-5 h-5" />,
  risk_hygiene: <Target className="w-5 h-5" />,
  momentum_celebration: <Sparkles className="w-5 h-5" />,
  wellness_checkpoint: <Brain className="w-5 h-5" />,
  goal_milestone: <Target className="w-5 h-5" />,
  journal_prompt: <BookOpen className="w-5 h-5" />,
  tool_suggestion: <Brain className="w-5 h-5" />,
  memory_insight: <Sparkles className="w-5 h-5" />,
};

const PRIORITY_COLORS = {
  high: {
    bg: 'from-red-50 to-pink-50',
    border: 'border-red-200',
    text: 'text-red-900',
    button: 'from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600',
  },
  medium: {
    bg: 'from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    button: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
  },
  low: {
    bg: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    button: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
  },
};

export function NudgeCard({ nudge, onAccept, onDismiss }: NudgeCardProps) {
  const colors = PRIORITY_COLORS[nudge.priority] || PRIORITY_COLORS.medium;
  const icon = NUDGE_ICONS[nudge.nudge_kind] || <Sparkles className="w-5 h-5" />;

  const handleAccept = () => {
    onAccept(nudge.id);
  };

  const handleDismiss = () => {
    onDismiss(nudge.id);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={`relative p-4 bg-gradient-to-br ${colors.bg} ${colors.border} border-2 shadow-lg mb-4`}
        >
          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {/* Icon & Title */}
          <div className="flex items-start gap-3 mb-2">
            <div className={`w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center ${colors.text}`}>
              {icon}
            </div>
            <div className="flex-1 pr-8">
              <h3 className={`font-semibold ${colors.text}`}>{nudge.title}</h3>
            </div>
          </div>

          {/* Body */}
          <p className={`text-sm ${colors.text} opacity-90 mb-4 ml-13`}>
            {nudge.body}
          </p>

          {/* CTA Button */}
          <Button
            onClick={handleAccept}
            className={`w-full bg-gradient-to-r ${colors.button} text-white`}
          >
            {nudge.cta_text}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 🔗 Part 3: Integrate Event Logging (2 hours)

### Update Chat Screen

**File**: `src/components/ChatScreen.tsx`

```typescript
// Add import
import { useMasterAgent } from '../hooks/useMasterAgent';

// Inside component
const { logEvent } = useMasterAgent();

// In handleSendMessage, after successful message:
if (conversationId) {
  const response = await chatApi.sendMessage(conversationId, userMessageContent);

  // Log event
  logEvent({
    event_type: 'message_sent',
    source_feature: 'chat',
    source_id: conversationId,
    event_data: {
      message_length: userMessageContent.length,
    },
  });

  // Rest of code...
}
```

### Update Goals Screen

**File**: `src/components/GoalsScreen.tsx`

```typescript
// Add import
import { useMasterAgent } from '../hooks/useMasterAgent';

// Inside component
const { logEvent } = useMasterAgent();

// In handleCreateGoal, after successful creation:
const result = await goalsApi.createGoal({...});

// Log event
logEvent({
  event_type: 'goal_created',
  source_feature: 'goals',
  source_id: result.goal.id,
  event_data: {
    category: selectedCategory,
    timeframe: selectedTimeframe,
  },
});
```

### Update Journal Screen

**File**: `src/components/JournalSessionScreen.tsx`

```typescript
// Add import
import { useMasterAgent } from '../hooks/useMasterAgent';

// Inside component
const { logEvent } = useMasterAgent();

// After entry saved:
logEvent({
  event_type: 'journal_entry_created',
  source_feature: 'journal',
  source_id: sessionId,
  event_data: {
    mode: currentMode,
    entry_length: entry.length,
  },
});
```

### Update Tools Screens

Add event logging to each tool after successful creation:

```typescript
// In BrainExerciseScreen.tsx
logEvent({
  event_type: 'tool_used',
  source_feature: 'tools',
  source_id: response.exercise.id,
  event_data: {
    tool_type: 'brain_exercise',
  },
});

// Similar for Narrative and FutureMe
```

### Update Dashboard

**File**: `src/components/Dashboard.tsx`

```typescript
// After mood check-in:
logEvent({
  event_type: 'mood_checkin',
  source_feature: 'dashboard',
  source_id: userId,
  event_data: {
    mood_value: moodValue,
  },
});
```

---

## 🎨 Part 4: Display Nudges on Surfaces (3 hours)

### Home/Dashboard Screen

**File**: `src/components/Dashboard.tsx`

```typescript
import { useMasterAgent } from '../hooks/useMasterAgent';
import { NudgeCard } from './NudgeCard';

export function Dashboard() {
  const { getNudges, acceptNudge, dismissNudge } = useMasterAgent();
  const [nudges, setNudges] = useState<any[]>([]);
  const [isLoadingNudges, setIsLoadingNudges] = useState(true);

  // Load nudges on mount
  useEffect(() => {
    const loadNudges = async () => {
      const result = await getNudges('home');
      setNudges(result);
      setIsLoadingNudges(false);
    };

    loadNudges();
  }, [getNudges]);

  const handleAcceptNudge = async (nudgeId: string) => {
    await acceptNudge(nudgeId);
    // Remove from UI
    setNudges(prev => prev.filter(n => n.id !== nudgeId));

    // Navigate based on CTA link
    const nudge = nudges.find(n => n.id === nudgeId);
    if (nudge?.cta_link) {
      // Handle navigation (e.g., onShowGoals(), onShowJournal())
    }
  };

  const handleDismissNudge = async (nudgeId: string) => {
    await dismissNudge(nudgeId);
    setNudges(prev => prev.filter(n => n.id !== nudgeId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br...">
      {/* Header */}

      {/* Nudges */}
      {!isLoadingNudges && nudges.length > 0 && (
        <motion.div className="px-6 mt-4">
          {nudges.map(nudge => (
            <NudgeCard
              key={nudge.id}
              nudge={nudge}
              onAccept={handleAcceptNudge}
              onDismiss={handleDismissNudge}
            />
          ))}
        </motion.div>
      )}

      {/* Rest of dashboard content */}
    </div>
  );
}
```

### Chat Screen

```typescript
// Add at top of chat messages area
{!isLoadingNudges && nudges.length > 0 && (
  <div className="px-6 mt-4">
    {nudges.slice(0, 1).map(nudge => (
      <NudgeCard key={nudge.id} nudge={nudge} onAccept={handleAcceptNudge} onDismiss={handleDismissNudge} />
    ))}
  </div>
)}
```

### Goals Screen

```typescript
// Similar to Dashboard
const [nudges, setNudges] = useState<any[]>([]);

useEffect(() => {
  getNudges('goals').then(setNudges);
}, []);

// Display at top of goals list
```

### Journal Screen

```typescript
// Similar pattern - add nudges for 'journal' surface
```

### Tools Screen

```typescript
// Similar pattern - add nudges for 'tools' surface
```

---

## 👍 Part 5: Feedback Collection (1 hour)

### Add Thumbs Up/Down to Chat Messages

**File**: `src/components/ChatScreen.tsx`

```typescript
import { ThumbsUp, ThumbsDown } from 'lucide-react';

// In message rendering
{message.sender === 'luma' && (
  <div className="flex gap-2 mt-2 ml-12">
    <button
      onClick={() => {
        recordFeedback({
          feedback_type: 'thumbs_up',
          target_type: 'ai_response',
          target_id: message.id,
        });
      }}
      className="p-1 hover:bg-gray-100 rounded-full"
    >
      <ThumbsUp className="w-4 h-4 text-gray-500" />
    </button>
    <button
      onClick={() => {
        recordFeedback({
          feedback_type: 'thumbs_down',
          target_type: 'ai_response',
          target_id: message.id,
        });
      }}
      className="p-1 hover:bg-gray-100 rounded-full"
    >
      <ThumbsDown className="w-4 h-4 text-gray-500" />
    </button>
  </div>
)}
```

### Implicit Feedback

Add implicit feedback when users complete actions:

```typescript
// When user completes a goal action
recordFeedback({
  feedback_type: 'implicit_positive',
  target_type: 'feature_use',
  target_id: actionId,
});

// When user completes journal entry
recordFeedback({
  feedback_type: 'implicit_positive',
  target_type: 'feature_use',
  target_id: entryId,
});
```

---

## 🧪 Testing Phase 3 Integration

### Test Event Logging

1. Open browser console
2. Open Network tab → Filter by "master-agent"
3. Perform actions:
   - Send chat message → Should see `POST /events` with `message_sent`
   - Create goal → Should see `POST /events` with `goal_created`
   - Submit mood → Should see `POST /events` with `mood_checkin`

### Test Nudge Display

1. Create activity to trigger nudges:
   - Complete brain exercise
   - Wait 3 days (or manually update timestamps in DB)
   - Don't create journal
2. Refresh home screen
3. Should see nudge: "Time to journal?"

### Test Feedback

1. Chat with Luma
2. Click thumbs up on response
3. Check Network tab → Should see `POST /master-agent/feedback`

---

## 📊 Success Criteria

### Phase 3 Frontend Complete When:

- [ ] useMasterAgent hook created and working
- [ ] NudgeCard component displays correctly
- [ ] Event logging works from all 5 features:
  - [ ] Chat (message_sent)
  - [ ] Goals (goal_created, milestone_completed)
  - [ ] Journal (entry_created, session_completed)
  - [ ] Tools (tool_used)
  - [ ] Dashboard (mood_checkin)
- [ ] Nudges display on all 5 surfaces:
  - [ ] Home/Dashboard
  - [ ] Chat
  - [ ] Journal
  - [ ] Goals
  - [ ] Tools
- [ ] Accept/dismiss nudge buttons work
- [ ] Feedback thumbs up/down work
- [ ] No console errors
- [ ] Network requests succeed

---

## 🐛 Common Issues & Fixes

### Issue: Nudges Always Empty

**Cause**: Not enough activity to trigger nudge rules

**Solution**:
1. Create sufficient activity (3+ mood check-ins, 2+ journal entries, 1+ goal)
2. Or manually insert test nudge in database
3. Or wait for rules to trigger over time

### Issue: Event Logging Fails

**Cause**: Invalid auth token or API error

**Solution**:
1. Check auth token in localStorage
2. Verify backend is running
3. Check backend logs for errors

### Issue: NudgeCard Not Showing

**Cause**: Component not imported or nudges array empty

**Solution**:
1. Verify `getNudges()` returns data
2. Check conditional rendering logic
3. Ensure NudgeCard is imported

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All event logging tested
- [ ] All 8 nudge kinds work
- [ ] Feedback collection works
- [ ] No console errors
- [ ] Performance tested (no slowdowns)
- [ ] Error handling in place
- [ ] Loading states implemented
- [ ] Backend Phase 3 deployed
- [ ] Database tables created in production
- [ ] Environment variables configured

---

## 📈 Next Steps After Phase 3

### Week 3-4: Polish & Production

1. **Phase 3.3: Rule Pack Expansion** (4-6 hours)
   - Add 5-10 new nudge rules
   - Test new triggers
   - Refine nudge content

2. **Phase 3.4: Admin UI** (6-8 hours)
   - Build admin dashboard
   - View all events
   - Manually create test nudges
   - View user context

3. **Testing & QA** (8-10 hours)
   - Integration tests
   - E2E tests with Playwright
   - Performance testing
   - Security audit

4. **Production Deployment** (2-4 hours)
   - Deploy backend
   - Deploy frontend
   - Run smoke tests
   - Monitor logs

---

## 📚 Additional Resources

- [PHASE3_FOUNDATION_COMPLETE.md](PHASE3_FOUNDATION_COMPLETE.md) - Backend architecture
- [PROJECT_STATUS_AND_ROADMAP.md](PROJECT_STATUS_AND_ROADMAP.md) - Overall project plan
- [ALTERNATIVE_API_TESTING_METHODS.md](ALTERNATIVE_API_TESTING_METHODS.md) - Testing guides

---

**Ready to Build Phase 3 Frontend!** 🎉

Follow this guide step-by-step, test as you go, and within 8-10 hours you'll have Phase 3 fully integrated into your frontend!
