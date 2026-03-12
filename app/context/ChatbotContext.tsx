'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';

type ChatbotContextType = {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
};

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  return (
    <ChatbotContext.Provider value={{ isOpen, openChat, closeChat }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within ChatbotProvider');
  }
  return context;
}
