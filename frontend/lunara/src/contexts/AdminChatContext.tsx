import React, { createContext, useContext, useState } from 'react';
import { AdminChatMode } from '@/components/chat/AdminChatSidebar';

interface AdminChatContextType {
  chatMode: AdminChatMode;
  setChatMode: (mode: AdminChatMode) => void;
  toggleChat: () => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const AdminChatContext = createContext<AdminChatContextType | undefined>(undefined);

export const AdminChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatMode, setChatMode] = useState<AdminChatMode>('hidden');
  const [unreadCount, setUnreadCount] = useState<number>(3);

  const toggleChat = () => {
    setChatMode((prev) => (prev === 'hidden' || prev === 'minimized' ? 'floating' : 'hidden'));
  };

  return (
    <AdminChatContext.Provider
      value={{
        chatMode,
        setChatMode,
        toggleChat,
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </AdminChatContext.Provider>
  );
};

export const useAdminChat = (): AdminChatContextType => {
  const context = useContext(AdminChatContext);
  if (!context) {
    throw new Error('useAdminChat must be used within an AdminChatProvider');
  }
  return context;
};
