import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Edit, Sparkles } from "lucide-react";
import { AISuggestion } from "@/types/aiSuggestions";
import { AISuggestionsService } from "@/services/aiSuggestionsService";
import { useToast } from "@/hooks/use-toast";

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  onAccept: (suggestionId: string, modifiedContent?: any) => void;
  onReject: (suggestionId: string) => void;
  onUpdate: () => void;
}

export const AISuggestionCard: React.FC<AISuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(suggestion.suggestionContent);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const getSectionLabel = (sectionType: string) => {
    const labels = {
      'deliverables': 'Deliverable',
      'mandatory_criteria': 'Mandatory Criterion',
      'rated_criteria': 'Rated Criterion',
      'timeline': 'Timeline',
      'budget': 'Budget'
    };
    return labels[sectionType as keyof typeof labels] || sectionType;
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    
    const level = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
    const variant = level === 'high' ? 'default' : level === 'medium' ? 'secondary' : 'outline';
    
    return (
      <Badge variant={variant} className="text-xs">
        {Math.round(confidence * 100)}% confidence
      </Badge>
    );
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const content = isEditing ? editedContent : suggestion.suggestionContent;
      const { error } = await AISuggestionsService.updateSuggestionStatus(
        suggestion.id, 
        'accepted',
        isEditing ? content : undefined
      );

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      onAccept(suggestion.id, content);
      toast({
        title: "Suggestion Accepted",
        description: `${getSectionLabel(suggestion.sectionType)} has been added to your form.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept suggestion",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const { error } = await AISuggestionsService.updateSuggestionStatus(
        suggestion.id, 
        'rejected'
      );

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      onReject(suggestion.id);
      toast({
        title: "Suggestion Rejected",
        description: `${getSectionLabel(suggestion.sectionType)} suggestion has been dismissed.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject suggestion",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContentEditor = () => {
    const content = isEditing ? editedContent : suggestion.suggestionContent;
    
    if (suggestion.sectionType === 'deliverables') {
      return (
        <div className="space-y-2">
          <Label>Deliverable Name</Label>
          {isEditing ? (
            <Input
              value={content.name || ''}
              onChange={(e) => setEditedContent({ ...content, name: e.target.value })}
              placeholder="Enter deliverable name"
            />
          ) : (
            <p className="font-medium">{content.name}</p>
          )}
          
          <Label>Description</Label>
          {isEditing ? (
            <Textarea
              value={content.description || ''}
              onChange={(e) => setEditedContent({ ...content, description: e.target.value })}
              placeholder="Enter deliverable description"
              rows={3}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{content.description}</p>
          )}
        </div>
      );
    }

    if (suggestion.sectionType === 'mandatory_criteria' || suggestion.sectionType === 'rated_criteria') {
      return (
        <div className="space-y-2">
          <Label>Criterion Name</Label>
          {isEditing ? (
            <Input
              value={content.name || ''}
              onChange={(e) => setEditedContent({ ...content, name: e.target.value })}
              placeholder="Enter criterion name"
            />
          ) : (
            <p className="font-medium">{content.name}</p>
          )}
          
          <Label>Description</Label>
          {isEditing ? (
            <Textarea
              value={content.description || ''}
              onChange={(e) => setEditedContent({ ...content, description: e.target.value })}
              placeholder="Enter criterion description"
              rows={3}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{content.description}</p>
          )}

          {suggestion.sectionType === 'rated_criteria' && (
            <>
              <Label>Weight (%)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={content.weight || ''}
                  onChange={(e) => setEditedContent({ ...content, weight: parseFloat(e.target.value) })}
                  placeholder="Enter weight percentage"
                />
              ) : (
                <p className="text-sm">{content.weight}%</p>
              )}
            </>
          )}
        </div>
      );
    }

    if (suggestion.sectionType === 'timeline') {
      return (
        <div className="space-y-2">
          <Label>Timeline Description</Label>
          {isEditing ? (
            <Textarea
              value={content.description || ''}
              onChange={(e) => setEditedContent({ ...content, description: e.target.value })}
              placeholder="Enter timeline description"
              rows={2}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{content.description}</p>
          )}
          
          {content.suggestedDuration && (
            <>
              <Label>Suggested Duration</Label>
              {isEditing ? (
                <Input
                  value={content.suggestedDuration || ''}
                  onChange={(e) => setEditedContent({ ...content, suggestedDuration: e.target.value })}
                  placeholder="e.g., 3 months, 12 weeks"
                />
              ) : (
                <p className="text-sm font-medium">{content.suggestedDuration}</p>
              )}
            </>
          )}
        </div>
      );
    }

    if (suggestion.sectionType === 'budget') {
      return (
        <div className="space-y-2">
          <Label>Budget Description</Label>
          {isEditing ? (
            <Textarea
              value={content.description || ''}
              onChange={(e) => setEditedContent({ ...content, description: e.target.value })}
              placeholder="Enter budget description"
              rows={2}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{content.description}</p>
          )}
          
          {content.suggestedRange && (
            <>
              <Label>Suggested Range</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={content.suggestedRange.min || ''}
                    onChange={(e) => setEditedContent({ 
                      ...content, 
                      suggestedRange: { ...content.suggestedRange, min: parseFloat(e.target.value) }
                    })}
                    placeholder="Min amount"
                  />
                  <Input
                    type="number"
                    value={content.suggestedRange.max || ''}
                    onChange={(e) => setEditedContent({ 
                      ...content, 
                      suggestedRange: { ...content.suggestedRange, max: parseFloat(e.target.value) }
                    })}
                    placeholder="Max amount"
                  />
                </div>
              ) : (
                <p className="text-sm font-medium">
                  {content.suggestedRange.min && `$${content.suggestedRange.min.toLocaleString()}`}
                  {content.suggestedRange.min && content.suggestedRange.max && ' - '}
                  {content.suggestedRange.max && `$${content.suggestedRange.max.toLocaleString()}`}
                </p>
              )}
            </>
          )}
        </div>
      );
    }

    // Fallback for other content types
    return (
      <div className="space-y-2">
        {isEditing ? (
          <Textarea
            value={typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={4}
          />
        ) : (
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
            {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  if (suggestion.status !== 'pending') {
    return null; // Don't show non-pending suggestions in this card
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Suggested {getSectionLabel(suggestion.sectionType)}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getConfidenceBadge(suggestion.confidenceScore)}
            <Badge variant="outline" className="text-xs">
              Pending
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {renderContentEditor()}
        
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isProcessing}
          >
            <Edit className="h-3 w-3 mr-1" />
            {isEditing ? 'Preview' : 'Edit'}
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleAccept}
            disabled={isProcessing}
          >
            <Check className="h-3 w-3 mr-1" />
            {isEditing ? 'Accept Changes' : 'Accept'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            disabled={isProcessing}
          >
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};