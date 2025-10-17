/**
 * Psychology Patterns Module
 *
 * Lightweight pattern detection for cognitive distortions, emotional states,
 * attachment styles, and tool suggestions. All detection is regex-based
 * for <100ms performance.
 */

// ========================================
// COGNITIVE DISTORTION PATTERNS
// ========================================

export interface CognitiveDistortion {
  type: string;
  patterns: RegExp[];
  description: string;
  reframe_suggestion: string;
}

export const COGNITIVE_DISTORTIONS: CognitiveDistortion[] = [
  {
    type: "all_or_nothing",
    patterns: [
      /\b(always|never|every time|everyone|no one|everything|nothing)\b/i,
      /\b(complete failure|total disaster|absolutely|entirely)\b/i,
      /\b(either .{1,30} or)\b/i,
    ],
    description: "Seeing things in black-and-white categories",
    reframe_suggestion: "Notice the gray areas and partial truths. What's one exception to this absolute?"
  },
  {
    type: "catastrophizing",
    patterns: [
      /\b(what if|worst case|terrible|awful|disaster|catastrophe|ruin)\b/i,
      /\b(everything will|going to fail|fall apart|end badly)\b/i,
      /\b(can't handle|too much|overwhelming)\b/i,
    ],
    description: "Expecting the worst possible outcome",
    reframe_suggestion: "What's a more realistic outcome? What evidence do you have that contradicts this fear?"
  },
  {
    type: "mind_reading",
    patterns: [
      /\b(they think|he thinks|she thinks|people think|everyone thinks)\b/i,
      /\b(they probably|must think|definitely thinks|I know they)\b/i,
      /\b(judging me|thinks I'm|sees me as)\b/i,
    ],
    description: "Assuming you know what others are thinking",
    reframe_suggestion: "What actual evidence do you have? Could there be other explanations for their behavior?"
  },
  {
    type: "fortune_telling",
    patterns: [
      /\b(I know it will|it will definitely|going to|won't work|will fail)\b/i,
      /\b(it's going to be|I'll never|won't ever|will always)\b/i,
      /\b(no point|why bother|won't make a difference)\b/i,
    ],
    description: "Predicting negative outcomes without evidence",
    reframe_suggestion: "What would you tell a friend in this situation? What's one small step you could try?"
  },
  {
    type: "should_statements",
    patterns: [
      /\b(I should|I shouldn't|I must|I have to|I need to)\b/i,
      /\b(supposed to|ought to|expected to)\b/i,
      /\b(should have|shouldn't have|should be)\b/i,
    ],
    description: "Rigid rules about how you or others should behave",
    reframe_suggestion: "What would happen if you replaced 'should' with 'could' or 'want to'?"
  },
  {
    type: "self_criticism",
    patterns: [
      /\b(I'm (so )?(stupid|dumb|worthless|useless|pathetic|failure|idiot))\b/i,
      /\b(I hate myself|I'm the worst|I'm terrible|I can't do anything)\b/i,
      /\b(something wrong with me|I'm broken|I'm damaged)\b/i,
    ],
    description: "Harsh self-judgment and negative self-labeling",
    reframe_suggestion: "Would you talk to a friend this way? What's a kinder way to describe this situation?"
  },
  {
    type: "personalizing",
    patterns: [
      /\b(it's my fault|I'm to blame|because of me|I caused)\b/i,
      /\b(my responsibility|I should have prevented|if only I)\b/i,
      /\b(everything's on me|all my fault)\b/i,
    ],
    description: "Taking responsibility for things outside your control",
    reframe_suggestion: "What factors were outside your control? What would you tell a friend in this situation?"
  }
];

// ========================================
// EMOTIONAL STATE PATTERNS
// ========================================

export interface EmotionalState {
  state: string;
  patterns: RegExp[];
  communication_style: string;
}

export const EMOTIONAL_STATES: EmotionalState[] = [
  {
    state: "anxious",
    patterns: [
      /\b(anxious|worried|nervous|scared|afraid|fear|panic|stress)\b/i,
      /\b(what if|can't stop thinking|racing thoughts|can't breathe)\b/i,
      /\b(on edge|tense|overwhelmed)\b/i,
    ],
    communication_style: "Calm, grounding, present-focused. Validate fear, offer concrete coping tools."
  },
  {
    state: "depressed",
    patterns: [
      /\b(depressed|sad|hopeless|empty|numb|nothing matters)\b/i,
      /\b(don't care|no energy|tired of|can't feel|pointless)\b/i,
      /\b(give up|why bother|no point)\b/i,
    ],
    communication_style: "Gentle, compassionate, non-demanding. Small steps, validate exhaustion, gentle encouragement."
  },
  {
    state: "angry",
    patterns: [
      /\b(angry|furious|mad|pissed|hate|rage|frustrated)\b/i,
      /\b(so done|can't stand|fed up|sick of)\b/i,
      /\b(unfair|not right|shouldn't be)\b/i,
    ],
    communication_style: "Validating, non-judgmental. Acknowledge anger as information, explore needs underneath."
  },
  {
    state: "excited",
    patterns: [
      /\b(excited|happy|great|amazing|wonderful|fantastic)\b/i,
      /\b(so good|feeling better|making progress|proud)\b/i,
      /\b(can't wait|looking forward|hopeful)\b/i,
    ],
    communication_style: "Celebratory, encouraging. Reinforce progress, explore what's working, plan for sustainability."
  },
  {
    state: "confused",
    patterns: [
      /\b(confused|don't understand|not sure|don't know|unclear)\b/i,
      /\b(what do I|how do I|which should|can't decide)\b/i,
      /\b(stuck|lost|overwhelmed with options)\b/i,
    ],
    communication_style: "Clarifying, structured. Break down complexity, offer frameworks, validate uncertainty."
  },
  {
    state: "stressed",
    patterns: [
      /\b(stressed|pressure|too much|can't handle|overwhelmed)\b/i,
      /\b(so many|all at once|no time|deadline|have to)\b/i,
      /\b(burning out|exhausted|drained)\b/i,
    ],
    communication_style: "Soothing, practical. Prioritize, suggest micro-actions, validate capacity limits."
  }
];

// ========================================
// ATTACHMENT STYLE INDICATORS
// ========================================

export interface AttachmentIndicator {
  style: string;
  patterns: RegExp[];
  response_adaptation: string;
}

export const ATTACHMENT_INDICATORS: AttachmentIndicator[] = [
  {
    style: "anxious",
    patterns: [
      /\b(need reassurance|am I|do you think I|is this okay)\b/i,
      /\b(afraid of|worry about|what if they|losing)\b/i,
      /\b(abandoned|rejected|not enough|too much)\b/i,
      /\b(need to know|tell me|am I doing)\b/i,
    ],
    response_adaptation: "Provide consistent reassurance, validate feelings, emphasize stability. Avoid being dismissive."
  },
  {
    style: "avoidant",
    patterns: [
      /\b(I'm fine|don't need|handle it myself|on my own)\b/i,
      /\b(don't want to talk|not a big deal|whatever)\b/i,
      /\b(prefer not to|rather not|don't really)\b/i,
      /\b(independent|by myself|don't need help)\b/i,
    ],
    response_adaptation: "Respect autonomy, offer tools without pressure, emphasize choice. Don't push connection."
  },
  {
    style: "disorganized",
    patterns: [
      /\b(want to .{1,20} but (scared|afraid|can't))\b/i,
      /\b(push .{1,20} away|come back|confused about)\b/i,
      /\b(trust but|want to but|need but)\b/i,
      /\b(safe but|close but)\b/i,
    ],
    response_adaptation: "Be steady and predictable, validate contradictory feelings, emphasize safety. Avoid intensity."
  },
  {
    style: "secure",
    patterns: [
      /\b(I feel|I need|I want|I'm working on)\b/i,
      /\b(help me understand|can you|I'd like to)\b/i,
      /\b(open to|willing to|ready to)\b/i,
    ],
    response_adaptation: "Direct, collaborative, growth-focused. Can explore deeper patterns and challenge gently."
  }
];

// ========================================
// TOOL ROUTING SUGGESTIONS
// ========================================

export interface ToolSuggestion {
  tool_name: string;
  keywords: RegExp[];
  suggestion_template: string;
  why_helpful: string;
}

export const TOOL_SUGGESTIONS: ToolSuggestion[] = [
  {
    tool_name: "Empower My Brain",
    keywords: [
      /\b(thought|thinking|belief|assume|tell myself|my mind)\b/i,
      /\b(stuck|spiral|ruminate|can't stop|racing)\b/i,
      /\b(reframe|perspective|see differently)\b/i,
      /\b(anxious|worried|stressed|overwhelmed)\b/i,
    ],
    suggestion_template: "It sounds like you're caught in a thought pattern. Would you like to try **Empower My Brain**? It can help you identify what your mind is doing and practice a neuroplasticity exercise to rewire this pattern.",
    why_helpful: "This tool uses evidence-based neuroplasticity exercises to help you shift stuck thought patterns through cognitive reframing, mindfulness, and somatic practices."
  },
  {
    tool_name: "My New Narrative",
    keywords: [
      /\b(story|always been|my whole life|since childhood)\b/i,
      /\b(pattern|keep doing|always do|same thing)\b/i,
      /\b(who I am|identity|define me|makes me)\b/i,
      /\b(change|different|become|transform)\b/i,
    ],
    suggestion_template: "It sounds like you're noticing a deeper pattern or life story. Would you like to explore **My New Narrative**? It helps you identify old narratives and consciously write new ones aligned with who you want to become.",
    why_helpful: "This tool helps you identify limiting narratives from your past and consciously create new, empowering stories about who you are and who you're becoming."
  },
  {
    tool_name: "Future Me",
    keywords: [
      /\b(future|tomorrow|next|goal|want to|hope to)\b/i,
      /\b(where I'm going|who I want|direction|path)\b/i,
      /\b(vision|dream|aspire|become)\b/i,
      /\b(plan|steps|how do I|what should I)\b/i,
    ],
    suggestion_template: "It sounds like you're thinking about your future self. Would you like to try **Future Me**? It helps you connect with the person you're becoming and clarify the path forward.",
    why_helpful: "This tool helps you visualize and connect with your future self, clarifying your values, goals, and the steps needed to bridge who you are now with who you want to become."
  },
  {
    tool_name: "Goals",
    keywords: [
      /\b(goal|achieve|accomplish|work toward)\b/i,
      /\b(plan|strategy|step|action|do)\b/i,
      /\b(track|progress|follow through|commit)\b/i,
      /\b(motivation|discipline|consistency)\b/i,
    ],
    suggestion_template: "It sounds like you're ready to take action. Would you like to set this up in **Goals**? You can break this down into sprints and track your progress with accountability support.",
    why_helpful: "The Goals feature helps you break big objectives into manageable sprints with specific actions, making it easier to follow through and build momentum."
  }
];

// ========================================
// ENHANCED CRISIS KEYWORDS
// ========================================

export const CRISIS_KEYWORDS = [
  // Original keywords (15)
  /\b(kill myself|suicide|suicidal|end my life|want to die)\b/i,
  /\b(self harm|cut myself|hurt myself|harm myself)\b/i,
  /\b(overdose|pills|weapon|gun|knife)\b/i,
  /\b(can't go on|no reason to live|better off dead)\b/i,
  /\b(goodbye forever|final message|last time)\b/i,

  // Extended keywords (10 more)
  /\b(not worth living|life isn't worth|nothing to live for)\b/i,
  /\b(everyone would be better|burden to everyone|shouldn't exist)\b/i,
  /\b(made a plan|writing a note|saying goodbye)\b/i,
  /\b(can't take it anymore|too much pain|end the pain)\b/i,
  /\b(give up on life|done with life|ready to go)\b/i,
];

// ========================================
// DETECTION FUNCTIONS
// ========================================

export interface PsychologyAnalysis {
  cognitive_distortions: string[];
  emotional_state: string | null;
  attachment_style: string | null;
  tool_suggestions: string[];
  crisis_detected: boolean;
}

/**
 * Analyzes user message for cognitive distortions, emotional state,
 * attachment style, and tool suggestions.
 * Target: <100ms execution time
 */
export function analyzeMessage(message: string): PsychologyAnalysis {
  const result: PsychologyAnalysis = {
    cognitive_distortions: [],
    emotional_state: null,
    attachment_style: null,
    tool_suggestions: [],
    crisis_detected: false,
  };

  // Crisis detection (highest priority)
  for (const pattern of CRISIS_KEYWORDS) {
    if (pattern.test(message)) {
      result.crisis_detected = true;
      return result; // Immediate return on crisis
    }
  }

  // Cognitive distortion detection (score-based, top 2)
  const distortionScores: { type: string; score: number; distortion: CognitiveDistortion }[] = [];
  for (const distortion of COGNITIVE_DISTORTIONS) {
    let score = 0;
    for (const pattern of distortion.patterns) {
      if (pattern.test(message)) score++;
    }
    if (score > 0) {
      distortionScores.push({ type: distortion.type, score, distortion });
    }
  }
  distortionScores.sort((a, b) => b.score - a.score);
  result.cognitive_distortions = distortionScores.slice(0, 2).map(d => d.type);

  // Emotional state detection (highest scoring)
  let maxEmotionScore = 0;
  let detectedEmotion: string | null = null;
  for (const emotion of EMOTIONAL_STATES) {
    let score = 0;
    for (const pattern of emotion.patterns) {
      if (pattern.test(message)) score++;
    }
    if (score > maxEmotionScore) {
      maxEmotionScore = score;
      detectedEmotion = emotion.state;
    }
  }
  result.emotional_state = detectedEmotion;

  // Attachment style detection (highest scoring)
  let maxAttachmentScore = 0;
  let detectedAttachment: string | null = null;
  for (const attachment of ATTACHMENT_INDICATORS) {
    let score = 0;
    for (const pattern of attachment.patterns) {
      if (pattern.test(message)) score++;
    }
    if (score > maxAttachmentScore) {
      maxAttachmentScore = score;
      detectedAttachment = attachment.style;
    }
  }
  result.attachment_style = detectedAttachment;

  // Tool suggestions (top 2 by keyword match)
  const toolScores: { tool: string; score: number }[] = [];
  for (const tool of TOOL_SUGGESTIONS) {
    let score = 0;
    for (const keyword of tool.keywords) {
      if (keyword.test(message)) score++;
    }
    if (score > 0) {
      toolScores.push({ tool: tool.tool_name, score });
    }
  }
  toolScores.sort((a, b) => b.score - a.score);
  result.tool_suggestions = toolScores.slice(0, 2).map(t => t.tool);

  return result;
}

/**
 * Gets the reframe suggestion for a cognitive distortion
 */
export function getDistortionReframe(distortionType: string): string | null {
  const distortion = COGNITIVE_DISTORTIONS.find(d => d.type === distortionType);
  return distortion ? distortion.reframe_suggestion : null;
}

/**
 * Gets the communication style for an emotional state
 */
export function getEmotionalCommunicationStyle(emotionalState: string): string | null {
  const emotion = EMOTIONAL_STATES.find(e => e.state === emotionalState);
  return emotion ? emotion.communication_style : null;
}

/**
 * Gets the response adaptation for an attachment style
 */
export function getAttachmentResponseAdaptation(attachmentStyle: string): string | null {
  const attachment = ATTACHMENT_INDICATORS.find(a => a.style === attachmentStyle);
  return attachment ? attachment.response_adaptation : null;
}

/**
 * Gets tool suggestion template and explanation
 */
export function getToolSuggestion(toolName: string): { suggestion: string; why: string } | null {
  const tool = TOOL_SUGGESTIONS.find(t => t.tool_name === toolName);
  if (!tool) return null;
  return {
    suggestion: tool.suggestion_template,
    why: tool.why_helpful
  };
}
