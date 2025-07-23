import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";

interface AIResultsViewerProps {
  intakeFormId: string;
  onRefresh: () => void;
}

const AIResultsViewer: React.FC<AIResultsViewerProps> = ({ intakeFormId, onRefresh }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis Results</CardTitle>
        <CardDescription>
          AI-generated content analysis and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Analysis Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            This feature will provide AI-powered analysis of procurement documents, including:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Compliance checking</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Content recommendations</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Risk assessment</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Quality scoring</span>
            </div>
          </div>
          <Button onClick={onRefresh} variant="outline" className="mt-6">
            Refresh Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIResultsViewer;