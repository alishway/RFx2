import { createContext, useContext, useState, ReactNode } from 'react';
import { ChatMessage } from '@/types/intake';
import { AISuggestion } from '@/types/aiSuggestions';

interface ChatContextType {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  pendingSuggestions: AISuggestion[];
  setPendingSuggestions: (suggestions: AISuggestion[] | ((prev: AISuggestion[]) => AISuggestion[])) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const initialMessage: ChatMessage = {
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
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [pendingSuggestions, setPendingSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const clearChat = () => {
    setMessages([initialMessage]);
    setPendingSuggestions([]);
    setIsLoading(false);
  };

  return (
    <ChatContext.Provider value={{
      messages,
      setMessages,
      pendingSuggestions,
      setPendingSuggestions,
      isLoading,
      setIsLoading,
      clearChat
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};