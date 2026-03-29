import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';

export interface AIMessage {
    role: 'user' | 'model';
    text: string;
}

export const useAIChat = () => {
    const [messages, setMessages] = useState<AIMessage[]>([
        {
            role: 'model',
            text: 'Xin chào! Tôi là trợ lý ảo của BAMIXO Restaurant. Tôi có thể giúp gì cho bạn hôm nay?',
        },
    ]);

    const chatMutation = trpc.aiChat.chat.useMutation();

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || chatMutation.isPending) return;

            const userMessage = content.trim();
            setMessages((prev) => [
                ...prev,
                { role: 'user', text: userMessage },
            ]);

            try {
                const history = messages.map((m) => ({
                    role: m.role,
                    parts: [m.text],
                }));

                const response = await chatMutation.mutateAsync({
                    message: userMessage,
                    history,
                });

                setMessages((prev) => [
                    ...prev,
                    { role: 'model', text: response.text },
                ]);
            } catch (error) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'model',
                        text: 'Xin lỗi, tôi đang gặp một chút trục trặc. Bạn vui lòng thử lại sau nhé!',
                    },
                ]);
            }
        },
        [messages, chatMutation],
    );

    return {
        messages,
        sendMessage,
        isPending: chatMutation.isPending,
    };
};
