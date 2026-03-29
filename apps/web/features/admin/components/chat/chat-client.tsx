'use client';

import { createContext, useContext } from 'react';
import { useAdminChat } from '@/features/chat/hooks/useAdminChat';
import { ChatSidebar } from './chat-sidebar';
import { ChatWindow } from './chat-window';

const ChatContext = createContext<ReturnType<typeof useAdminChat> | null>(null);

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatClient');
    }
    return context;
};

export const ChatClient = () => {
    const chatState = useAdminChat();

    return (
        <ChatContext.Provider value={chatState}>
            <div className="flex h-[calc(100vh-(--spacing(16)))] w-full overflow-hidden bg-background border rounded-lg shadow-sm">
                <ChatSidebar />
                <ChatWindow />
            </div>
        </ChatContext.Provider>
    );
};
