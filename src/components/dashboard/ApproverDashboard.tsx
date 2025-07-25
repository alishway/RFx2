import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Shield, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { ProcurementReviewService } from "@/services/procurementReviewService";
import UserMenu from "@/components/UserMenu";
import type { Database } from "@/integrations/supabase/types";

type IntakeForm = Database["public"]["Tables"]["intake_forms"]["Row"];

const statusColors = {
  in_review: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500"
};

const statusLabels = {
  in_review: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected"
};

export const ApproverDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("in_review");

  useEffect(() => {
    loadFormsForApproval();
  }, []);

  const loadFormsForApproval = async () => {
    try {
      const allForms = await ProcurementReviewService.getAllFormsForReview();
      // Filter to show only forms that need final approval
      const formsForApproval = allForms.filter(form => 
        form.status === "in_review" || form.status === "approved" || form.status === "rejected"
      );
      setForms(formsForApproval);
    } catch (error) {
      console.error("Error loading forms for approval:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveForm = (formId: string) => {
    navigate(`/procurement-review/${formId}`);
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.commodity_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || form.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusCount = (status: string) => {
    return forms.filter(form => form.status === status).length;
  };

  const getRiskLevel = (form: IntakeForm) => {
    // Simple risk assessment based on budget tolerance and complexity
    if (form.budget_tolerance === "sensitive") return "high";
    if (form.budget_tolerance === "moderate") return "medium";
    return "low";
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUrgencyDays = (form: IntakeForm) => {
    const reviewDate = new Date(form.updated_at);
    const daysSinceReview = Math.floor((Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceReview;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Executive Approval Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Final review and approval of procurement submissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {getStatusCount("in_review")} Awaiting Approval
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Compliance Review
            </Badge>
            <UserMenu />
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{forms.length}</div>
              <div className="text-sm text-muted-foreground">Total For Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{getStatusCount("in_review")}</div>
              <div className="text-sm text-muted-foreground">Pending Approval</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{getStatusCount("approved")}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{getStatusCount("rejected")}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions by title or commodity type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in_review">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Forms Approval Queue */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading approval queue...</div>
          ) : filteredForms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {forms.length === 0 
                    ? "No submissions require executive approval at this time." 
                    : "No submissions match your current filters."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredForms.map((form) => {
              const riskLevel = getRiskLevel(form);
              const urgencyDays = getUrgencyDays(form);
              
              return (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{form.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[form.status as keyof typeof statusColors]}>
                            {statusLabels[form.status as keyof typeof statusLabels]}
                          </Badge>
                          <Badge className={getRiskColor(riskLevel)}>
                            {riskLevel.toUpperCase()} RISK
                          </Badge>
                          {form.commodity_type && (
                            <Badge variant="outline">{form.commodity_type}</Badge>
                          )}
                          {urgencyDays > 5 && (
                            <Badge className="bg-orange-500">
                              URGENT
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Last Updated: {new Date(form.updated_at).toLocaleDateString()}</div>
                        <div className={urgencyDays > 5 ? "text-orange-600 font-medium" : ""}>
                          {urgencyDays === 0 ? "Today" : `${urgencyDays} days in review`}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {form.background && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {form.background}
                        </p>
                      )}
                      
                      {/* Executive Summary Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/50 p-3 rounded">
                        <div>
                          <span className="font-medium">Budget Sensitivity:</span>
                          <div className="text-muted-foreground capitalize">
                            {form.budget_tolerance || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Project Start:</span>
                          <div className="text-muted-foreground">
                            {form.start_date ? new Date(form.start_date).toLocaleDateString() : "TBD"}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Scope Items:</span>
                          <div className="text-muted-foreground">
                            {Array.isArray(form.deliverables) ? form.deliverables.length : 0} deliverables
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Risk Assessment:</span>
                          <div className={`font-medium ${riskLevel === 'high' ? 'text-red-600' : riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                            {riskLevel.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Compliance Indicators */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-muted-foreground">Policy Compliant</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-muted-foreground">Legal Review</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-blue-500" />
                            <span className="text-muted-foreground">Strategic Alignment</span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleApproveForm(form.id)}
                          variant={form.status === "in_review" ? "default" : "outline"}
                          size="sm"
                        >
                          {form.status === "in_review" ? "Review & Approve" : "View Details"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};