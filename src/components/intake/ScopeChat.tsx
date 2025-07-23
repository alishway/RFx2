import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, AlertTriangle } from "lucide-react";
import { ChatMessage, IntakeFormData, Deliverable, Requirement } from "@/types/intake";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useScopeChat } from "@/contexts/ScopeChatContext";
import { AIContentCard } from "./ai-assistant/AIContentCard";
import { detectContentType, generateContentSuggestions, ContentType } from "./ai-assistant/AIPromptHandler";

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
      // Temporarily force fallback to test the cards
      throw new Error("Testing fallback response");
      
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

  const handleAddSingleItem = (item: any, contentType: ContentType) => {
    switch (contentType) {
      case 'deliverables':
        const currentDeliverables = formData.deliverables || [];
        if (!currentDeliverables.some(existing => existing.name.toLowerCase() === item.name.toLowerCase())) {
          const newDeliverable: Deliverable = {
            id: item.id,
            name: item.name,
            description: item.description,
            selected: true
          };
          onUpdate({ deliverables: [...currentDeliverables, newDeliverable] });
          toast({
            title: "Deliverable Added",
            description: `"${item.name}" added to your form`,
          });
        }
        break;
        
      case 'mandatory':
        const currentMandatory = formData.requirements?.mandatory || [];
        if (!currentMandatory.some(existing => existing.name.toLowerCase() === item.name.toLowerCase())) {
          const newRequirement: Requirement = {
            id: item.id,
            name: item.name,
            description: item.description,
            type: 'mandatory'
          };
          onUpdate({ 
            requirements: {
              mandatory: [...currentMandatory, newRequirement],
              rated: formData.requirements?.rated || [],
              priceWeight: formData.requirements?.priceWeight || 30
            }
          });
          toast({
            title: "Mandatory Criterion Added",
            description: `"${item.name}" added to your form`,
          });
        }
        break;
        
      case 'rated':
        const currentRated = formData.requirements?.rated || [];
        if (!currentRated.some(existing => existing.name.toLowerCase() === item.name.toLowerCase())) {
          const newRequirement: Requirement = {
            id: item.id,
            name: item.name,
            description: item.description,
            type: 'rated',
            weight: item.weight || 10,
            scale: item.scale || '0-100 points'
          };
          onUpdate({ 
            requirements: {
              mandatory: formData.requirements?.mandatory || [],
              rated: [...currentRated, newRequirement],
              priceWeight: formData.requirements?.priceWeight || 30
            }
          });
          toast({
            title: "Rated Criterion Added",
            description: `"${item.name}" added to your form`,
          });
        }
        break;
    }
  };

  const handleAddAllItems = (items: any[], contentType: ContentType) => {
    items.forEach(item => handleAddSingleItem(item, contentType));
    
    toast({
      title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Added`,
      description: `${items.length} ${contentType} item${items.length > 1 ? 's' : ''} added to your form`,
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

      // Detect content type for AI responses too
      const contentType = detectContentType(userMessage);

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions || [],
        extractedDeliverables: data.extractedDeliverables || [],
        contentType
      };
    } catch (error) {
      console.error('AI response error:', error);
      throw error;
    }
  };

  const generateFallbackResponse = (userMessage: string, formData: IntakeFormData): ChatMessage => {
    const contentType = detectContentType(userMessage);
    const { items, response } = generateContentSuggestions(contentType, userMessage, formData);
    
    let suggestions: string[] = [];
    
    // Generate contextual suggestions
    switch (contentType) {
      case 'deliverables':
        suggestions = ['Add more deliverables', 'Refine descriptions', 'Set timelines'];
        break;
      case 'mandatory':
        suggestions = ['Add more criteria', 'Review compliance', 'Set thresholds'];
        break;
      case 'rated':
        suggestions = ['Adjust weights', 'Add more criteria', 'Review scoring'];
        break;
      default:
        suggestions = ['Suggest deliverables', 'Create mandatory criteria', 'Generate rated criteria'];
        break;
    }

    // Check for restrictive language
    const restrictiveFlags = checkRestrictiveLanguage(userMessage);
    let finalResponse = response;
    if (restrictiveFlags.length > 0) {
      finalResponse += `\n\n⚠️ **Compliance Alert**: I noticed some potentially restrictive requirements: ${restrictiveFlags.join(', ')}. Let's ensure these meet fairness and openness requirements.`;
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: finalResponse,
      timestamp: new Date(),
      suggestions,
      extractedDeliverables: items.length > 0 ? items : undefined,
      contentType
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

  const getContentTitle = (contentType?: string): string => {
    switch (contentType) {
      case 'deliverables': return 'AI Suggested Deliverables';
      case 'mandatory': return 'AI Suggested Mandatory Criteria';
      case 'rated': return 'AI Suggested Rated Criteria';
      default: return 'AI Suggestions';
    }
  };

  const getRefineMessage = (contentType?: string): string => {
    switch (contentType) {
      case 'deliverables': return 'Let me refine these deliverables';
      case 'mandatory': return 'Let me refine these mandatory criteria';
      case 'rated': return 'Let me refine these rated criteria';
      default: return 'Let me refine these suggestions';
    }
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
    
    // Initialize requirements structure if needed
    if (!formData.requirements) {
      onUpdate({ 
        requirements: {
          mandatory: [],
          rated: [],
          priceWeight: 30
        }
      });
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
                  
                  {/* Show AI suggested content cards */}
                  {message.extractedDeliverables && message.extractedDeliverables.length > 0 && (
                    <AIContentCard
                      title={getContentTitle(message.contentType)}
                      items={message.extractedDeliverables}
                      onAddItem={(item) => handleAddSingleItem(item, message.contentType || 'deliverables')}
                      onAddAll={(items) => handleAddAllItems(items, message.contentType || 'deliverables')}
                      onRefine={() => handleSend(getRefineMessage(message.contentType))}
                      contentType={message.contentType || 'deliverables'}
                    />
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