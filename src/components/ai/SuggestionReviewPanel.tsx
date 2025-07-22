import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Sparkles, Clock, CheckCircle, XCircle } from "lucide-react";
import { AISuggestion } from "@/types/aiSuggestions";
import { AISuggestionsService } from "@/services/aiSuggestionsService";
import { AISuggestionCard } from "./AISuggestionCard";
import { useToast } from "@/hooks/use-toast";

interface SuggestionReviewPanelProps {
  intakeFormId: string;
  sectionType: AISuggestion['sectionType'];
  title: string;
  onSuggestionAccepted?: (suggestion: AISuggestion, content: any) => void;
  className?: string;
}

export const SuggestionReviewPanel: React.FC<SuggestionReviewPanelProps> = ({
  intakeFormId,
  sectionType,
  title,
  onSuggestionAccepted,
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (intakeFormId) {
      loadSuggestions();
    }
  }, [intakeFormId, sectionType]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await AISuggestionsService.getSuggestionsForForm(intakeFormId);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
      } else {
        // Filter suggestions for this section type
        const sectionSuggestions = (data || []).filter(s => s.sectionType === sectionType);
        setSuggestions(sectionSuggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionAccept = async (suggestionId: string, modifiedContent?: any) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion && onSuggestionAccepted) {
      onSuggestionAccepted(suggestion, modifiedContent || suggestion.suggestionContent);
    }
    await loadSuggestions();
  };

  const handleSuggestionReject = async (suggestionId: string) => {
    await loadSuggestions();
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');
  const rejectedSuggestions = suggestions.filter(s => s.status === 'rejected');

  const getSectionIcon = () => {
    switch (sectionType) {
      case 'deliverables': return '📦';
      case 'mandatory_criteria': return '✅';
      case 'rated_criteria': return '⭐';
      case 'timeline': return '📅';
      case 'budget': return '💰';
      default: return '🤖';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'accepted': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (suggestions.length === 0 && !loading) {
    return null; // Don't render if no suggestions
  }

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{getSectionIcon()}</span>
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Suggestions for {title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {pendingSuggestions.length > 0 && (
                    <Badge variant="default" className="text-xs">
                      {pendingSuggestions.length} pending
                    </Badge>
                  )}
                  {acceptedSuggestions.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {acceptedSuggestions.length} accepted
                    </Badge>
                  )}
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-3 mt-3">
          {loading && (
            <Alert>
              <AlertDescription>Loading suggestions...</AlertDescription>
            </Alert>
          )}

          {/* Pending Suggestions */}
          {pendingSuggestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending Review ({pendingSuggestions.length})
              </h4>
              {pendingSuggestions.map(suggestion => (
                <AISuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={handleSuggestionAccept}
                  onReject={handleSuggestionReject}
                  onUpdate={loadSuggestions}
                />
              ))}
            </div>
          )}

          {/* Accepted Suggestions */}
          {acceptedSuggestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Accepted ({acceptedSuggestions.length})
              </h4>
              {acceptedSuggestions.map(suggestion => (
                <Card key={suggestion.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {suggestion.suggestionContent.name || 'AI Suggestion'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Accepted on {suggestion.acceptedAt?.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Accepted
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Rejected Suggestions */}
          {rejectedSuggestions.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  <XCircle className="h-3 w-3 mr-1 text-red-500" />
                  Show Rejected ({rejectedSuggestions.length})
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {rejectedSuggestions.map(suggestion => (
                  <Card key={suggestion.id} className="border-l-4 border-l-red-500 opacity-60">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium line-through">
                            {suggestion.suggestionContent.name || 'AI Suggestion'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Rejected on {suggestion.updatedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Rejected
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {suggestions.length === 0 && !loading && (
            <Alert>
              <AlertDescription>
                No AI suggestions available for this section yet. Use the chat to describe your needs and AI will generate relevant suggestions.
              </AlertDescription>
            </Alert>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};