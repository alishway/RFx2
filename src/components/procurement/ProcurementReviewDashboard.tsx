import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ProcurementReviewService } from "@/services/procurementReviewService";
import { Clock, FileText, AlertTriangle, CheckCircle, Eye, ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type IntakeForm = Database["public"]["Tables"]["intake_forms"]["Row"];

interface ProcurementReviewDashboardProps {
  onSelectForm: (formId: string) => void;
}

const ProcurementReviewDashboard: React.FC<ProcurementReviewDashboardProps> = ({
  onSelectForm
}) => {
  const { toast } = useToast();
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("submitted");

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    try {
      const formsData = await ProcurementReviewService.getAllFormsForReview();
      setForms(formsData);
    } catch (error) {
      console.error("Error loading forms:", error);
      toast({
        title: "Error",
        description: "Failed to load forms for review",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "in_review":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (estimatedValue?: number) => {
    if (!estimatedValue) return <Clock className="h-4 w-4" />;
    if (estimatedValue > 100000) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (estimatedValue > 25000) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const filteredForms = forms.filter(form => {
    if (selectedTab === "submitted") return form.status === "submitted";
    if (selectedTab === "in_review") return form.status === "in_review";
    return form.status === selectedTab;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Home className="w-4 h-4" />
            <span>/</span>
            <span className="font-medium text-foreground">Procurement Review</span>
          </div>
        </div>
        <Button onClick={loadForms} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Procurement Review Dashboard</h2>
          <p className="text-muted-foreground">
            Review and process intake forms from end users
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forms.filter(f => f.status === "submitted").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Forms awaiting initial review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forms.filter(f => f.status === "in_review").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Forms currently being reviewed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forms.filter(f => (f.estimated_value || 0) > 100000).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Forms over $100k CAD
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="in_review">In Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredForms.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">
                  No forms found in this category
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredForms.map((form) => (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{form.title}</CardTitle>
                      <CardDescription>
                        Submitted {new Date(form.created_at).toLocaleDateString()}
                        {form.commodity_type && ` • ${form.commodity_type}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(form.estimated_value || undefined)}
                      <Badge className={getStatusColor(form.status)}>
                        {form.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {form.background || "No background provided"}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Estimated Value:</span>
                        <p className="text-muted-foreground">
                          {form.estimated_value 
                            ? `$${Number(form.estimated_value).toLocaleString()} CAD`
                            : "Not specified"
                          }
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Timeline:</span>
                        <p className="text-muted-foreground">
                          {form.start_date && form.end_date
                            ? `${new Date(form.start_date).toLocaleDateString()} - ${new Date(form.end_date).toLocaleDateString()}`
                            : "Not specified"
                          }
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Budget Tolerance:</span>
                        <p className="text-muted-foreground">
                          {form.budget_tolerance || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Deliverables:</span>
                        <p className="text-muted-foreground">
                          {Array.isArray(form.deliverables) 
                            ? `${form.deliverables.length} items`
                            : "Not specified"
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => onSelectForm(form.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProcurementReviewDashboard;