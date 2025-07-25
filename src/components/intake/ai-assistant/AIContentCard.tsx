import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle } from "lucide-react";

interface AIContentItem {
  id: string;
  name: string;
  description?: string;
  type?: 'mandatory' | 'rated';
  weight?: number;
  scale?: string;
}

interface AIContentCardProps {
  title: string;
  items: AIContentItem[];
  onAddItem: (item: AIContentItem) => void;
  onAddAll: (items: AIContentItem[]) => void;
  onRefine: () => void;
  contentType: 'deliverables' | 'mandatory' | 'rated' | 'general';
}

export const AIContentCard = ({ 
  title, 
  items, 
  onAddItem, 
  onAddAll, 
  onRefine,
  contentType 
}: AIContentCardProps) => {
  if (!items || items.length === 0) return null;

  const getContentTypeColor = () => {
    switch (contentType) {
      case 'deliverables': return 'bg-blue-50 border-blue-200';
      case 'mandatory': return 'bg-red-50 border-red-200';
      case 'rated': return 'bg-green-50 border-green-200';
      case 'general': return 'bg-gray-50 border-gray-200';
      default: return 'bg-secondary/20 border-secondary';
    }
  };

  const getContentTypeIcon = () => {
    switch (contentType) {
      case 'mandatory': return '⚠️';
      case 'rated': return '⭐';
      case 'general': return '💡';
      default: return '📋';
    }
  };

  return (
    <Card className={`mt-4 ${getContentTypeColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold flex items-center gap-2">
            <span>{getContentTypeIcon()}</span>
            {title}
            <Badge variant="secondary" className="text-xs">
              {items.length} suggested
            </Badge>
          </h4>
        </div>

        <div className="space-y-3 mb-4">
          {items.map((item, idx) => (
            <div key={idx} className="bg-background rounded-lg border p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description || (
                      contentType === 'deliverables' ? 'No description provided' :
                      contentType === 'mandatory' ? 'No requirement details provided' :
                      contentType === 'rated' ? 'No evaluation criteria provided' :
                      'No details provided'
                    )}
                  </div>
                  {item.type && (
                    <div className="flex gap-2">
                      <Badge variant={item.type === 'mandatory' ? 'destructive' : 'default'} className="text-xs">
                        {item.type}
                      </Badge>
                      {item.weight && (
                        <Badge variant="outline" className="text-xs">
                          Weight: {item.weight}%
                        </Badge>
                      )}
                      {item.scale && (
                        <Badge variant="outline" className="text-xs">
                          {item.scale}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onAddItem(item)}
                  className="shrink-0 hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button 
            size="sm" 
            onClick={() => onAddAll(items)}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Add All {items.length} Items
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={onRefine}
            className="flex-1"
          >
            Refine Suggestions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};