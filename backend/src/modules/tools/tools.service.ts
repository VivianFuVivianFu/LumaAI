import { supabaseAdmin } from '../../config/supabase.config';
import { OpenAIService } from '../../services/openai/openai.service';
import {
  EMPOWER_MY_BRAIN_PROMPT,
  MY_NEW_NARRATIVE_PROMPT,
  FUTURE_ME_PROMPT,
  CRISIS_KEYWORDS,
  CRISIS_FOOTER,
} from '../../services/openai/tools.prompts';
import {
  CreateBrainExerciseInput,
  CompleteBrainExerciseInput,
  CreateNarrativeInput,
  SubmitNarrativeReflectionsInput,
  CreateFutureMeInput,
  ReplayFutureMeInput,
  CreateToolSessionInput,
  CompleteToolSessionInput,
} from './tools.schema';

export class ToolsService {
  private openaiService: OpenAIService;

  constructor() {
    this.openaiService = new OpenAIService();
  }

  // =====================================================
  // 1. EMPOWER MY BRAIN - REFRAME EXERCISES
  // =====================================================

  async createBrainExercise(userId: string, input: CreateBrainExerciseInput) {
    // Generate AI exercise (optimized - no context fetching for speed)
    const aiResponse = await this.openaiService.generateStructuredResponse(
      this.buildBrainExercisePrompt(input, {}),
      EMPOWER_MY_BRAIN_PROMPT,
      []
    );

    // Parse JSON response
    const exerciseData = this.parseBrainExerciseResponse(aiResponse.content);

    // Check for crisis language
    const hasCrisisLanguage = this.detectCrisis(input.context_description);
    if (hasCrisisLanguage && exerciseData.core_output?.why_it_helps) {
      exerciseData.core_output.why_it_helps += '\n\n' + CRISIS_FOOTER;
    }

    // Save to database
    const { data: exercise, error } = await supabaseAdmin
      .from('brain_exercises')
      .insert({
        user_id: userId,
        title: exerciseData.title,
        duration: exerciseData.duration,
        context_description: input.context_description,
        original_thought: input.original_thought || exerciseData.core_output.original_thought,
        reframe: exerciseData.core_output.reframe,
        micro_action: exerciseData.core_output.micro_action,
        why_it_helps: exerciseData.core_output.why_it_helps,
        alternative_reframes: exerciseData.alternative_exercises || [],
      })
      .select()
      .single();

    if (error) throw error;

    return {
      exercise,
      alternative_exercises: exerciseData.alternative_exercises || [],
      tiny_action: exerciseData.tiny_action,
    };
  }

  async getBrainExercises(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabaseAdmin
      .from('brain_exercises')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  async getBrainExercise(exerciseId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('brain_exercises')
      .select('*')
      .eq('id', exerciseId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async completeBrainExercise(
    exerciseId: string,
    userId: string,
    input: CompleteBrainExerciseInput
  ) {
    const { data, error } = await supabaseAdmin
      .from('brain_exercises')
      .update({
        completed: input.completed,
        completed_at: input.completed ? new Date().toISOString() : null,
        saved_to_journal: input.saved_to_journal,
        linked_to_goals: input.linked_to_goals,
      })
      .eq('id', exerciseId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteBrainExercise(exerciseId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('brain_exercises')
      .delete()
      .eq('id', exerciseId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  // =====================================================
  // 2. MY NEW NARRATIVE - STORY TRANSFORMATION
  // =====================================================

  async createNarrative(userId: string, input: CreateNarrativeInput) {
    // Get user context for personalization
    const context = await this.getUserContext(userId);

    // Get journal themes if available
    const journalThemes = await this.getJournalThemes(userId);

    // Generate AI narrative
    const aiResponse = await this.openaiService.generateStructuredResponse(
      this.buildNarrativePrompt(input, context, journalThemes),
      MY_NEW_NARRATIVE_PROMPT,
      []
    );

    // Parse JSON response
    const narrativeData = this.parseNarrativeResponse(aiResponse.content);

    // Check for crisis language
    const hasCrisisLanguage = this.detectCrisis(input.context_description);
    if (hasCrisisLanguage && narrativeData.why_it_helps) {
      narrativeData.why_it_helps += '\n\n' + CRISIS_FOOTER;
    }

    // Save to database
    const { data: narrative, error } = await supabaseAdmin
      .from('narratives')
      .insert({
        user_id: userId,
        title: narrativeData.title,
        duration: narrativeData.duration,
        detected_themes: narrativeData.core_output.detected_themes || [],
        chapter_past: narrativeData.core_output.chapters.past,
        chapter_present: narrativeData.core_output.chapters.present,
        chapter_future: narrativeData.core_output.chapters.future,
        reflection_prompt_1: narrativeData.core_output.reflection_prompt_1,
        reflection_prompt_2: narrativeData.core_output.reflection_prompt_2,
        future_choice: narrativeData.core_output.future_choice,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      narrative,
      steps: narrativeData.steps,
      tiny_action: narrativeData.tiny_action,
      why_it_helps: narrativeData.why_it_helps,
    };
  }

  async submitNarrativeReflections(
    narrativeId: string,
    userId: string,
    input: SubmitNarrativeReflectionsInput
  ) {
    const { data, error } = await supabaseAdmin
      .from('narratives')
      .update({
        user_reflection_1: input.user_reflection_1,
        user_reflection_2: input.user_reflection_2,
        completed: input.completed,
        completed_at: input.completed ? new Date().toISOString() : null,
        saved_to_journal: input.saved_to_journal,
        linked_to_goals: input.linked_to_goals,
      })
      .eq('id', narrativeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getNarratives(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabaseAdmin
      .from('narratives')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  async getNarrative(narrativeId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('narratives')
      .select('*')
      .eq('id', narrativeId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteNarrative(narrativeId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('narratives')
      .delete()
      .eq('id', narrativeId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  // =====================================================
  // 3. FUTURE ME - VISUALIZATION & AFFIRMATIONS
  // =====================================================

  async createFutureMeExercise(userId: string, input: CreateFutureMeInput) {
    // Get user context for personalization
    const context = await this.getUserContext(userId);

    // Get active goals for context
    const activeGoals = await this.getActiveGoals(userId);

    // Generate AI visualization
    const aiResponse = await this.openaiService.generateStructuredResponse(
      this.buildFutureMePrompt(input, context, activeGoals),
      FUTURE_ME_PROMPT,
      []
    );

    // Parse JSON response
    const futureMeData = this.parseFutureMeResponse(aiResponse.content);

    // Check for crisis language
    const hasCrisisLanguage = this.detectCrisis(input.goal_or_theme);
    if (hasCrisisLanguage && futureMeData.why_it_helps) {
      futureMeData.why_it_helps += '\n\n' + CRISIS_FOOTER;
    }

    // Save to database
    const { data: exercise, error } = await supabaseAdmin
      .from('future_me_exercises')
      .insert({
        user_id: userId,
        title: futureMeData.title,
        duration: futureMeData.duration,
        goal_or_theme: input.goal_or_theme,
        visualization_script: futureMeData.core_output.visualization,
        affirmation_1: futureMeData.core_output.affirmations[0],
        affirmation_2: futureMeData.core_output.affirmations[1],
        affirmation_3: futureMeData.core_output.affirmations[2],
        if_then_anchor: futureMeData.core_output.if_then_anchor,
        replay_suggestion: futureMeData.core_output.replay_suggestion,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      exercise,
      steps: futureMeData.steps,
      tiny_action: futureMeData.tiny_action,
      why_it_helps: futureMeData.why_it_helps,
    };
  }

  async replayFutureMeExercise(
    exerciseId: string,
    userId: string,
    input: ReplayFutureMeInput
  ) {
    const { data, error } = await supabaseAdmin
      .from('future_me_exercises')
      .update({
        times_replayed: supabaseAdmin.sql`times_replayed + 1`,
        last_replayed_at: new Date().toISOString(),
        saved_to_journal: input.saved_to_journal,
        linked_to_goals: input.linked_to_goals,
      })
      .eq('id', exerciseId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getFutureMeExercises(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabaseAdmin
      .from('future_me_exercises')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  async getFutureMeExercise(exerciseId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('future_me_exercises')
      .select('*')
      .eq('id', exerciseId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteFutureMeExercise(exerciseId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('future_me_exercises')
      .delete()
      .eq('id', exerciseId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  // =====================================================
  // 4. TOOL SESSIONS - TRACKING
  // =====================================================

  async createToolSession(userId: string, input: CreateToolSessionInput) {
    const { data, error } = await supabaseAdmin
      .from('tool_sessions')
      .insert({
        user_id: userId,
        tool_type: input.tool_type,
        exercise_id: input.exercise_id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async completeToolSession(
    sessionId: string,
    userId: string,
    input: CompleteToolSessionInput
  ) {
    const { data, error } = await supabaseAdmin
      .from('tool_sessions')
      .update({
        completed_at: new Date().toISOString(),
        duration_seconds: input.duration_seconds,
        helpfulness_rating: input.helpfulness_rating,
        user_notes: input.user_notes,
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getToolSessions(userId: string, toolType?: string, limit = 50, offset = 0) {
    let query = supabaseAdmin
      .from('tool_sessions')
      .select('*')
      .eq('user_id', userId);

    if (toolType) {
      query = query.eq('tool_type', toolType);
    }

    const { data, error } = await query
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async getUserContext(userId: string) {
    // Get user profile
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('display_name, pronouns, timezone, locale')
      .eq('id', userId)
      .single();

    // Get latest mood
    const { data: latestMood } = await supabaseAdmin
      .from('mood_checkins')
      .select('mood_value, notes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      profile: user || {},
      mood: latestMood || null,
    };
  }

  private async getJournalThemes(userId: string) {
    // Get recent journal themes
    const { data } = await supabaseAdmin
      .from('journal_insights')
      .select('themes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!data) return [];

    // Flatten and deduplicate themes
    const allThemes = data
      .flatMap((insight: any) => insight.themes || [])
      .filter((theme: string, index: number, self: string[]) => self.indexOf(theme) === index);

    return allThemes.slice(0, 5); // Return top 5 themes
  }

  private async getActiveGoals(userId: string) {
    const { data } = await supabaseAdmin
      .from('goals')
      .select('title, category, timeframe')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    return data || [];
  }

  private buildBrainExercisePrompt(input: CreateBrainExerciseInput, context: any): string {
    return `Generate an Empower My Brain exercise for the following:

**Situation:**
${input.context_description}

${input.original_thought ? `**Thought to Reframe:**\n${input.original_thought}\n` : ''}

**Requirements:**
- Provide 1 main exercise with reframe and micro-action
- Provide 3 alternative exercises (each with title, reframe, micro_action)
- Make all exercises distinct and use different neuroplasticity approaches
- Keep reframes under 20 words
- Make micro-actions immediate and specific (1-2 minutes max)

Generate a personalized reframe exercise in the JSON format specified in the system prompt.`;
  }

  private buildNarrativePrompt(input: CreateNarrativeInput, context: any, themes: string[]): string {
    return `Generate a My New Narrative exercise for the following:

**User Context:**
${input.context_description}

**Focus Area:** ${input.focus_area || 'all'}

**User Profile:**
- Name: ${context.profile.display_name || 'User'}
- Pronouns: ${context.profile.pronouns || 'they/them'}

${context.mood ? `**Recent Mood:** ${context.mood.mood_value}/6${context.mood.notes ? ` - ${context.mood.notes}` : ''}` : ''}

${themes.length > 0 ? `**Journal Themes Detected:** ${themes.join(', ')}` : ''}

Generate a personalized narrative in the JSON format specified in the system prompt.`;
  }

  private buildFutureMePrompt(input: CreateFutureMeInput, context: any, goals: any[]): string {
    return `Generate a Future Me visualization exercise for the following:

**Goal or Theme:**
${input.goal_or_theme}

**Preferred Tone:** ${input.preferred_tone || 'balanced'}

**User Profile:**
- Name: ${context.profile.display_name || 'User'}
- Pronouns: ${context.profile.pronouns || 'they/them'}

${context.mood ? `**Recent Mood:** ${context.mood.mood_value}/6${context.mood.notes ? ` - ${context.mood.notes}` : ''}` : ''}

${goals.length > 0 ? `**Active Goals:**\n${goals.map((g: any) => `- ${g.title} (${g.category}, ${g.timeframe})`).join('\n')}` : ''}

Generate a personalized visualization in the JSON format specified in the system prompt.`;
  }

  private parseBrainExerciseResponse(content: string): any {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr);
    } catch (error) {
      throw new Error('Failed to parse AI response for brain exercise');
    }
  }

  private parseNarrativeResponse(content: string): any {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr);
    } catch (error) {
      throw new Error('Failed to parse AI response for narrative');
    }
  }

  private parseFutureMeResponse(content: string): any {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr);
    } catch (error) {
      throw new Error('Failed to parse AI response for future me exercise');
    }
  }

  private detectCrisis(text: string): boolean {
    const lowerText = text.toLowerCase();
    return CRISIS_KEYWORDS.some((keyword) => lowerText.includes(keyword));
  }
}

export const toolsService = new ToolsService();
