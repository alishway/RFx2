import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface ProcurementReviewData {
  intakeForm: Database["public"]["Tables"]["intake_forms"]["Row"];
  // Removed references to non-existent tables
  // TODO: Re-implement these features when needed
  // aiOutputs: AIGeneratedOutput[];
  // complianceReport?: ComplianceReport;
  // approvalWorkflow?: ApprovalWorkflow;
  // generatedDocuments: GeneratedDocument[];
}

export class ProcurementReviewService {
  static async getReviewData(intakeFormId: string): Promise<ProcurementReviewData | null> {
    try {
      // Get intake form
      const { data: intakeForm, error: formError } = await supabase
        .from("intake_forms")
        .select("*")
        .eq("id", intakeFormId)
        .single();

      if (formError) throw formError;

      return {
        intakeForm,
        // TODO: Add back when tables are recreated
        // aiOutputs: [],
        // complianceReport: undefined,
        // approvalWorkflow: undefined,
        // generatedDocuments: []
      };
    } catch (error) {
      console.error("Error fetching review data:", error);
      return null;
    }
  }

  static async updateIntakeFormStatus(
    intakeFormId: string,
    status: Database["public"]["Enums"]["intake_status"]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("intake_forms")
        .update({ status })
        .eq("id", intakeFormId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating intake form status:", error);
      return false;
    }
  }

  static async getAllFormsForReview(): Promise<Database["public"]["Tables"]["intake_forms"]["Row"][]> {
    try {
      const { data: forms, error } = await supabase
        .from("intake_forms")
        .select("*")
        .in("status", ["submitted", "in_review"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return forms || [];
    } catch (error) {
      console.error("Error fetching forms for review:", error);
      return [];
    }
  }
}