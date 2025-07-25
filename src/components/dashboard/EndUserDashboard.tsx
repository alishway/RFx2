import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { IntakeFormService, SavedIntakeForm } from "@/services/intakeFormService";
import type { Database } from "@/integrations/supabase/types";

const statusColors = {
  draft: "bg-gray-500",
  submitted: "bg-blue-500", 
  in_review: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500"
};

const statusLabels = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "Under Review", 
  approved: "Approved",
  rejected: "Rejected"
};

export const EndUserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forms, setForms] = useState<SavedIntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const { data, error } = await IntakeFormService.getUserForms();
      if (data) {
        setForms(data);
      }
    } catch (error) {
      console.error("Error loading forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    // Navigate to a clean intake form
    navigate("/intake-form/new");
  };

  const handleEditForm = (formId: string) => {
    navigate(`/intake-form/${formId}`);
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">RFx Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your procurement requests and track their progress
            </p>
          </div>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New RFx Form
          </Button>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{forms.length}</div>
              <div className="text-sm text-muted-foreground">Total Forms</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{getStatusCount("draft")}</div>
              <div className="text-sm text-muted-foreground">Drafts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{getStatusCount("submitted")}</div>
              <div className="text-sm text-muted-foreground">Submitted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{getStatusCount("in_review")}</div>
              <div className="text-sm text-muted-foreground">Under Review</div>
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
              placeholder="Search forms by title or commodity type..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Forms List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading your forms...</div>
          ) : filteredForms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {forms.length === 0 
                    ? "You haven't created any RFx forms yet." 
                    : "No forms match your current filters."
                  }
                </p>
                {forms.length === 0 && (
                  <Button onClick={handleCreateNew} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First RFx Form
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredForms.map((form) => (
              <Card key={form.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{form.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[form.status as keyof typeof statusColors]}>
                          {statusLabels[form.status as keyof typeof statusLabels]}
                        </Badge>
                        {form.commodity_type && (
                          <Badge variant="outline">{form.commodity_type}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Created: {new Date(form.created_at).toLocaleDateString()}</div>
                      <div>Updated: {new Date(form.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {form.background && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {form.background}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {form.start_date && (
                        <span>Start: {new Date(form.start_date).toLocaleDateString()}</span>
                      )}
                      {form.end_date && (
                        <span>End: {new Date(form.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="text-sm text-muted-foreground">
                        {Array.isArray(form.deliverables) ? form.deliverables.length : 0} deliverables
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditForm(form.id)}
                        disabled={form.status === "submitted" || form.status === "in_review"}
                      >
                        {form.status === "draft" ? "Continue Editing" : "View Details"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};