-- Fix function search path security issues

-- Update get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT role FROM public.profiles WHERE user_id = user_uuid LIMIT 1;
$function$;

-- Update update_updated_at_column function  
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update audit_trigger_function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;