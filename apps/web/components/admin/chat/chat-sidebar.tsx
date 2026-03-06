'use client';

import { useAdminChat } from '@/hooks/useAdminChat';
import { cn } from '@/lib/utils';
import { UserCircle, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ConversationUser } from '@repo/schema';

export const ChatSidebar = () => {
    const {
        conversations,
        selectedUserId,
        setSelectedUserId,
        isLoadingConversations,
    } = useAdminChat();

    if (isLoadingConversations) {
        return (
            <div className="w-80 border-r bg-background flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="w-80 border-r bg-background flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-muted/30">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Tin nhắn khách hàng
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8 text-sm">
                        Chưa có cuộc trò chuyện nào.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {conversations.map((conv: ConversationUser) => (
                            <button
                                key={conv.userId}
                                onClick={() => setSelectedUserId(conv.userId)}
                                className={cn(
                                    'w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-3 items-start',
                                    selectedUserId === conv.userId
                                        ? 'bg-muted'
                                        : 'bg-transparent',
                                )}
                            >
                                <div className="relative shrink-0">
                                    <UserCircle className="h-10 w-10 text-muted-foreground" />
                                    {conv.unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">
                                            {conv.unreadCount > 9
                                                ? '9+'
                                                : conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-medium text-sm truncate pr-2">
                                            {conv.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(
                                                new Date(
                                                    conv.lastMessage.createdAt,
                                                ),
                                                { addSuffix: true, locale: vi },
                                            )}
                                        </p>
                                    </div>
                                    <p
                                        className={cn(
                                            'text-xs truncate',
                                            conv.unreadCount > 0
                                                ? 'text-foreground font-medium'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {conv.lastMessage.content}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
