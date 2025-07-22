import { supabase } from "@/integrations/supabase/client";
import type { AISuggestion, EvaluationCriterion, SuggestionExtractionResult } from "@/types/aiSuggestions";

export class AISuggestionsService {
  static async createSuggestion(
    intakeFormId: string,
    sectionType: AISuggestion['sectionType'],
    content: any,
    sourceMessageId?: string,
    confidence?: number
  ): Promise<{ data?: AISuggestion; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: "User not authenticated" };
      }

      const { data, error } = await supabase
        .from('ai_suggestions')
        .insert({
          intake_form_id: intakeFormId,
          user_id: user.id,
          section_type: sectionType,
          suggestion_content: content,
          confidence_score: confidence,
          source_message_id: sourceMessageId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating AI suggestion:', error);
        return { error: error.message };
      }

      return { data: this.transformDbSuggestion(data) };
    } catch (error) {
      console.error('Error in createSuggestion:', error);
      return { error: 'Failed to create AI suggestion' };
    }
  }

  static async getSuggestionsForForm(intakeFormId: string): Promise<{ data?: AISuggestion[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('intake_form_id', intakeFormId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching suggestions:', error);
        return { error: error.message };
      }

      return { data: data.map(this.transformDbSuggestion) };
    } catch (error) {
      console.error('Error in getSuggestionsForForm:', error);
      return { error: 'Failed to fetch suggestions' };
    }
  }

  static async updateSuggestionStatus(
    id: string,
    status: AISuggestion['status'],
    modifiedContent?: any
  ): Promise<{ error?: string }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      }

      if (modifiedContent) {
        updateData.modified_content = modifiedContent;
      }

      const { error } = await supabase
        .from('ai_suggestions')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating suggestion:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Error in updateSuggestionStatus:', error);
      return { error: 'Failed to update suggestion' };
    }
  }

  static async createEvaluationCriterion(
    intakeFormId: string,
    type: 'mandatory' | 'rated',
    name: string,
    description?: string,
    weight?: number,
    source: 'user' | 'ai_suggested' | 'ai_accepted' = 'user',
    aiSuggestionId?: string
  ): Promise<{ data?: EvaluationCriterion; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: "User not authenticated" };
      }

      const { data, error } = await supabase
        .from('evaluation_criteria')
        .insert({
          intake_form_id: intakeFormId,
          user_id: user.id,
          type,
          name,
          description,
          weight,
          source,
          ai_suggestion_id: aiSuggestionId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating evaluation criterion:', error);
        return { error: error.message };
      }

      return { data: this.transformDbCriterion(data) };
    } catch (error) {
      console.error('Error in createEvaluationCriterion:', error);
      return { error: 'Failed to create evaluation criterion' };
    }
  }

  static async getCriteriaForForm(intakeFormId: string): Promise<{ data?: EvaluationCriterion[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('evaluation_criteria')
        .select('*')
        .eq('intake_form_id', intakeFormId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching criteria:', error);
        return { error: error.message };
      }

      return { data: data.map(this.transformDbCriterion) };
    } catch (error) {
      console.error('Error in getCriteriaForForm:', error);
      return { error: 'Failed to fetch criteria' };
    }
  }

  private static transformDbSuggestion(dbData: any): AISuggestion {
    return {
      id: dbData.id,
      intakeFormId: dbData.intake_form_id,
      userId: dbData.user_id,
      sectionType: dbData.section_type,
      suggestionContent: dbData.suggestion_content,
      confidenceScore: dbData.confidence_score,
      sourceMessageId: dbData.source_message_id,
      status: dbData.status,
      createdAt: new Date(dbData.created_at),
      acceptedAt: dbData.accepted_at ? new Date(dbData.accepted_at) : undefined,
      modifiedContent: dbData.modified_content,
      updatedAt: new Date(dbData.updated_at)
    };
  }

  private static transformDbCriterion(dbData: any): EvaluationCriterion {
    return {
      id: dbData.id,
      intakeFormId: dbData.intake_form_id,
      userId: dbData.user_id,
      type: dbData.type,
      name: dbData.name,
      description: dbData.description,
      weight: dbData.weight,
      source: dbData.source,
      aiSuggestionId: dbData.ai_suggestion_id,
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at)
    };
  }
}