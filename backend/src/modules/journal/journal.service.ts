import { supabaseAdmin } from '../../config/supabase.config';
import OpenAI from 'openai';
import { env } from '../../config/env.config';
import {
  JOURNAL_SYSTEM_PROMPT,
  JOURNAL_MODE_PROMPTS,
  CRISIS_RESOURCES_JOURNAL,
  METADATA_PATTERNS,
} from '../../services/openai/journal.prompts';
import { CreateJournalSessionInput, CreateJournalEntryInput } from './journal.schema';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'self-harm', 'hurt myself',
  'want to die', 'abuse', 'abused', 'overdose'
];

interface JournalInsightMetadata {
  articulationScore?: number;
  coherenceScore?: number;
  emotionalTone?: string;
  themes?: string[];
  safetyFlags?: string[];
  depthLevel?: 'surface' | 'moderate' | 'deep';
}

export class JournalService {
  /**
   * Create a new journal session
   */
  async createSession(userId: string, input: CreateJournalSessionInput) {
    const { data, error } = await supabaseAdmin
      .from('journal_sessions')
      .insert({
        user_id: userId,
        mode: input.mode,
        title: input.title || JOURNAL_MODE_PROMPTS[input.mode].goal,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create journal session');

    return {
      session: data,
      initialPrompt: JOURNAL_MODE_PROMPTS[input.mode].initialPrompt,
    };
  }

  /**
   * Get all journal sessions for a user
   */
  async getSessions(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('journal_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch journal sessions');
    return data || [];
  }

  /**
   * Get a single session with entries
   */
  async getSession(sessionId: string, userId: string) {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('journal_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) throw new Error('Session not found');

    const { data: entries, error: entriesError } = await supabaseAdmin
      .from('journal_entries')
      .select(`
        *,
        journal_insights (*)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (entriesError) throw new Error('Failed to fetch entries');

    return { session, entries: entries || [] };
  }

  /**
   * Create a journal entry with AI analysis
   */
  async createEntry(
    sessionId: string,
    userId: string,
    input: CreateJournalEntryInput
  ) {
    // Verify session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('journal_sessions')
      .select('mode')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) throw new Error('Session not found');

    // Save entry
    const { data: entry, error: entryError } = await supabaseAdmin
      .from('journal_entries')
      .insert({
        session_id: sessionId,
        user_id: userId,
        content: input.content,
        step_number: input.stepNumber,
        prompt: input.prompt,
        is_private: input.isPrivate,
        exclude_from_memory: input.excludeFromMemory,
      })
      .select()
      .single();

    if (entryError) throw new Error('Failed to save journal entry');

    // Generate AI insight
    const insight = await this.generateInsight(
      userId,
      entry.content,
      session.mode,
      entry.id
    );

    return { entry, insight };
  }

  /**
   * Generate AI insight for a journal entry
   */
  private async generateInsight(
    userId: string,
    content: string,
    mode: string,
    entryId: string
  ) {
    try {
      const modeConfig = JOURNAL_MODE_PROMPTS[mode as keyof typeof JOURNAL_MODE_PROMPTS];

      const systemPrompt = `${JOURNAL_SYSTEM_PROMPT}

${modeConfig.context}

IMPORTANT: At the end of your response, include metadata in this exact XML format:
<journal_meta>
  <articulation_score>0.00</articulation_score>
  <coherence_score>0.00</coherence_score>
  <emotional_tone>reflective</emotional_tone>
  <themes>["theme1","theme2"]</themes>
  <safety_flags>[]</safety_flags>
  <depth_level>surface|moderate|deep</depth_level>
</journal_meta>

The metadata should reflect:
- Articulation (0-1): clarity and emotional specificity
- Coherence (0-1): narrative flow and integration
- Emotional Tone: reflective/anxious/hopeful/defensive/vulnerable
- Themes: recurring psychological motifs
- Depth Level: surface/moderate/deep`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // Faster and cheaper than gpt-4-turbo
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: content },
        ],
        temperature: 0.8,
        max_tokens: 600,
      });

      let insightText = completion.choices[0].message.content || '';

      // Detect crisis
      const detectCrisis = (text: string) =>
        CRISIS_KEYWORDS.some(kw => text.toLowerCase().includes(kw));

      if (detectCrisis(content) || detectCrisis(insightText)) {
        insightText += CRISIS_RESOURCES_JOURNAL;
      }

      // Extract metadata
      const metadata = this.extractMetadata(insightText);

      // Remove metadata XML from visible text
      const cleanInsight = insightText.replace(/<journal_meta>[\s\S]*?<\/journal_meta>/g, '').trim();

      // Save insight to database
      const { data: insight, error } = await supabaseAdmin
        .from('journal_insights')
        .insert({
          entry_id: entryId,
          user_id: userId,
          insight_text: cleanInsight,
          articulation_score: metadata.articulationScore,
          coherence_score: metadata.coherenceScore,
          emotional_tone: metadata.emotionalTone,
          themes: metadata.themes || [],
          safety_flags: metadata.safetyFlags || [],
          depth_level: metadata.depthLevel,
        })
        .select()
        .single();

      if (error) throw new Error('Failed to save insight');

      return insight;
    } catch (error: any) {
      console.error('Journal insight generation error:', error);
      throw new Error('Failed to generate insight');
    }
  }

  /**
   * Extract metadata from AI response
   */
  private extractMetadata(text: string): JournalInsightMetadata {
    const metadata: JournalInsightMetadata = {};

    const artMatch = text.match(METADATA_PATTERNS.articulationScore);
    if (artMatch) metadata.articulationScore = parseFloat(artMatch[1]);

    const cohMatch = text.match(METADATA_PATTERNS.coherenceScore);
    if (cohMatch) metadata.coherenceScore = parseFloat(cohMatch[1]);

    const toneMatch = text.match(METADATA_PATTERNS.emotionalTone);
    if (toneMatch) metadata.emotionalTone = toneMatch[1];

    const themesMatch = text.match(METADATA_PATTERNS.themes);
    if (themesMatch) {
      metadata.themes = themesMatch[1]
        .split(',')
        .map(t => t.trim().replace(/"/g, ''));
    }

    const flagsMatch = text.match(METADATA_PATTERNS.safetyFlags);
    if (flagsMatch && flagsMatch[1]) {
      metadata.safetyFlags = flagsMatch[1]
        .split(',')
        .map(f => f.trim().replace(/"/g, ''));
    }

    const depthMatch = text.match(METADATA_PATTERNS.depthLevel);
    if (depthMatch) {
      metadata.depthLevel = depthMatch[1] as 'surface' | 'moderate' | 'deep';
    }

    return metadata;
  }

  /**
   * Complete a journal session
   */
  async completeSession(sessionId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('journal_sessions')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error('Failed to complete session');
    return data;
  }

  /**
   * Delete a journal session
   */
  async deleteSession(sessionId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('journal_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw new Error('Failed to delete session');
    return { success: true };
  }
}
