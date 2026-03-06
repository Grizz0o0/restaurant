'use client';

import { useAdminChat } from '@/hooks/useAdminChat';
import { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, MessageSquareOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export const ChatWindow = () => {
    const {
        selectedUserId,
        messages,
        isLoadingHistory,
        sendMessage,
        isConnected,
    } = useAdminChat();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            sendMessage(inputValue);
            setInputValue('');
        }
    };

    if (!selectedUserId) {
        return (
            <div className="flex-1 bg-muted/10 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquareOff className="h-12 w-12 mb-4 opacity-50" />
                <p>Chọn một cuộc trò chuyện để bắt đầu tương tác</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background relative">
            {/* Messages Header */}
            <div className="p-4 border-b flex justify-between items-center bg-background shadow-sm z-10">
                <h3 className="font-medium">Chi tiết cuộc trò chuyện</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                        className={cn(
                            'w-2 h-2 rounded-full',
                            isConnected ? 'bg-green-500' : 'bg-red-500',
                        )}
                    />
                    {isConnected ? 'Sẵn sàng' : 'Mất kết nối'}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/5">
                {isLoadingHistory ? (
                    <div className="flex justify-center h-full items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        // Admin messages are sent "from" an Admin ID, user messages come from their ID.
                        // Assuming toUserId being the selected user means the Admin sent it.
                        const isAdmin = msg.fromUserId !== selectedUserId;

                        return (
                            <div
                                key={msg.id || index}
                                className={cn(
                                    'flex flex-col max-w-[70%]',
                                    isAdmin
                                        ? 'ml-auto items-end'
                                        : 'mr-auto items-start',
                                )}
                            >
                                <div className="flex items-end gap-2">
                                    <div
                                        className={cn(
                                            'px-4 py-2.5 rounded-2xl text-[15px] shadow-sm',
                                            isAdmin
                                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                : 'bg-white border rounded-bl-sm',
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                                <span className="text-[11px] text-muted-foreground mt-1.5 px-1 font-medium">
                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-background border-t shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
                <form
                    onSubmit={handleSend}
                    className="flex gap-3 max-w-4xl mx-auto"
                >
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Nhập câu trả lời cho khách hàng (nhấn Enter để gửi)..."
                        disabled={!isConnected}
                        className="bg-muted/50 border-input h-11"
                    />
                    <Button
                        type="submit"
                        disabled={!inputValue.trim() || !isConnected}
                        className="h-11 px-8"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        Gửi
                    </Button>
                </form>
            </div>
        </div>
    );
};
