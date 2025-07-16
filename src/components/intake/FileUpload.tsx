import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, File, Download, Loader2 } from "lucide-react";
import { FileService } from "@/services/fileService";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  formId?: string;
  attachments: File[];
  onAttachmentsChange: (files: File[]) => void;
}

export const FileUpload = ({ formId, attachments, onAttachmentsChange }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (formId) {
      // Upload to storage immediately if we have a form ID
      setUploading(true);
      for (const file of files) {
        const result = await FileService.uploadFile(file, formId);
        if (result.success) {
          toast({
            title: "File uploaded",
            description: `${file.name} uploaded successfully`,
          });
        } else {
          toast({
            title: "Upload failed",
            description: result.error,
            variant: "destructive",
          });
        }
      }
      // Refresh uploaded files list
      const { data } = await FileService.getFormAttachments(formId);
      setUploadedFiles(data);
      setUploading(false);
    } else {
      // Store locally until form is saved
      onAttachmentsChange([...attachments, ...files]);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeLocalFile = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(newAttachments);
  };

  const removeUploadedFile = async (filePath: string) => {
    if (!formId) return;
    
    const success = await FileService.deleteFile(filePath, formId);
    if (success) {
      toast({
        title: "File deleted",
        description: "File removed successfully",
      });
      const { data } = await FileService.getFormAttachments(formId);
      setUploadedFiles(data);
    } else {
      toast({
        title: "Delete failed",
        description: "Failed to remove file",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    const url = await FileService.getFileUrl(filePath);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({
        title: "Download failed",
        description: "Could not generate download link",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Attachments</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload Files
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
          />

          {/* Local attachments (not yet uploaded) */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Pending Upload</h4>
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLocalFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Uploaded Files</h4>
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="default">Uploaded</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file.file_path, file.file_name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadedFile(file.file_path)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {attachments.length === 0 && uploadedFiles.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No files attached</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: PDF, DOC, XLS, TXT, JPG, PNG
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};