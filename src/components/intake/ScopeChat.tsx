import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, AlertTriangle } from "lucide-react";
import { ChatMessage, IntakeFormData } from "@/types/intake";
import { useToast } from "@/hooks/use-toast";

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
      // Simulate AI response for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = generateAIResponse(messageText, formData);
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Update form data based on AI extraction
      updateFormDataFromMessage(messageText, onUpdate);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userMessage: string, formData: IntakeFormData): ChatMessage => {
    // Simple response generation - would be replaced with actual AI
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
    // Extract information from user message and update form data
    if (message.toLowerCase().includes('data analysis') && !formData.commodityType) {
      onUpdate({ commodityType: 'Data Analysis Services' });
    }
    
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