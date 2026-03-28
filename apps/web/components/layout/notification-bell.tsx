'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/lib/trpc/client';
import { useSocket } from '@/providers/socket-provider';
import { useAuth } from '@/hooks/domain/use-auth';
import { toast } from 'sonner';
import { NotificationType } from '@repo/schema';

export function NotificationBell() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const utils = trpc.useUtils();

    const { data: notifications = [] } =
        trpc.notification.getNotifications.useQuery(undefined, {
            enabled: !!user,
        });

    const markAsReadMutation = trpc.notification.markAsRead.useMutation({
        onSuccess: () => {
            utils.notification.getNotifications.invalidate();
        },
    });

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (data: NotificationType) => {
            toast.info(data.title, {
                description: data.content,
            });
            utils.notification.getNotifications.invalidate();
        };

        socket.on('notification', handleNewNotification);

        return () => {
            socket.off('notification', handleNewNotification);
        };
    }, [socket, utils]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleMarkAsRead = (id: string) => {
        markAsReadMutation.mutate({ id });
    };

    const handleMarkAllAsRead = () => {
        markAsReadMutation.mutate({});
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
                    )}
                    <span className="sr-only">Thông báo</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold leading-none">Thông báo</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={handleMarkAllAsRead}
                            disabled={markAsReadMutation.isPending}
                        >
                            Đánh dấu đã đọc
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-75">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            Không có thông báo nào.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                                        !notification.isRead
                                            ? 'bg-muted/30'
                                            : ''
                                    }`}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            handleMarkAsRead(notification.id);
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-1">
                                            <p
                                                className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}
                                            >
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.content}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(
                                                    notification.createdAt,
                                                ).toLocaleTimeString()}{' '}
                                                -{' '}
                                                {new Date(
                                                    notification.createdAt,
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
