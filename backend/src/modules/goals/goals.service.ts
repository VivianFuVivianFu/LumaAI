import { supabaseAdmin } from '../../config/supabase.config';
import OpenAI from 'openai';
import { env } from '../../config/env.config';
import {
  CLARIFICATION_PROMPT,
  ACTION_PLAN_PROMPT,
  CATEGORY_PROMPTS,
  CRISIS_RESOURCES_GOALS,
} from '../../services/openai/goals.prompts';
import { CreateGoalInput, AnswerClarificationInput } from './goals.schema';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const CRISIS_KEYWORDS = ['suicide', 'suicidal', 'self-harm', 'hurt myself', 'want to die'];

export class GoalsService {
  /**
   * Create a new goal and get clarifying questions
   */
  async createGoal(userId: string, input: CreateGoalInput) {
    // Save goal
    const { data: goal, error } = await supabaseAdmin
      .from('goals')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        category: input.category,
        timeframe: input.timeframe,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create goal');

    // Generate clarifying questions
    const clarifications = await this.generateClarifyingQuestions(
      userId,
      goal.id,
      input
    );

    return { goal, clarifications };
  }

  /**
   * Generate clarifying questions using AI
   */
  private async generateClarifyingQuestions(
    userId: string,
    goalId: string,
    input: CreateGoalInput
  ) {
    try {
      const categoryContext = CATEGORY_PROMPTS[input.category as keyof typeof CATEGORY_PROMPTS];

      const userPrompt = `User's Goal: "${input.title}"
${input.description ? `Description: ${input.description}` : ''}
Category: ${input.category}
Timeframe: ${input.timeframe}

Category Context: ${categoryContext}

Generate exactly 3 essential clarifying questions to help create a personalized action plan. Focus on the most critical aspects needed for a successful action plan.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: CLARIFICATION_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');

      // Return just the questions array for Postman compatibility
      return response.questions || [];
    } catch (error: any) {
      console.error('Clarification generation error:', error);
      throw new Error('Failed to generate questions');
    }
  }

  /**
   * Submit clarification answers and generate action plan
   */
  async submitClarifications(
    goalId: string,
    userId: string,
    input: AnswerClarificationInput
  ) {
    // Verify goal
    const { data: goal, error: goalError } = await supabaseAdmin
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (goalError || !goal) throw new Error('Goal not found');

    // Save clarifications
    const clarificationPromises = input.answers.map((answer) =>
      supabaseAdmin.from('goal_clarifications').insert({
        goal_id: goalId,
        user_id: userId,
        question: `Question ${answer.questionId}`,
        answer: answer.answer,
        question_order: answer.questionId,
      })
    );

    await Promise.all(clarificationPromises);

    // Generate action plan
    const actionPlan = await this.generateActionPlan(userId, goal, input.answers);

    return actionPlan;
  }

  /**
   * Generate action plan with AI
   */
  private async generateActionPlan(
    userId: string,
    goal: any,
    answers: Array<{ questionId: number; answer: string }>
  ) {
    try {
      const answersText = answers.map((a) => `Q${a.questionId}: ${a.answer}`).join('\n');

      const userPrompt = `Goal: "${goal.title}"
${goal.description ? `Description: ${goal.description}` : ''}
Category: ${goal.category}
Timeframe: ${goal.timeframe}

User's Clarifications:
${answersText}

Generate a personalized, sprint-based action plan.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // Faster and cheaper than gpt-4-turbo
        messages: [
          { role: 'system', content: ACTION_PLAN_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const planData = JSON.parse(completion.choices[0].message.content || '{}');

      // Check for crisis indicators
      const detectCrisis = (text: string) =>
        CRISIS_KEYWORDS.some((kw) => text.toLowerCase().includes(kw));

      if (detectCrisis(answersText) || detectCrisis(JSON.stringify(planData))) {
        planData.encouragement += CRISIS_RESOURCES_GOALS;
      }

      // Save action plan to database
      const { data: actionPlan, error: planError } = await supabaseAdmin
        .from('action_plans')
        .insert({
          goal_id: goal.id,
          user_id: userId,
          smart_statement: planData.smartStatement,
          total_sprints: planData.totalSprints,
          metadata: {
            risks: planData.risks,
            encouragement: planData.encouragement,
            reasoning: planData.reasoning
          },
        })
        .select()
        .single();

      if (planError) throw new Error('Failed to save action plan');

      // Save milestones/sprints
      const milestonePromises = planData.sprints.map((sprint: any) =>
        supabaseAdmin
          .from('milestones')
          .insert({
            action_plan_id: actionPlan.id,
            user_id: userId,
            sprint_number: sprint.sprintNumber,
            title: sprint.title,
            description: sprint.description,
          })
          .select()
          .single()
          .then(({ data: milestone }) => {
            // Save weekly actions for this sprint
            if (milestone && sprint.actions) {
              const actionPromises = sprint.actions.map((action: string, index: number) =>
                supabaseAdmin.from('weekly_actions').insert({
                  milestone_id: milestone.id,
                  goal_id: goal.id,
                  user_id: userId,
                  action_text: action,
                  week_number: sprint.sprintNumber,
                })
              );
              return Promise.all(actionPromises);
            }
          })
      );

      await Promise.all(milestonePromises);

      return { actionPlan, planData };
    } catch (error: any) {
      console.error('Action plan generation error:', error);
      throw new Error('Failed to generate action plan');
    }
  }

  /**
   * Get all goals for a user
   */
  async getGoals(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch goals');
    return data || [];
  }

  /**
   * Get a single goal with action plan
   */
  async getGoal(goalId: string, userId: string) {
    const { data: goal, error: goalError } = await supabaseAdmin
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (goalError || !goal) throw new Error('Goal not found');

    const { data: actionPlan } = await supabaseAdmin
      .from('action_plans')
      .select(`
        *,
        milestones (
          *,
          weekly_actions (*)
        )
      `)
      .eq('goal_id', goalId)
      .single();

    return { goal, actionPlan };
  }

  /**
   * Update goal
   */
  async updateGoal(goalId: string, userId: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error('Failed to update goal');
    return data;
  }

  /**
   * Toggle action completion
   */
  async toggleAction(actionId: string, userId: string, completed: boolean) {
    const { data, error } = await supabaseAdmin
      .from('weekly_actions')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', actionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error('Failed to update action');

    // Update goal progress
    await this.recalculateGoalProgress(data.goal_id, userId);

    return data;
  }

  /**
   * Recalculate goal progress based on completed actions
   */
  private async recalculateGoalProgress(goalId: string, userId: string) {
    const { data: actions } = await supabaseAdmin
      .from('weekly_actions')
      .select('completed')
      .eq('goal_id', goalId)
      .eq('user_id', userId);

    if (actions && actions.length > 0) {
      const completedCount = actions.filter((a) => a.completed).length;
      const progress = Math.round((completedCount / actions.length) * 100);

      await supabaseAdmin
        .from('goals')
        .update({ progress })
        .eq('id', goalId)
        .eq('user_id', userId);
    }
  }

  /**
   * Delete goal
   */
  async deleteGoal(goalId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw new Error('Failed to delete goal');
    return { success: true };
  }

  /**
   * Adjust action plan based on user feedback
   */
  async adjustActionPlan(goalId: string, userId: string, feedback: string) {
    try {
      // Fetch goal and current action plan
      const { data: goal, error: goalError } = await supabaseAdmin
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();

      if (goalError || !goal) throw new Error('Goal not found');

      const { data: currentPlan, error: planError } = await supabaseAdmin
        .from('action_plans')
        .select(`
          *,
          milestones (
            *,
            weekly_actions (*)
          )
        `)
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planError || !currentPlan) throw new Error('Action plan not found');

      // Get clarifications for context
      const { data: clarifications } = await supabaseAdmin
        .from('goal_clarifications')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: true });

      const clarificationsText = clarifications?.map((c) => `${c.question}: ${c.answer}`).join('\n') || '';

      // Generate adjusted plan using AI
      const userPrompt = `Goal: "${goal.title}"
${goal.description ? `Description: ${goal.description}` : ''}
Category: ${goal.category}
Timeframe: ${goal.timeframe}

User's Clarifications:
${clarificationsText}

Current Action Plan:
SMART Statement: ${currentPlan.smart_statement}
Total Sprints: ${currentPlan.total_sprints}

User Feedback for Adjustment:
"${feedback}"

Based on this feedback, generate an ADJUSTED action plan that addresses the user's concerns while maintaining the core goal. Keep what works, adjust what doesn't.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: ACTION_PLAN_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const adjustedPlanData = JSON.parse(completion.choices[0].message.content || '{}');

      // Save new action plan
      const { data: newActionPlan, error: newPlanError } = await supabaseAdmin
        .from('action_plans')
        .insert({
          goal_id: goal.id,
          user_id: userId,
          smart_statement: adjustedPlanData.smartStatement,
          total_sprints: adjustedPlanData.totalSprints,
          metadata: {
            risks: adjustedPlanData.risks,
            encouragement: adjustedPlanData.encouragement,
            reasoning: adjustedPlanData.reasoning,
            adjustmentFeedback: feedback, // Store the adjustment reason
          },
        })
        .select()
        .single();

      if (newPlanError) throw new Error('Failed to save adjusted action plan');

      // Save new milestones/sprints
      const milestonePromises = adjustedPlanData.sprints.map((sprint: any) =>
        supabaseAdmin
          .from('milestones')
          .insert({
            action_plan_id: newActionPlan.id,
            user_id: userId,
            sprint_number: sprint.sprintNumber,
            title: sprint.title,
            description: sprint.description,
          })
          .select()
          .single()
          .then(({ data: milestone }) => {
            if (milestone && sprint.actions) {
              const actionPromises = sprint.actions.map((action: string) =>
                supabaseAdmin.from('weekly_actions').insert({
                  milestone_id: milestone.id,
                  goal_id: goal.id,
                  user_id: userId,
                  action_text: action,
                  week_number: sprint.sprintNumber,
                })
              );
              return Promise.all(actionPromises);
            }
          })
      );

      await Promise.all(milestonePromises);

      return { actionPlan: newActionPlan, planData: adjustedPlanData };
    } catch (error: any) {
      console.error('Action plan adjustment error:', error);
      throw new Error('Failed to adjust action plan');
    }
  }
}
