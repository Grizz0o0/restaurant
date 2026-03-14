'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Loader2,
    Headset,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useChat } from '@/hooks/useChat';
import { useAIChat } from '@/hooks/use-ai-chat';
import { useAuth } from '@/hooks/domain/use-auth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type ChatMode = 'AI' | 'ADMIN';

export const UnifiedChat = () => {
    const { isAuthenticated, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<ChatMode>('AI');
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Admin Chat Hook
    const {
        messages: adminMessages,
        sendMessage: sendAdminMessage,
        isLoadingHistory: isLoadingAdminHistory,
        isConnected,
    } = useChat(isOpen);

    // AI Chat Hook
    const {
        messages: aiMessages,
        sendMessage: sendAIMessage,
        isPending: isAILoading,
    } = useAIChat();

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [aiMessages, adminMessages, isOpen, mode, scrollToBottom]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        if (mode === 'AI') {
            if (isAILoading) return;
            await sendAIMessage(input);
        } else {
            sendAdminMessage(input);
        }
        setInput('');
    };

    if (!isAuthenticated) return null;

    const activeMessages = mode === 'AI' ? aiMessages : adminMessages;
    const isLoading = mode === 'AI' ? isAILoading : isLoadingAdminHistory;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20,
                            scale: 0.95,
                            transformOrigin: 'bottom right',
                        }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4"
                    >
                        <Card className="w-87.5 sm:w-100 h-135 flex flex-col shadow-2xl border-primary/20 overflow-hidden bg-background/95 backdrop-blur-sm rounded-2xl">
                            {/* Header */}
                            <div className="bg-primary text-primary-foreground p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            {mode === 'AI' ? (
                                                <Bot className="w-5 h-5" />
                                            ) : (
                                                <Headset className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm">
                                                {mode === 'AI'
                                                    ? 'BAMIXO Assistant'
                                                    : 'Hỗ trợ trực tuyến'}
                                            </h3>
                                            <p className="text-[10px] opacity-80">
                                                {mode === 'AI'
                                                    ? 'Trợ lý thực đơn trực tuyến'
                                                    : isConnected
                                                      ? 'Nhân viên đang sẵn sàng'
                                                      : 'Đang kết nối nhân viên...'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-white/20 text-white h-8 w-8"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                {/* Mode Switcher */}
                                <div className="flex bg-black/10 p-1 rounded-xl">
                                    <button
                                        onClick={() => setMode('AI')}
                                        className={cn(
                                            'flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition-all',
                                            mode === 'AI'
                                                ? 'bg-background text-primary shadow-sm'
                                                : 'hover:bg-white/5 opacity-70',
                                        )}
                                    >
                                        <Bot className="w-3.5 h-3.5" />
                                        Trợ lý AI
                                    </button>
                                    <button
                                        onClick={() => setMode('ADMIN')}
                                        className={cn(
                                            'flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition-all',
                                            mode === 'ADMIN'
                                                ? 'bg-background text-primary shadow-sm'
                                                : 'hover:bg-white/5 opacity-70',
                                        )}
                                    >
                                        <User className="w-3.5 h-3.5" />
                                        Nhân viên
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-primary/10 bg-muted/5">
                                {isLoading &&
                                mode === 'ADMIN' &&
                                activeMessages.length === 0 ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : activeMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm space-y-2 opacity-50">
                                        {mode === 'AI' ? (
                                            <Bot className="h-10 w-10" />
                                        ) : (
                                            <MessageCircle className="h-10 w-10" />
                                        )}
                                        <p>
                                            {mode === 'AI'
                                                ? 'Hỏi tôi bất cứ điều gì về menu!'
                                                : 'Bắt đầu trò chuyện với chúng tôi'}
                                        </p>
                                    </div>
                                ) : (
                                    activeMessages.map((m, i) => {
                                        // Unified message detection
                                        const isFromMe =
                                            'role' in m
                                                ? m.role === 'user'
                                                : m.fromUserId === user?.id;

                                        const text =
                                            'text' in m ? m.text : m.content;
                                        const date =
                                            'createdAt' in m
                                                ? new Date(m.createdAt)
                                                : new Date();

                                        return (
                                            <div
                                                key={i}
                                                className={cn(
                                                    'flex gap-2.5 max-w-[85%]',
                                                    isFromMe
                                                        ? 'ml-auto flex-row-reverse'
                                                        : 'mr-auto',
                                                )}
                                            >
                                                {!isFromMe && (
                                                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                                        {mode === 'AI' ? (
                                                            <Bot className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <Headset className="w-3.5 h-3.5" />
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <div
                                                        className={cn(
                                                            'p-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words',
                                                            isFromMe
                                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                                : 'bg-muted/50 text-foreground rounded-tl-none border border-border/30',
                                                        )}
                                                    >
                                                        {text}
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            'text-[10px] text-muted-foreground mt-1 px-1',
                                                            isFromMe
                                                                ? 'text-right'
                                                                : 'text-left',
                                                        )}
                                                    >
                                                        {format(date, 'HH:mm')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                {isAILoading && mode === 'AI' && (
                                    <div className="flex gap-2.5 mr-auto max-w-[85%]">
                                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                                            <Bot className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-none border border-border/30">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-border/50 bg-background">
                                <form
                                    onSubmit={handleSend}
                                    className="flex gap-2"
                                >
                                    <Input
                                        placeholder={
                                            mode === 'AI'
                                                ? 'Hỏi về món ăn...'
                                                : 'Nhập tin nhắn...'
                                        }
                                        value={input}
                                        onChange={(e) =>
                                            setInput(e.target.value)
                                        }
                                        className="bg-muted/30 border-transparent focus-visible:ring-primary rounded-xl"
                                        disabled={
                                            mode === 'ADMIN' && !isConnected
                                        }
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={
                                            !input.trim() ||
                                            (mode === 'AI'
                                                ? isAILoading
                                                : !isConnected)
                                        }
                                        className="shrink-0 rounded-xl"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="lg"
                className={cn(
                    'rounded-full w-14 h-14 shadow-xl hover:scale-105 transition-all duration-300 ring-4 ring-primary/10',
                    isOpen
                        ? 'rotate-90 scale-0 opacity-0'
                        : 'rotate-0 scale-100 opacity-100',
                )}
                onClick={() => setIsOpen(true)}
            >
                <MessageCircle className="w-6 h-6" />
            </Button>
        </div>
    );
};
