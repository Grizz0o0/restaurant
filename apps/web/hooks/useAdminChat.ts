import { useEffect, useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useSocket } from '@/providers/socket-provider';
import { useAuth } from '@/hooks/domain/use-auth';
import type { Message, ConversationUser } from '@repo/schema';

export const useAdminChat = () => {
    const { socket, isConnected } = useSocket();
    const { isAuthenticated, user } = useAuth();

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    const utils = trpc.useUtils();

    // 1. Fetch Conversations List
    const { data: conversationsData, isLoading: isLoadingConversations } =
        trpc.message.getConversations.useQuery(undefined, {
            enabled: isAuthenticated && user?.role?.name === 'ADMIN',
            refetchOnWindowFocus: false,
        });

    const conversations = useMemo(
        () => conversationsData?.conversations || [],
        [conversationsData],
    );

    // 2. Fetch Selected Chat History
    const { data: historyData, isLoading: isLoadingHistory } =
        trpc.message.getHistory.useQuery(
            { limit: 50, userId: selectedUserId || '' },
            {
                enabled:
                    !!selectedUserId &&
                    isAuthenticated &&
                    user?.role?.name === 'ADMIN',
                refetchOnWindowFocus: false,
            },
        );

    useEffect(() => {
        if (historyData?.messages) {
            setMessages(historyData.messages.reverse());
            // Invalidate conversations to clear unread counts
            utils.message.getConversations.invalidate();
        } else {
            setMessages([]);
        }
    }, [historyData, utils]);

    const sendMutation = trpc.message.send.useMutation({
        onError: (error) => {
            console.error('Lỗi khi gửi tin nhắn Admin:', error);
        },
        onSuccess: () => {
            utils.message.getConversations.invalidate();
        },
    });

    // 3. Socket Event Listeners
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleNewMessage = (message: Message) => {
            // Update conversation list unread counts / latest message
            utils.message.getConversations.invalidate();

            // Append to current chat if it belongs to the selected user
            if (
                selectedUserId &&
                (message.fromUserId === selectedUserId ||
                    message.toUserId === selectedUserId)
            ) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === message.id)) return prev;
                    const filtered = prev.filter(
                        (m) =>
                            !m.id.startsWith('temp-') ||
                            m.content !== message.content,
                    );
                    return [...filtered, message];
                });

                // If the message came from the user and we have their chat open, we should implicitly read it inside the backend
                if (message.fromUserId === selectedUserId) {
                    // Optionally implement a trpc mutation to mark as read immediately
                }
            }
        };

        socket.on('newMessage', handleNewMessage);

        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }, [socket, isConnected, selectedUserId, utils]);

    // 4. Send Message Function
    const sendMessage = useCallback(
        (content: string) => {
            if (!content.trim() || !user || !selectedUserId) return;

            const trimmedContent = content.trim();

            sendMutation.mutate({
                toUserId: selectedUserId,
                content: trimmedContent,
            });

            const tempMessage: Message = {
                id: `temp-${Date.now()}`,
                fromUserId: user.id,
                toUserId: selectedUserId,
                content: trimmedContent,
                readAt: null,
                createdAt: new Date(),
            };

            setMessages((prev) => [...prev, tempMessage]);
        },
        [sendMutation, user, selectedUserId],
    );

    return {
        conversations,
        isLoadingConversations,
        selectedUserId,
        setSelectedUserId,
        messages,
        isLoadingHistory,
        sendMessage,
        isConnected,
    };
};
