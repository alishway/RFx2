import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { ProcurementReviewService } from "@/services/procurementReviewService";
import type { Database } from "@/integrations/supabase/types";

type IntakeForm = Database["public"]["Tables"]["intake_forms"]["Row"];

const statusColors = {
  submitted: "bg-blue-500",
  in_review: "bg-yellow-500", 
  approved: "bg-green-500",
  rejected: "bg-red-500"
};

const statusLabels = {
  submitted: "Awaiting Review",
  in_review: "Under Review",
  approved: "Approved", 
  rejected: "Rejected"
};

const priorityColors = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200"
};

export const ProcurementDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadFormsForReview();
  }, []);

  const loadFormsForReview = async () => {
    try {
      const forms = await ProcurementReviewService.getAllFormsForReview();
      setForms(forms);
    } catch (error) {
      console.error("Error loading forms for review:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewForm = (formId: string) => {
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

  const getPriority = (form: IntakeForm) => {
    // Simple priority logic - could be enhanced
    const daysOld = Math.floor((Date.now() - new Date(form.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysOld > 7) return "high";
    if (daysOld > 3) return "medium";
    return "low";
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "Urgent";
      case "medium": return "Medium";
      case "low": return "Normal";
      default: return "Normal";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Procurement Review Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Review and approve RFx submissions from end users
            </p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {getStatusCount("submitted")} Pending Review
            </Badge>
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {getStatusCount("in_review")} In Progress
            </Badge>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{forms.length}</div>
              <div className="text-sm text-muted-foreground">Total Submissions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{getStatusCount("submitted")}</div>
              <div className="text-sm text-muted-foreground">Awaiting Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{getStatusCount("in_review")}</div>
              <div className="text-sm text-muted-foreground">In Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{getStatusCount("approved")}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
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
              <SelectItem value="submitted">Awaiting Review</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Forms Review Queue */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading review queue...</div>
          ) : filteredForms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {forms.length === 0 
                    ? "No submissions to review at this time." 
                    : "No submissions match your current filters."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredForms.map((form) => {
              const priority = getPriority(form);
              const daysOld = Math.floor((Date.now() - new Date(form.created_at).getTime()) / (1000 * 60 * 60 * 24));
              
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
                          <Badge className={priorityColors[priority as keyof typeof priorityColors]}>
                            {getPriorityLabel(priority)}
                          </Badge>
                          {form.commodity_type && (
                            <Badge variant="outline">{form.commodity_type}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Submitted: {new Date(form.created_at).toLocaleDateString()}</div>
                        <div className={daysOld > 7 ? "text-red-600 font-medium" : ""}>
                          {daysOld === 0 ? "Today" : `${daysOld} days ago`}
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Budget:</span>
                          <div className="text-muted-foreground capitalize">
                            {form.budget_tolerance || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Timeline:</span>
                          <div className="text-muted-foreground">
                            {form.start_date ? new Date(form.start_date).toLocaleDateString() : "TBD"}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Deliverables:</span>
                          <div className="text-muted-foreground">
                            {Array.isArray(form.deliverables) ? form.deliverables.length : 0} items
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Requirements:</span>
                          <div className="text-muted-foreground">
                            {form.requirements && typeof form.requirements === 'object' 
                              ? Object.keys(form.requirements).length 
                              : 0} criteria
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-sm text-muted-foreground">
                          Priority: <span className="capitalize font-medium">{priority}</span>
                        </div>
                        <Button 
                          onClick={() => handleReviewForm(form.id)}
                          variant={form.status === "submitted" ? "default" : "outline"}
                          size="sm"
                        >
                          {form.status === "submitted" ? "Start Review" : "Continue Review"}
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