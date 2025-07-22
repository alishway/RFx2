import { supabase } from "@/integrations/supabase/client";
import { IntakeFormData } from "@/types/intake";

export interface SavedIntakeForm {
  id: string;
  user_id: string;
  title: string;
  background?: string;
  commodity_type?: string;
  start_date?: string;
  end_date?: string;
  budget_tolerance?: 'sensitive' | 'moderate' | 'flexible';
  estimated_value?: number;
  status: 'draft' | 'in_progress' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  deliverables: any;
  tasks: any;
  requirements: any;
  compliance_flags: any;
  created_at: string;
  updated_at: string;
}

export class IntakeFormService {
  private static autosaveTimer: NodeJS.Timeout | null = null;

  static async saveForm(formData: IntakeFormData, formId?: string): Promise<{ data?: SavedIntakeForm; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: "User not authenticated" };
      }

      const formPayload = {
        title: formData.background ? 
          formData.background.substring(0, 100) + (formData.background.length > 100 ? '...' : '') : 
          'New RFx Intake Form',
        background: formData.background,
        commodity_type: formData.commodityType,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        budget_tolerance: formData.budgetTolerance,
        deliverables: JSON.parse(JSON.stringify(formData.deliverables)),
        tasks: JSON.parse(JSON.stringify(formData.tasks)),
        requirements: JSON.parse(JSON.stringify(formData.requirements)),
        user_id: user.id,
        status: 'draft' as const
      };

      if (formId) {
        // Update existing form
        const { data, error } = await supabase
          .from('intake_forms')
          .update(formPayload)
          .eq('id', formId)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return { data };
      } else {
        // Create new form
        const { data, error } = await supabase
          .from('intake_forms')
          .insert(formPayload)
          .select()
          .single();
        
        if (error) throw error;
        return { data };
      }
    } catch (error: any) {
      console.error('Error saving form:', error);
      return { error: error.message || 'Failed to save form' };
    }
  }

  static async loadForm(formId: string): Promise<{ data?: SavedIntakeForm; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: "User not authenticated" };
      }

      const { data, error } = await supabase
        .from('intake_forms')
        .select('*')
        .eq('id', formId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      console.error('Error loading form:', error);
      return { error: error.message || 'Failed to load form' };
    }
  }

  static async getUserForms(): Promise<{ data?: SavedIntakeForm[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: "User not authenticated" };
      }

      const { data, error } = await supabase
        .from('intake_forms')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { data: data || [] };
    } catch (error: any) {
      console.error('Error loading user forms:', error);
      return { error: error.message || 'Failed to load forms' };
    }
  }

  static scheduleAutosave(formData: IntakeFormData, formId?: string, onSave?: (savedForm: SavedIntakeForm) => void) {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }

    this.autosaveTimer = setTimeout(async () => {
      const result = await this.saveForm(formData, formId);
      if (result.data && onSave) {
        onSave(result.data);
      }
    }, 30000); // 30 seconds
  }

  static clearAutosave() {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  static validateForm(formData: IntakeFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validations
    if (!formData.background?.trim()) {
      errors.push("Project background is required");
    }

    if (!formData.commodityType?.trim()) {
      errors.push("Commodity type is required");
    }

    // Date validations
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate >= endDate) {
        errors.push("End date must be after start date");
      }

      if (startDate < new Date()) {
        errors.push("Start date cannot be in the past");
      }
    }

    // Requirements validation
    if (formData.requirements.priceWeight < 0 || formData.requirements.priceWeight > 100) {
      errors.push("Price weight must be between 0 and 100");
    }

    // Deliverables validation - only required for final submission, not initial saves
    // if (formData.deliverables.length === 0) {
    //   errors.push("At least one deliverable must be specified");
    // }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}