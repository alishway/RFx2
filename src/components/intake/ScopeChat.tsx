import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, AlertTriangle } from "lucide-react";
import { ChatMessage, IntakeFormData } from "@/types/intake";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ScopeChatProps {
  formData: IntakeFormData;
  onUpdate: (updates: Partial<IntakeFormData>) => void;
}

export const ScopeChat = ({ formData, onUpdate }: ScopeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m here to help you develop your procurement scope. Let\'s start with understanding what you need. Can you describe the background or problem you\'re trying to solve?',
      timestamp: new Date(),
      suggestions: [
        'We need data analysis services',
        'Looking for IT consulting',
        'Require professional services',
        'Need construction services'
      ]
    }
  ]);
  
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
        suggestions: data.suggestions || []
      };
    } catch (error) {
      console.error('AI response error:', error);
      throw error;
    }
  };

  const generateFallbackResponse = (userMessage: string, formData: IntakeFormData): ChatMessage => {
    // Simple response generation as fallback
    let response = "";
    let suggestions: string[] = [];
    
    if (userMessage.toLowerCase().includes('data') || userMessage.toLowerCase().includes('analysis')) {
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
      suggestions
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
    // Extract deliverables from user message
    const deliverablePatterns = [
      /['"]([^'"]*report[^'"]*)['"]/gi,
      /['"]([^'"]*dashboard[^'"]*)['"]/gi,
      /['"]([^'"]*session[^'"]*)['"]/gi,
      /['"]([^'"]*analysis[^'"]*)['"]/gi,
      /['"]([^'"]*deliverable[^'"]*)['"]/gi
    ];
    
    const extractedDeliverables: any[] = [];
    
    deliverablePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        const name = match[1].trim();
        if (name && !extractedDeliverables.some(d => d.name.toLowerCase() === name.toLowerCase())) {
          extractedDeliverables.push({
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            description: `Deliverable: ${name}`,
            selected: true
          });
        }
      }
    });
    
    // If deliverables were found, add them to existing deliverables
    if (extractedDeliverables.length > 0) {
      const currentDeliverables = formData.deliverables || [];
      const newDeliverables = [...currentDeliverables];
      
      extractedDeliverables.forEach(newDel => {
        if (!newDeliverables.some(existing => existing.name.toLowerCase() === newDel.name.toLowerCase())) {
          newDeliverables.push(newDel);
        }
      });
      
      onUpdate({ deliverables: newDeliverables });
    }
    
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