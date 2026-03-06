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

    const sendMutation = trpc.message.send.useMutation({
        onError: (error) => {
            console.error('Lỗi khi gửi tin nhắn:', error);
        },
    });

    // Fetch admin user ID
    const { data: adminData } = trpc.message.getAdmin.useQuery(undefined, {
        enabled: isAuthenticated,
        refetchOnWindowFocus: false,
    });

    const adminId = adminData?.id;

    // Fetch history using tRPC when chat opens and adminId is available
    const { data: historyData, isLoading: isLoadingHistory } =
        trpc.message.getHistory.useQuery(
            { limit: 50, userId: adminId || '' },
            {
                enabled: isOpen && isAuthenticated && !!adminId,
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
        socket.on('newMessage', (message: Message) => {
            setMessages((prev) => {
                // Ignore optimistic messages or duplicates
                if (prev.some((m) => m.id === message.id)) return prev;
                // Since this might be our own message returned by the server,
                // we might want to replace the temp message, but for simplicity we can just filter temps out
                const filtered = prev.filter(
                    (m) =>
                        !m.id.startsWith('temp-') ||
                        m.content !== message.content,
                );
                return [...filtered, message];
            });
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
            socket.off('newMessage');
            socket.off('messageStatusUpdate');
        };
    }, [socket, isConnected, isOpen]);

    const sendMessage = useCallback(
        (content: string) => {
            if (!content.trim() || !user || !adminId) return;

            const trimmedContent = content.trim();

            // Send via tRPC
            sendMutation.mutate({
                toUserId: adminId,
                content: trimmedContent,
            });

            // Optimistic update
            const tempMessage: Message = {
                id: `temp-${Date.now()}`,
                fromUserId: user.id,
                toUserId: adminId,
                content: trimmedContent,
                readAt: null,
                createdAt: new Date(),
            };

            setMessages((prev) => [...prev, tempMessage]);
        },
        [sendMutation, user, adminId],
    );

    return {
        messages,
        sendMessage,
        isLoadingHistory,
        isConnected,
    };
};
