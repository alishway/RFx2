-- Add DELETE policy for intake_forms table
-- Users should be able to delete their own draft forms
CREATE POLICY "Users can delete their own draft intake forms" 
ON public.intake_forms 
FOR DELETE 
USING (
  auth.uid() = user_id 
  AND status = 'draft'::intake_status
);