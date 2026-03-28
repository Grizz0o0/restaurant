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


    const { data: adminData } = trpc.message.getAdmin.useQuery(undefined, {
        enabled: isAuthenticated,
        refetchOnWindowFocus: false,
    });

    const adminId = adminData?.id;

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

            setMessages(historyData.messages);
        }
    }, [historyData]);

    useEffect(() => {
        if (!socket || !isConnected || !isOpen) return;


        socket.on('newMessage', (message: Message) => {

            setMessages((prev) => {
                if (prev.some((m) => m.id === message.id)) return prev;
                const filtered = prev.filter(
                    (m) =>
                        !m.id.startsWith('temp-') ||
                        m.content !== message.content,
                );
                return [...filtered, message];
            });
        });

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


            sendMutation.mutate({
                toUserId: adminId,
                content: trimmedContent,
            });


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
