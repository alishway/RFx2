-- Phase 1: AI Suggestions and Evaluation Criteria Tables
-- Migration: Enhanced AI-Form Integration

-- Create ai_suggestions table for staging AI-generated content
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_form_id UUID NOT NULL,
  user_id UUID NOT NULL,
  section_type TEXT NOT NULL CHECK (section_type IN ('deliverables', 'mandatory_criteria', 'rated_criteria', 'timeline', 'budget')),
  suggestion_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source_message_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'modified')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  modified_content JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evaluation_criteria table for structured criteria management
CREATE TABLE IF NOT EXISTS public.evaluation_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_form_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mandatory', 'rated')),
  name TEXT NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) CHECK (weight >= 0 AND weight <= 100),
  source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'ai_suggested', 'ai_accepted')),
  ai_suggestion_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add AI metadata to intake_forms
ALTER TABLE public.intake_forms 
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb;

-- Add extracted suggestions tracking to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS extracted_suggestions JSONB DEFAULT '[]'::jsonb;

-- Enable Row Level Security
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_suggestions
CREATE POLICY "Users can view their own AI suggestions" 
ON public.ai_suggestions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI suggestions for their forms" 
ON public.ai_suggestions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI suggestions" 
ON public.ai_suggestions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Procurement leads can view all AI suggestions" 
ON public.ai_suggestions 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role]));

-- RLS Policies for evaluation_criteria
CREATE POLICY "Users can view criteria for their forms" 
ON public.evaluation_criteria 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create criteria for their forms" 
ON public.evaluation_criteria 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update criteria for their forms" 
ON public.evaluation_criteria 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete criteria for their forms" 
ON public.evaluation_criteria 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Procurement leads can manage all criteria" 
ON public.evaluation_criteria 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['procurement_lead'::user_role, 'approver'::user_role, 'admin'::user_role]));

-- Add foreign key relationships (non-enforced for flexibility)
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_intake_form ON public.ai_suggestions(intake_form_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user ON public.ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON public.ai_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_intake_form ON public.evaluation_criteria(intake_form_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_type ON public.evaluation_criteria(type);

-- Add triggers for updated_at
CREATE TRIGGER update_ai_suggestions_updated_at
  BEFORE UPDATE ON public.ai_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluation_criteria_updated_at
  BEFORE UPDATE ON public.evaluation_criteria
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();