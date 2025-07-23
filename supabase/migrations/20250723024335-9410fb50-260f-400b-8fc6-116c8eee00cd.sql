-- Clean up database to match reverted code

-- Drop unused tables
DROP TABLE IF EXISTS public.ai_suggestions CASCADE;
DROP TABLE IF EXISTS public.evaluation_criteria CASCADE;
DROP TABLE IF EXISTS public.ai_generated_outputs CASCADE;
DROP TABLE IF EXISTS public.compliance_reports CASCADE;
DROP TABLE IF EXISTS public.approval_workflows CASCADE;
DROP TABLE IF EXISTS public.generated_documents CASCADE;

-- Remove unused columns from intake_forms
ALTER TABLE public.intake_forms 
DROP COLUMN IF EXISTS estimated_value,
DROP COLUMN IF EXISTS compliance_flags,
DROP COLUMN IF EXISTS ai_metadata;