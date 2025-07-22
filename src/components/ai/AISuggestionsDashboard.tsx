import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, CheckCircle, XCircle, Clock, Edit } from "lucide-react";
import { AISuggestion } from "@/types/aiSuggestions";
import { AISuggestionsService } from "@/services/aiSuggestionsService";
import { AISuggestionCard } from "./AISuggestionCard";
import { useToast } from "@/hooks/use-toast";

interface AISuggestionsDashboardProps {
  intakeFormId: string;
  onSuggestionUpdate?: () => void;
}

export const AISuggestionsDashboard: React.FC<AISuggestionsDashboardProps> = ({
  intakeFormId,
  onSuggestionUpdate
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [sectionFilter, setSectionFilter] = useState<'all' | string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadSuggestions();
  }, [intakeFormId]);

  const loadSuggestions = async () => {
    setLoading(true);
    const { data, error } = await AISuggestionsService.getSuggestionsForForm(intakeFormId);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      setSuggestions(data || []);
    }
    setLoading(false);
  };

  const handleSuggestionAccept = async (suggestionId: string, modifiedContent?: any) => {
    await loadSuggestions();
    onSuggestionUpdate?.();
  };

  const handleSuggestionReject = async (suggestionId: string) => {
    await loadSuggestions();
    onSuggestionUpdate?.();
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    const statusMatch = statusFilter === 'all' || suggestion.status === statusFilter;
    const sectionMatch = sectionFilter === 'all' || suggestion.sectionType === sectionFilter;
    return statusMatch && sectionMatch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'modified': return <Edit className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusCounts = () => {
    return {
      total: suggestions.length,
      pending: suggestions.filter(s => s.status === 'pending').length,
      accepted: suggestions.filter(s => s.status === 'accepted').length,
      rejected: suggestions.filter(s => s.status === 'rejected').length,
      modified: suggestions.filter(s => s.status === 'modified').length
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading suggestions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            AI Suggestions Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{statusCounts.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statusCounts.accepted}</div>
              <div className="text-sm text-muted-foreground">Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{statusCounts.modified}</div>
              <div className="text-sm text-muted-foreground">Modified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="modified">Modified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                <SelectItem value="deliverables">Deliverables</SelectItem>
                <SelectItem value="mandatory_criteria">Mandatory Criteria</SelectItem>
                <SelectItem value="rated_criteria">Rated Criteria</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="grid" className="space-y-4">
            <TabsList>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {filteredSuggestions.map(suggestion => (
                  <AISuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAccept={handleSuggestionAccept}
                    onReject={handleSuggestionReject}
                    onUpdate={loadSuggestions}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <div className="space-y-2">
                {filteredSuggestions.map(suggestion => (
                  <Card key={suggestion.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(suggestion.status)}
                        <div>
                          <div className="font-medium">
                            {suggestion.suggestionContent.name || 'AI Suggestion'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {suggestion.sectionType.replace('_', ' ')} • {suggestion.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={suggestion.status === 'pending' ? 'default' : 'outline'}>
                          {suggestion.status}
                        </Badge>
                        {suggestion.confidenceScore && (
                          <Badge variant="secondary">
                            {Math.round(suggestion.confidenceScore * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {filteredSuggestions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No suggestions found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};