// Test component to verify AI suggestions functionality
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AISuggestionsService } from "@/services/aiSuggestionsService";
import { AISuggestionCard } from "./AISuggestionCard";
import { AISuggestion } from "@/types/aiSuggestions";

export const AISuggestionTestDemo: React.FC = () => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createTestSuggestion = async () => {
    setIsLoading(true);
    try {
      const testDeliverable = {
        id: 'test-1',
        name: 'Monthly Progress Reports',
        description: 'Detailed reports documenting progress, insights gathered, and any challenges faced during the analysis process.',
        selected: false
      };

      const { data, error } = await AISuggestionsService.createSuggestion(
        'test-form-id',
        'deliverables',
        testDeliverable,
        undefined,
        0.85
      );

      if (data && !error) {
        setSuggestions(prev => [...prev, data]);
      } else {
        console.error('Error creating suggestion:', error);
      }
    } catch (error) {
      console.error('Test suggestion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = (suggestionId: string, content: any) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    console.log('Accepted suggestion:', suggestionId, content);
  };

  const handleReject = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    console.log('Rejected suggestion:', suggestionId);
  };

  const handleUpdate = () => {
    console.log('Suggestion updated');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>AI Suggestions Test Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={createTestSuggestion} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Test Suggestion'}
        </Button>
        
        {suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map(suggestion => (
              <AISuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={handleAccept}
                onReject={handleReject}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
        
        {suggestions.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-8">
            No suggestions yet. Click the button above to create a test suggestion.
          </div>
        )}
      </CardContent>
    </Card>
  );
};