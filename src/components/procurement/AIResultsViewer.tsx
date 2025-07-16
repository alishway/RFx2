import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ProcurementReviewService } from "@/services/procurementReviewService";
import { Brain, Edit, Check, X, MessageSquare } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AIGeneratedOutput = Database["public"]["Tables"]["ai_generated_outputs"]["Row"];

interface AIResultsViewerProps {
  intakeFormId: string;
  aiOutputs: AIGeneratedOutput[];
  onRefresh: () => void;
}

const AIResultsViewer: React.FC<AIResultsViewerProps> = ({
  intakeFormId,
  aiOutputs,
  onRefresh
}) => {
  const { toast } = useToast();
  const [editingOutput, setEditingOutput] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("pending");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "revised":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getContentTypeLabel = (contentType: string) => {
    switch (contentType) {
      case "scope_of_work":
        return "Scope of Work";
      case "evaluation_criteria":
        return "Evaluation Criteria";
      case "compliance_analysis":
        return "Compliance Analysis";
      default:
        return contentType.replace("_", " ");
    }
  };

  const handleStatusUpdate = async (outputId: string, status: string) => {
    try {
      const success = await ProcurementReviewService.updateAIOutputStatus(
        outputId,
        status,
        revisionNotes || undefined
      );

      if (success) {
        toast({
          title: "Success",
          description: "AI output status updated successfully",
        });
        setEditingOutput(null);
        setRevisionNotes("");
        onRefresh();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating AI output status:", error);
      toast({
        title: "Error",
        description: "Failed to update AI output status",
        variant: "destructive",
      });
    }
  };

  const renderContent = (content: any) => {
    if (typeof content === "string") {
      return content;
    }
    
    if (typeof content === "object") {
      return JSON.stringify(content, null, 2);
    }
    
    return "No content available";
  };

  const groupedOutputs = aiOutputs.reduce((acc, output) => {
    const type = output.content_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(output);
    return acc;
  }, {} as Record<string, AIGeneratedOutput[]>);

  if (aiOutputs.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No AI analysis results available</p>
            <Button className="mt-4">Generate AI Analysis</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">AI Analysis Results</h3>
          <p className="text-muted-foreground">
            Review and approve AI-generated content
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline">
          Refresh Results
        </Button>
      </div>

      {Object.entries(groupedOutputs).map(([contentType, outputs]) => (
        <Card key={contentType}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>{getContentTypeLabel(contentType)}</span>
                </CardTitle>
                <CardDescription>
                  AI-generated {getContentTypeLabel(contentType).toLowerCase()}
                </CardDescription>
              </div>
              <Badge variant="outline">
                {outputs.length} version{outputs.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {outputs.map((output, index) => (
                <div key={output.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(output.status)}>
                        {output.status}
                      </Badge>
                      {output.ai_model && (
                        <Badge variant="outline">{output.ai_model}</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        Generated {new Date(output.generated_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {editingOutput === output.id ? (
                      <div className="flex items-center space-x-2">
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accepted">Accept</SelectItem>
                            <SelectItem value="revised">Revise</SelectItem>
                            <SelectItem value="rejected">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => handleStatusUpdate(output.id, selectedStatus)}
                          size="sm"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setEditingOutput(null)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          setEditingOutput(output.id);
                          setSelectedStatus(output.status);
                          setRevisionNotes(output.revision_notes || "");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Generated Content</h4>
                    <div className="bg-muted rounded p-3 max-h-64 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap">
                        {renderContent(output.generated_content)}
                      </pre>
                    </div>
                  </div>

                  {editingOutput === output.id && (
                    <div>
                      <label className="text-sm font-medium">Revision Notes</label>
                      <Textarea
                        placeholder="Add notes about required changes or approval reasons..."
                        value={revisionNotes}
                        onChange={(e) => setRevisionNotes(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {output.revision_notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Review Notes</span>
                      </div>
                      <p className="text-sm text-blue-800">{output.revision_notes}</p>
                      {output.reviewed_at && (
                        <p className="text-xs text-blue-600 mt-1">
                          Reviewed {new Date(output.reviewed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AIResultsViewer;