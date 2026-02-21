'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/domain/use-auth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export const ChatWidget = () => {
    const { isAuthenticated, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, isLoadingHistory, isConnected } =
        useChat(isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim()) {
            sendMessage(messageInput);
            setMessageInput('');
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Bubble Button */}
            <Button
                size="icon"
                className={cn(
                    'h-14 w-14 rounded-full shadow-lg transition-transform duration-300',
                    isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
                )}
                onClick={() => setIsOpen(true)}
            >
                <MessageCircle className="h-6 w-6" />
                <span className="sr-only">Open Chat</span>
            </Button>

            {/* Chat Window */}
            <div
                className={cn(
                    'absolute bottom-0 right-0 w-87.5 max-w-[calc(100vw-48px)] h-125 max-h-[calc(100vh-100px)] bg-background border rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right',
                    isOpen
                        ? 'scale-100 opacity-100'
                        : 'scale-50 opacity-0 pointer-events-none',
                )}
            >
                {/* Header */}
                <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <h3 className="font-semibold">Hỗ trợ trực tuyến</h3>
                        <p className="text-xs opacity-80 flex items-center gap-1.5">
                            <span
                                className={cn(
                                    'w-2 h-2 rounded-full',
                                    isConnected ? 'bg-green-400' : 'bg-red-400',
                                )}
                            />
                            {isConnected ? 'Sẵn sàng' : 'Đang kết nối...'}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary-foreground hover:bg-primary/90"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                    {isLoadingHistory ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm space-y-2">
                            <MessageCircle className="h-10 w-10 opacity-20" />
                            <p>Xin chào! Chúng tôi có thể giúp gì cho bạn?</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.fromUserId === user?.id;
                            return (
                                <div
                                    key={msg.id || idx}
                                    className={cn(
                                        'flex flex-col max-w-[85%]',
                                        isMe
                                            ? 'ml-auto items-end'
                                            : 'mr-auto items-start',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'px-4 py-2 rounded-2xl text-sm wrap-break-word',
                                            isMe
                                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                : 'bg-muted text-foreground rounded-bl-sm',
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                        {format(
                                            new Date(msg.createdAt),
                                            'HH:mm',
                                        )}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-background border-t">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            placeholder="Nhập tin nhắn..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            disabled={!isConnected}
                            className="rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!messageInput.trim() || !isConnected}
                            className="rounded-full shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};
