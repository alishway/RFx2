import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ProcurementReviewService, type ProcurementReviewData } from "@/services/procurementReviewService";
import { ComplianceService, type ComplianceResult } from "@/services/complianceService";
import { ArrowLeft, AlertTriangle, CheckCircle, FileText, MessageSquare, Download, Home } from "lucide-react";
import { Link } from "react-router-dom";
import AIResultsViewer from "./AIResultsViewer";
import ComplianceChecker from "./ComplianceChecker";

interface FormReviewDetailProps {
  formId: string;
  onBack: () => void;
}

const FormReviewDetail: React.FC<FormReviewDetailProps> = ({ formId, onBack }) => {
  const { toast } = useToast();
  const [reviewData, setReviewData] = useState<ProcurementReviewData | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");

  useEffect(() => {
    loadReviewData();
  }, [formId]);

  const loadReviewData = async () => {
    setLoading(true);
    try {
      const data = await ProcurementReviewService.getReviewData(formId);
      if (data) {
        setReviewData(data);
        setNewStatus(data.intakeForm.status);
        
        // Run compliance analysis
        const compliance = await ComplianceService.analyzeCompliance(data.intakeForm);
        setComplianceResult(compliance);
        
        // Create compliance report if it doesn't exist
        if (!data.complianceReport && compliance) {
          await ProcurementReviewService.createComplianceReport(
            formId,
            { checks: compliance.checks },
            compliance.overallScore,
            compliance.criticalFlags,
            compliance.warningFlags
          );
        }
      }
    } catch (error) {
      console.error("Error loading review data:", error);
      toast({
        title: "Error",
        description: "Failed to load review data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === reviewData?.intakeForm.status) return;

    try {
      await ProcurementReviewService.updateIntakeFormStatus(
        formId,
        newStatus as any
      );
      
      toast({
        title: "Success",
        description: "Form status updated successfully",
      });
      
      loadReviewData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update form status",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "Not specified";
    return `$${Number(value).toLocaleString()} CAD`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading review data...</p>
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Review data not found</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const { intakeForm } = reviewData;
  const complianceStatus = complianceResult ? ComplianceService.getComplianceStatus(complianceResult) : null;

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Review Dashboard
          </Button>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Home className="w-4 h-4" />
            <span>/</span>
            <span>Procurement Review</span>
            <span>/</span>
            <span className="font-medium text-foreground">Form Details</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{intakeForm.title}</h2>
          <p className="text-muted-foreground">
            Form Review • Submitted {formatDate(intakeForm.created_at)}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {complianceStatus && (
            <Badge variant={complianceStatus.color as any} className="flex items-center space-x-1">
              {complianceStatus.status === "critical" ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <CheckCircle className="w-3 h-3" />
              )}
              <span>{complianceStatus.message}</span>
            </Badge>
          )}
          
          <div className="flex items-center space-x-2">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleStatusUpdate}
              disabled={newStatus === intakeForm.status}
            >
              Update Status
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="ai-results">AI Analysis</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Background</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {intakeForm.background || "No background provided"}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Estimated Value</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(intakeForm.estimated_value)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Budget Tolerance</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {intakeForm.budget_tolerance || "Not specified"}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(intakeForm.start_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(intakeForm.end_date)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Commodity Type</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {intakeForm.commodity_type || "Not specified"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements & Deliverables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Deliverables</label>
                  {Array.isArray(intakeForm.deliverables) && intakeForm.deliverables.length > 0 ? (
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {intakeForm.deliverables.map((deliverable: any, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {typeof deliverable === "string" ? deliverable : deliverable.name || deliverable.description}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No deliverables specified</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Requirements</label>
                  {intakeForm.requirements && typeof intakeForm.requirements === "object" ? (
                    <div className="space-y-2 mt-2">
                      {(intakeForm.requirements as any).mandatory?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Mandatory ({(intakeForm.requirements as any).mandatory.length})</p>
                          <ul className="list-disc list-inside ml-2">
                            {(intakeForm.requirements as any).mandatory.map((req: any, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                {typeof req === "string" ? req : req.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(intakeForm.requirements as any).rated?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Rated ({(intakeForm.requirements as any).rated.length})</p>
                          <ul className="list-disc list-inside ml-2">
                            {(intakeForm.requirements as any).rated.map((req: any, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                {typeof req === "string" ? req : req.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No requirements specified</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Review Notes</CardTitle>
              <CardDescription>Add your review comments and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your review notes here..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="min-h-[100px]"
              />
              <Button className="mt-4">Save Notes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          {complianceResult && (
            <ComplianceChecker 
              complianceResult={complianceResult}
              onRefresh={() => loadReviewData()}
            />
          )}
        </TabsContent>

        <TabsContent value="ai-results">
          <AIResultsViewer 
            intakeFormId={formId}
            aiOutputs={reviewData.aiOutputs}
            onRefresh={() => loadReviewData()}
          />
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Generated Documents</CardTitle>
              <CardDescription>
                Documents generated for this procurement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewData.generatedDocuments.length > 0 ? (
                <div className="space-y-4">
                  {reviewData.generatedDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.document_type.toUpperCase()} Document</p>
                          <p className="text-sm text-muted-foreground">
                            Generated {formatDate(doc.generated_at)} • Version {doc.version}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{doc.status}</Badge>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents generated yet</p>
                  <Button className="mt-4">Generate Document</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormReviewDetail;