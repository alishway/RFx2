import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, User, Bot, Loader2, CheckCircle } from "lucide-react";
import { ChatMessage, IntakeFormData, Deliverable } from "@/types/intake";
import { supabase } from "@/integrations/supabase/client";

interface ScopeChatProps {
  formData: IntakeFormData;
  onUpdate: (updates: Partial<IntakeFormData>) => void;
}

export const ScopeChat = ({ formData, onUpdate }: ScopeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI procurement assistant. I'll help you define project scope, identify deliverables, and ensure compliance with procurement regulations.\n\nTo get started, tell me about your project. For example:\n• What problem are you trying to solve?\n• What deliverables do you need?\n• What's your timeline and budget range?",
      timestamp: new Date(),
      suggestions: [
        "I need data analysis services", 
        "Define project deliverables", 
        "Set project timeline",
        "Review procurement compliance"
      ]
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message?: string) => {
    const messageToSend = message || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(messageToSend, formData, messages);
      
      // Extract deliverables from AI response if any
      const extractedDeliverables = extractDeliverablesFromMessage(messageToSend);
      if (extractedDeliverables.length > 0) {
        aiResponse.extractedDeliverables = extractedDeliverables;
      }
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Auto-update form data based on message
      updateFormDataFromMessage(messageToSend, onUpdate);
      
    } catch (error) {
      console.error('AI response error:', error);
      const fallbackResponse = generateFallbackResponse(messageToSend, formData);
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeliverables = (deliverables: Deliverable[]) => {
    const currentDeliverables = formData.deliverables || [];
    const newDeliverables = [...currentDeliverables, ...deliverables];
    onUpdate({ deliverables: newDeliverables });
    
    // Add confirmation message
    const confirmationMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: `✅ Successfully added ${deliverables.length} deliverable(s) to your form! You can see them in the "Identified Deliverables" section below and modify them anytime.`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, confirmationMessage]);
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
        content: data.response || "I understand. Let me help you with that.",
        timestamp: new Date(),
        suggestions: data.suggestions || ["Define project timeline", "Set budget parameters", "Add evaluation criteria"]
      };
    } catch (error) {
      console.error('Error calling AI function:', error);
      throw error;
    }
  };

  const generateFallbackResponse = (userMessage: string, formData: IntakeFormData): ChatMessage => {
    const extractedDeliverables = extractDeliverablesFromMessage(userMessage);
    
    let suggestions = ['Define project timeline', 'Set budget parameters', 'Add evaluation criteria'];
    
    // Check for restrictive language
    const restrictiveTerms = checkRestrictiveLanguage(userMessage);
    if (restrictiveTerms.length > 0) {
      suggestions = ['Revise language to be vendor-neutral', 'Review procurement compliance', 'Clarify requirements'];
    }
    
    let responseContent = '';
    
    if (extractedDeliverables.length > 0) {
      responseContent = `Perfect! I've identified ${extractedDeliverables.length} deliverable(s) from your message:

${extractedDeliverables.map((d, i) => `${i + 1}. ${d.name}`).join('\n')}

Would you like me to add these to your form? You can review and modify them later in the "Identified Deliverables" section below.`;
    } else {
      responseContent = `I understand you want to define deliverables for your procurement. To help extract specific deliverables, try formatting them as:

• Numbered list (1. Monthly reports, 2. Dashboard, etc.)
• Bullet points (- Report, - Analysis, etc.) 
• Quoted items ("Final report", "Training sessions")

Could you provide more specific details about the deliverables you need?`;
    }
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      suggestions,
      extractedDeliverables: extractedDeliverables.length > 0 ? extractedDeliverables : undefined
    };
  };

  const checkRestrictiveLanguage = (text: string): string[] => {
    const restrictiveTerms = [
      'only', 'must use', 'specifically', 'exclusively', 'proprietary',
      'brand name', 'sole source', 'unique', 'patented', 'copyrighted'
    ];
    
    return restrictiveTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );
  };

  const extractDeliverablesFromMessage = (message: string): Deliverable[] => {
    const deliverables: Deliverable[] = [];
    
    // Pattern for numbered lists (1. 2. etc.)
    const numberedPattern = /(\d+)\.?\s*([^,;\n]+?)(?=[,;\n]|\d+\.|$)/gi;
    let match;
    
    while ((match = numberedPattern.exec(message)) !== null) {
      const name = match[2].trim().replace(/['"]/g, '');
      if (name.length > 3) { // Filter out very short matches
        deliverables.push({
          id: Math.random().toString(36).substr(2, 9),
          name: name,
          description: `Deliverable: ${name}`,
          selected: true
        });
      }
    }
    
    // Pattern for bullet points (-, *, •)
    const bulletPattern = /[•\-\*]\s*([^,;\n]+?)(?=[,;\n]|[•\-\*]|$)/gi;
    while ((match = bulletPattern.exec(message)) !== null) {
      const name = match[1].trim().replace(/['"]/g, '');
      if (name.length > 3 && !deliverables.some(d => d.name.toLowerCase() === name.toLowerCase())) {
        deliverables.push({
          id: Math.random().toString(36).substr(2, 9),
          name: name,
          description: `Deliverable: ${name}`,
          selected: true
        });
      }
    }
    
    // Pattern for quoted items
    const quotedPattern = /['"]([^'"]{4,})['"]/gi;
    while ((match = quotedPattern.exec(message)) !== null) {
      const name = match[1].trim();
      if (!deliverables.some(d => d.name.toLowerCase() === name.toLowerCase())) {
        deliverables.push({
          id: Math.random().toString(36).substr(2, 9),
          name: name,
          description: `Deliverable: ${name}`,
          selected: true
        });
      }
    }
    
    return deliverables;
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
                        <CheckCircle className="h-4 w-4" />
                        Extracted Deliverables:
                      </h4>
                      <div className="space-y-1 mb-3">
                        {(message as any).extractedDeliverables.map((del: any, idx: number) => (
                          <div key={idx} className="text-sm">• {del.name}</div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleConfirmDeliverables((message as any).extractedDeliverables)}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Add to Form
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
                          className="cursor-pointer hover:bg-secondary/80 transition-colors"
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
              <Loader2 className="w-4 h-4 text-secondary-foreground animate-spin" />
            </div>
            <Card>
              <CardContent className="p-3">
                <p className="text-muted-foreground">AI is analyzing your request...</p>
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
          placeholder="Describe your project needs, deliverables, or ask procurement questions..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        <Button 
          onClick={() => handleSend()} 
          disabled={!input.trim() || isLoading}
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};