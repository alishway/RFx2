import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatMessage } from '@/types/intake';

interface ScopeChatContextType {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  resetChat: () => void;
}

const ScopeChatContext = createContext<ScopeChatContextType | undefined>(undefined);

export const useScopeChat = () => {
  const context = useContext(ScopeChatContext);
  if (!context) {
    throw new Error('useScopeChat must be used within a ScopeChatProvider');
  }
  return context;
};

interface ScopeChatProviderProps {
  children: ReactNode;
}

const initialMessages: ChatMessage[] = [
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
];

export const ScopeChatProvider: React.FC<ScopeChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const resetChat = () => {
    setMessages(initialMessages);
  };

  return (
    <ScopeChatContext.Provider value={{ messages, setMessages, resetChat }}>
      {children}
    </ScopeChatContext.Provider>
  );
};