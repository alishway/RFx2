-- Create storage bucket for intake form attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rfx-intake-attachments', 'rfx-intake-attachments', false);

-- Create storage policies for intake form attachments
CREATE POLICY "Users can upload their own attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'rfx-intake-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'rfx-intake-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'rfx-intake-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'rfx-intake-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add estimated_value column for budget calculations
ALTER TABLE public.intake_forms 
ADD COLUMN estimated_value DECIMAL(15,2);

-- Add compliance_flags for AI-generated warnings
ALTER TABLE public.intake_forms 
ADD COLUMN compliance_flags JSONB DEFAULT '[]'::jsonb;