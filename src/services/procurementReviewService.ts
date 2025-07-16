import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AIGeneratedOutput = Database["public"]["Tables"]["ai_generated_outputs"]["Row"];
type AIGeneratedOutputInsert = Database["public"]["Tables"]["ai_generated_outputs"]["Insert"];
type ComplianceReport = Database["public"]["Tables"]["compliance_reports"]["Row"];
type ApprovalWorkflow = Database["public"]["Tables"]["approval_workflows"]["Row"];
type GeneratedDocument = Database["public"]["Tables"]["generated_documents"]["Row"];

export interface ProcurementReviewData {
  intakeForm: Database["public"]["Tables"]["intake_forms"]["Row"];
  aiOutputs: AIGeneratedOutput[];
  complianceReport?: ComplianceReport;
  approvalWorkflow?: ApprovalWorkflow;
  generatedDocuments: GeneratedDocument[];
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

      // Get AI outputs
      const { data: aiOutputs, error: aiError } = await supabase
        .from("ai_generated_outputs")
        .select("*")
        .eq("intake_form_id", intakeFormId)
        .order("generated_at", { ascending: false });

      if (aiError) throw aiError;

      // Get compliance report
      const { data: complianceReport, error: complianceError } = await supabase
        .from("compliance_reports")
        .select("*")
        .eq("intake_form_id", intakeFormId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (complianceError) throw complianceError;

      // Get approval workflow
      const { data: approvalWorkflow, error: workflowError } = await supabase
        .from("approval_workflows")
        .select("*")
        .eq("intake_form_id", intakeFormId)
        .eq("is_active", true)
        .maybeSingle();

      if (workflowError) throw workflowError;

      // Get generated documents
      const { data: generatedDocuments, error: docsError } = await supabase
        .from("generated_documents")
        .select("*")
        .eq("intake_form_id", intakeFormId)
        .order("generated_at", { ascending: false });

      if (docsError) throw docsError;

      return {
        intakeForm,
        aiOutputs: aiOutputs || [],
        complianceReport: complianceReport || undefined,
        approvalWorkflow: approvalWorkflow || undefined,
        generatedDocuments: generatedDocuments || []
      };
    } catch (error) {
      console.error("Error fetching review data:", error);
      return null;
    }
  }

  static async createAIOutput(data: AIGeneratedOutputInsert): Promise<AIGeneratedOutput | null> {
    try {
      const { data: aiOutput, error } = await supabase
        .from("ai_generated_outputs")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return aiOutput;
    } catch (error) {
      console.error("Error creating AI output:", error);
      return null;
    }
  }

  static async updateAIOutputStatus(
    id: string, 
    status: string, 
    revisionNotes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("ai_generated_outputs")
        .update({
          status,
          revision_notes: revisionNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating AI output status:", error);
      return false;
    }
  }

  static async createComplianceReport(
    intakeFormId: string,
    checklistResults: Record<string, any>,
    overallScore: number,
    criticalFlags: number,
    warningFlags: number
  ): Promise<ComplianceReport | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User not authenticated");

      const { data: report, error } = await supabase
        .from("compliance_reports")
        .insert({
          intake_form_id: intakeFormId,
          checklist_results: checklistResults,
          overall_score: overallScore,
          critical_flags: criticalFlags,
          warning_flags: warningFlags,
          user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return report;
    } catch (error) {
      console.error("Error creating compliance report:", error);
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

  static async createApprovalWorkflow(
    intakeFormId: string,
    stage: string,
    assignedToRole: string,
    assignedToUser?: string
  ): Promise<ApprovalWorkflow | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User not authenticated");

      const { data: workflow, error } = await supabase
        .from("approval_workflows")
        .insert({
          intake_form_id: intakeFormId,
          current_stage: stage,
          assigned_to_role: assignedToRole,
          assigned_to_user: assignedToUser,
          user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return workflow;
    } catch (error) {
      console.error("Error creating approval workflow:", error);
      return null;
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