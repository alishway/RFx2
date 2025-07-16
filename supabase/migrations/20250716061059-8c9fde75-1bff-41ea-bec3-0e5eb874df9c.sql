-- Sprint 4: Procurement Review and Document Generation Schema

-- Table for AI-generated content outputs
CREATE TABLE public.ai_generated_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_form_id UUID NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'scope_of_work', 'evaluation_criteria', 'compliance_analysis'
  generated_content JSONB NOT NULL DEFAULT '{}',
  ai_model TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'revised', 'rejected'
  revision_notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Table for generated documents
CREATE TABLE public.generated_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_form_id UUID NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'rfp', 'rfq', 'rfi'
  template_used TEXT NOT NULL,
  file_path TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  generated_by UUID NOT NULL REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published'
  approval_notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Table for compliance checklist results
CREATE TABLE public.compliance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_form_id UUID NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
  checklist_results JSONB NOT NULL DEFAULT '{}',
  overall_score DECIMAL(5,2),
  critical_flags INTEGER DEFAULT 0,
  warning_flags INTEGER DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Table for approval workflow tracking
CREATE TABLE public.approval_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_form_id UUID NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
  current_stage TEXT NOT NULL DEFAULT 'submission', -- 'submission', 'procurement_review', 'compliance_review', 'approved'
  assigned_to_role TEXT NOT NULL, -- 'procurement_lead', 'approver', 'admin'
  assigned_to_user UUID REFERENCES auth.users(id),
  stage_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stage_completed_at TIMESTAMP WITH TIME ZONE,
  stage_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on new tables
ALTER TABLE public.ai_generated_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_generated_outputs
CREATE POLICY "Users can view AI outputs for their forms" ON public.ai_generated_outputs
  FOR SELECT USING (
    user_id = auth.uid() OR 
    get_user_role(auth.uid()) = ANY(ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role])
  );

CREATE POLICY "Users can create AI outputs for their forms" ON public.ai_generated_outputs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Procurement leads can update AI outputs" ON public.ai_generated_outputs
  FOR UPDATE USING (
    get_user_role(auth.uid()) = ANY(ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role])
  );

-- RLS Policies for generated_documents
CREATE POLICY "Users can view documents for their forms" ON public.generated_documents
  FOR SELECT USING (
    user_id = auth.uid() OR 
    get_user_role(auth.uid()) = ANY(ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role])
  );

CREATE POLICY "Procurement leads can create documents" ON public.generated_documents
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) = ANY(ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role])
  );

CREATE POLICY "Procurement leads can update documents" ON public.generated_documents
  FOR UPDATE USING (
    get_user_role(auth.uid()) = ANY(ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role])
  );

-- RLS Policies for compliance_reports
CREATE POLICY "Users can view compliance reports for their forms" ON public.compliance_reports
  FOR SELECT USING (
    user_id = auth.uid() OR 
    get_user_role(auth.uid()) = ANY(ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role])
  );

CREATE POLICY "Procurement leads can create compliance reports" ON public.compliance_reports
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) = ANY(ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role])
  );

CREATE POLICY "Procurement leads can update compliance reports" ON public.compliance_reports
  FOR UPDATE USING (
    get_user_role(auth.uid()) = ANY(ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role])
  );

-- RLS Policies for approval_workflows
CREATE POLICY "Users can view approval workflows for their forms" ON public.approval_workflows
  FOR SELECT USING (
    user_id = auth.uid() OR 
    assigned_to_user = auth.uid() OR
    get_user_role(auth.uid()) = ANY(ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role])
  );

CREATE POLICY "Procurement leads can manage approval workflows" ON public.approval_workflows
  FOR ALL USING (
    get_user_role(auth.uid()) = ANY(ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role])
  );

-- Triggers for updated_at timestamps
CREATE TRIGGER update_ai_generated_outputs_updated_at
  BEFORE UPDATE ON public.ai_generated_outputs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_documents_updated_at
  BEFORE UPDATE ON public.generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_reports_updated_at
  BEFORE UPDATE ON public.compliance_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_ai_generated_outputs_intake_form_id ON public.ai_generated_outputs(intake_form_id);
CREATE INDEX idx_ai_generated_outputs_content_type ON public.ai_generated_outputs(content_type);
CREATE INDEX idx_generated_documents_intake_form_id ON public.generated_documents(intake_form_id);
CREATE INDEX idx_compliance_reports_intake_form_id ON public.compliance_reports(intake_form_id);
CREATE INDEX idx_approval_workflows_intake_form_id ON public.approval_workflows(intake_form_id);
CREATE INDEX idx_approval_workflows_assigned_to ON public.approval_workflows(assigned_to_user);
CREATE INDEX idx_approval_workflows_active ON public.approval_workflows(is_active);