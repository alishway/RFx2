import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, AlertTriangle } from "lucide-react";
import { ChatMessage, IntakeFormData } from "@/types/intake";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useScopeChat } from "@/contexts/ScopeChatContext";

interface ScopeChatProps {
  formData: IntakeFormData;
  onUpdate: (updates: Partial<IntakeFormData>) => void;
}

export const ScopeChat = ({ formData, onUpdate }: ScopeChatProps) => {
  const { messages, setMessages } = useScopeChat();
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message?: string) => {
    const messageText = message || input.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call AI edge function
      const aiResponse = await generateAIResponse(messageText, formData, messages);
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Update form data based on AI extraction
      updateFormDataFromMessage(messageText, onUpdate);
      
    } catch (error) {
      console.error('AI response error:', error);
      // Fallback to local response
      const fallbackResponse = generateFallbackResponse(messageText, formData);
      setMessages(prev => [...prev, fallbackResponse]);
      
      toast({
        title: "AI Temporarily Unavailable",
        description: "Using fallback response. AI features will return shortly.",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSingleDeliverable = (deliverable: any) => {
    const currentDeliverables = formData.deliverables || [];
    if (!currentDeliverables.some(existing => existing.name.toLowerCase() === deliverable.name.toLowerCase())) {
      const newDeliverables = [...currentDeliverables, deliverable];
      onUpdate({ deliverables: newDeliverables });
      
      toast({
        title: "Deliverable Added",
        description: `"${deliverable.name}" added to your form`,
      });
    }
  };

  const handleConfirmDeliverables = (deliverables: any[]) => {
    const currentDeliverables = formData.deliverables || [];
    const newDeliverables = [...currentDeliverables];
    
    deliverables.forEach(newDel => {
      if (!newDeliverables.some(existing => existing.name.toLowerCase() === newDel.name.toLowerCase())) {
        newDeliverables.push(newDel);
      }
    });
    
    onUpdate({ deliverables: newDeliverables });
    
    toast({
      title: "Deliverables Added",
      description: `${deliverables.length} deliverable${deliverables.length > 1 ? 's' : ''} added to your form`,
    });
  };

  const generateAIResponse = async (userMessage: string, formData: IntakeFormData, conversationHistory: ChatMessage[]): Promise<ChatMessage> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-scope-chat', {
        body: {
          message: userMessage,
          formData,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (error) throw error;

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions || [],
        extractedDeliverables: data.extractedDeliverables || []
      };
    } catch (error) {
      console.error('AI response error:', error);
      throw error;
    }
  };

  const generateFallbackResponse = (userMessage: string, formData: IntakeFormData): ChatMessage => {
    let response = "";
    let suggestions: string[] = [];
    let extractedDeliverables: any[] = [];
    
    // Handle deliverable suggestions specifically
    if (userMessage.toLowerCase().includes('deliverable') || 
        userMessage.toLowerCase().includes('suggest') || 
        userMessage.toLowerCase().includes('need')) {
      
      // Generate relevant deliverables based on context
      if (userMessage.toLowerCase().includes('data') || userMessage.toLowerCase().includes('analysis')) {
        extractedDeliverables = [
          {
            id: Math.random().toString(36).substr(2, 9),
            name: "Comprehensive Data Analysis Report",
            description: "A detailed report summarizing findings from the data analysis, including trends, patterns, and anomalies in patient outcomes.",
            selected: true
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            name: "Dashboards and Visualizations",
            description: "Interactive dashboards that present key metrics and trends, allowing stakeholders to visualize data in real-time. This could include graphs, charts, and maps illustrating outcomes across different hospitals.",
            selected: true
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            name: "Data Quality Assessment Report",
            description: "An assessment of data quality, completeness, and reliability across all data sources used in the analysis.",
            selected: true
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            name: "Methodology Documentation",
            description: "Detailed documentation of analytical methods, algorithms, and statistical techniques used in the analysis.",
            selected: true
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            name: "Executive Summary Presentation",
            description: "A high-level presentation suitable for executive stakeholders, highlighting key findings and recommendations.",
            selected: true
          }
        ];
        
        response = "Based on your data analysis project, here are some key deliverables I recommend for your procurement:";
        suggestions = ['Add more deliverables', 'Refine descriptions', 'Set timelines'];
        
      } else {
        // Generic deliverables for other services
        extractedDeliverables = [
          {
            id: Math.random().toString(36).substr(2, 9),
            name: "Project Plan and Timeline",
            description: "Comprehensive project plan with milestones, deliverables timeline, and resource allocation.",
            selected: true
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            name: "Final Report",
            description: "Detailed final report documenting all work completed, findings, and recommendations.",
            selected: true
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            name: "Training Materials",
            description: "Training documentation and materials for knowledge transfer to client staff.",
            selected: true
          }
        ];
        
        response = "Here are some standard deliverables for your project:";
        suggestions = ['Add more deliverables', 'Customize descriptions', 'Review scope'];
      }
    } else if (userMessage.toLowerCase().includes('data') || userMessage.toLowerCase().includes('analysis')) {
      response = "I see you're looking for data analysis services. Let me help you define the specific deliverables. Are you looking for:\n\n• Data collection and cleansing\n• Statistical analysis and modeling\n• Data visualization and reporting\n• Business intelligence solutions";
      suggestions = ['Data collection', 'Statistical modeling', 'Data visualization', 'All of the above'];
    } else if (userMessage.toLowerCase().includes('it') || userMessage.toLowerCase().includes('technology')) {
      response = "Great! For IT services, let's identify the key areas. Common deliverables include:\n\n• System design and architecture\n• Software development\n• Infrastructure management\n• Security assessment";
      suggestions = ['System design', 'Software development', 'Infrastructure', 'Security'];
    } else {
      response = "Thank you for that information. To ensure we capture all requirements, could you help me understand:\n\n1. What specific deliverables do you expect?\n2. What's your target timeline?\n3. Are there any special requirements or constraints?";
      suggestions = ['Define deliverables', 'Set timeline', 'Add constraints'];
    }

    // Check for restrictive language
    const restrictiveFlags = checkRestrictiveLanguage(userMessage);
    if (restrictiveFlags.length > 0) {
      response += `\n\n⚠️ **Compliance Alert**: I noticed some potentially restrictive requirements: ${restrictiveFlags.join(', ')}. Let's ensure these meet fairness and openness requirements.`;
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      suggestions,
      extractedDeliverables: extractedDeliverables.length > 0 ? extractedDeliverables : undefined
    };
  };

  const checkRestrictiveLanguage = (text: string): string[] => {
    const flags: string[] = [];
    const restrictivePatterns = [
      { pattern: /\d{2,}\s*years?\s*(of\s*)?experience/i, flag: "High experience requirement" },
      { pattern: /must\s+be\s+certified\s+by/i, flag: "Specific certification requirement" },
      { pattern: /only.*brand|brand.*only/i, flag: "Brand restriction" },
      { pattern: /minimum.*40.*years/i, flag: "Excessive experience requirement" }
    ];

    restrictivePatterns.forEach(({ pattern, flag }) => {
      if (pattern.test(text)) {
        flags.push(flag);
      }
    });

    return flags;
  };

  const updateFormDataFromMessage = (message: string, onUpdate: (updates: Partial<IntakeFormData>) => void) => {
    // Extract commodity type
    if (message.toLowerCase().includes('data analysis') && !formData.commodityType) {
      onUpdate({ commodityType: 'Data Analysis Services' });
    }
    
    // Update background if empty
    if (!formData.background) {
      onUpdate({ background: message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0">
                {message.role === 'user' ? (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
                <Card className={message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}>
                <CardContent className="p-3">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Show extracted deliverables for confirmation */}
                  {(message as any).extractedDeliverables && (message as any).extractedDeliverables.length > 0 && (
                    <div className="mt-4 p-3 bg-secondary/20 rounded-lg border">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        AI Suggested Deliverables:
                        <Badge variant="secondary" className="text-xs">
                          {(message as any).extractedDeliverables.length} found
                        </Badge>
                      </h4>
                      <div className="space-y-2 mb-3">
                        {(message as any).extractedDeliverables.map((del: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-background/50 rounded border">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{del.name}</div>
                              <div className="text-xs text-muted-foreground">{del.description}</div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAddSingleDeliverable(del)}
                              className="ml-2"
                            >
                              Add to Form
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleConfirmDeliverables((message as any).extractedDeliverables)}
                        >
                          Add All
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSend("Let me refine these deliverables")}
                        >
                          Refine
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.suggestions.map((suggestion, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                          onClick={() => handleSend(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-secondary-foreground animate-pulse" />
            </div>
            <Card>
              <CardContent className="p-3">
                <p className="text-muted-foreground">AI is thinking...</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your procurement needs..."
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={isLoading}
        />
        <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};