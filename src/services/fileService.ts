import { supabase } from "@/integrations/supabase/client";

export interface FileUploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
  metadata?: {
    name: string;
    size: number;
    type: string;
  };
}

export class FileService {
  static async uploadFile(file: File, formId: string): Promise<FileUploadResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      const filePath = `${user.id}/${formId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('rfx-intake-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Save file reference to database
      const { error: dbError } = await supabase
        .from('file_attachments')
        .insert({
          intake_form_id: formId,
          user_id: user.id,
          file_name: file.name,
          file_path: data.path,
          file_size: file.size,
          mime_type: file.type
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('rfx-intake-attachments')
          .remove([data.path]);
        return { success: false, error: dbError.message };
      }

      return {
        success: true,
        filePath: data.path,
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      };
    } catch (error: any) {
      console.error('File upload error:', error);
      return { success: false, error: error.message || 'Failed to upload file' };
    }
  }

  static async getFileUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = await supabase.storage
        .from('rfx-intake-attachments')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }

  static async deleteFile(filePath: string, formId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('rfx-intake-attachments')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        return false;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_attachments')
        .delete()
        .eq('file_path', filePath)
        .eq('user_id', user.id)
        .eq('intake_form_id', formId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  static async getFormAttachments(formId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: [], error: "User not authenticated" };

      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('intake_form_id', formId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
      return { data: [], error: error.message };
    }
  }
}