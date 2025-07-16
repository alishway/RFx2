-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('end_user', 'procurement_lead', 'approver', 'admin');

-- Create intake form status enum
CREATE TYPE public.intake_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected');

-- Create budget tolerance enum
CREATE TYPE public.budget_tolerance AS ENUM ('sensitive', 'moderate', 'flexible');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  organization TEXT,
  department TEXT,
  role user_role NOT NULL DEFAULT 'end_user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create intake forms table
CREATE TABLE public.intake_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  background TEXT,
  commodity_type TEXT,
  start_date DATE,
  end_date DATE,
  budget_tolerance budget_tolerance,
  status intake_status NOT NULL DEFAULT 'draft',
  deliverables JSONB DEFAULT '[]'::jsonb,
  tasks JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_form_id UUID NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file attachments table
CREATE TABLE public.file_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_form_id UUID NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit trails table
CREATE TABLE public.audit_trails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trails ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for intake forms
CREATE POLICY "Users can view their own intake forms"
  ON public.intake_forms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Procurement leads can view all intake forms"
  ON public.intake_forms FOR SELECT
  USING (public.get_user_role(auth.uid()) IN ('procurement_lead', 'approver', 'admin'));

CREATE POLICY "Users can create their own intake forms"
  ON public.intake_forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intake forms"
  ON public.intake_forms FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Procurement leads can update intake forms"
  ON public.intake_forms FOR UPDATE
  USING (public.get_user_role(auth.uid()) IN ('procurement_lead', 'approver', 'admin'));

-- RLS Policies for chat sessions
CREATE POLICY "Users can view their own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chat messages
CREATE POLICY "Users can view messages in their sessions"
  ON public.chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE id = session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create messages in their sessions"
  ON public.chat_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE id = session_id AND user_id = auth.uid()
  ));

-- RLS Policies for file attachments
CREATE POLICY "Users can view their own file attachments"
  ON public.file_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own file attachments"
  ON public.file_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for audit trails
CREATE POLICY "Admins can view all audit trails"
  ON public.audit_trails FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view audit trails for their own records"
  ON public.audit_trails FOR SELECT
  USING (user_id = auth.uid());

-- Create trigger function for automatic timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intake_forms_updated_at
  BEFORE UPDATE ON public.intake_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  changed_fields TEXT[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_data = to_jsonb(OLD);
    INSERT INTO public.audit_trails (table_name, record_id, user_id, action, old_values)
    VALUES (TG_TABLE_NAME, OLD.id, auth.uid(), TG_OP, old_data);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data = to_jsonb(OLD);
    new_data = to_jsonb(NEW);
    SELECT array_agg(key) INTO changed_fields
    FROM jsonb_each(old_data) 
    WHERE value != (new_data -> key);
    
    INSERT INTO public.audit_trails (table_name, record_id, user_id, action, old_values, new_values, changed_fields)
    VALUES (TG_TABLE_NAME, NEW.id, auth.uid(), TG_OP, old_data, new_data, changed_fields);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    new_data = to_jsonb(NEW);
    INSERT INTO public.audit_trails (table_name, record_id, user_id, action, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, auth.uid(), TG_OP, new_data);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
CREATE TRIGGER audit_intake_forms
  AFTER INSERT OR UPDATE OR DELETE ON public.intake_forms
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_intake_forms_user_id ON public.intake_forms(user_id);
CREATE INDEX idx_intake_forms_status ON public.intake_forms(status);
CREATE INDEX idx_chat_sessions_intake_form_id ON public.chat_sessions(intake_form_id);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_file_attachments_intake_form_id ON public.file_attachments(intake_form_id);
CREATE INDEX idx_audit_trails_table_record ON public.audit_trails(table_name, record_id);
CREATE INDEX idx_audit_trails_user_id ON public.audit_trails(user_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);