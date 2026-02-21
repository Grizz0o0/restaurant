import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useSocket } from '@/providers/socket-provider';
import { useAuth } from '@/hooks/domain/use-auth';
import type { Message } from '@repo/schema';

export const useChat = (isOpen: boolean) => {
    const { socket, isConnected } = useSocket();
    const { isAuthenticated, user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);

    const utils = trpc.useUtils();

    // Fetch history using tRPC when chat opens
    const { data: historyData, isLoading: isLoadingHistory } =
        trpc.message.getHistory.useQuery(
            { limit: 50, userId: '00000000-0000-0000-0000-000000000000' },
            {
                enabled: isOpen && isAuthenticated,
                refetchOnWindowFocus: false,
            },
        );

    useEffect(() => {
        if (historyData?.messages) {
            setMessages(historyData.messages.reverse()); // Oldest first for chat display
        }
    }, [historyData]);

    useEffect(() => {
        if (!socket || !isConnected || !isOpen) return;

        // Listen for incoming messages
        socket.on('receiveMessage', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        // Listen for message status updates (e.g. read receipts, delivered) if needed
        socket.on('messageStatusUpdate', (statusData) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === statusData.messageId
                        ? { ...m, isRead: statusData.isRead }
                        : m,
                ),
            );
        });

        return () => {
            socket.off('receiveMessage');
            socket.off('messageStatusUpdate');
        };
    }, [socket, isConnected, isOpen]);

    const sendMessage = useCallback(
        (content: string) => {
            if (!socket || !isConnected || !content.trim()) return;

            socket.emit('sendMessage', {
                content: content.trim(),
            });

            // Optimistic update
            const tempMessage: Message = {
                id: `temp-${Date.now()}`,
                fromUserId: user?.id || '',
                toUserId: '00000000-0000-0000-0000-000000000000',
                content: content.trim(),
                readAt: null,
                createdAt: new Date(),
            };

            setMessages((prev) => [...prev, tempMessage]);
        },
        [socket, isConnected, user],
    );

    return {
        messages,
        sendMessage,
        isLoadingHistory,
        isConnected,
    };
};
