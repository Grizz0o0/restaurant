'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { getAccessToken } from '@/lib/auth/cookies';
import type { Message, NotificationType } from '@repo/schema';

interface ServerToClientEvents {
    notification: (data: NotificationType) => void;
    newMessage: (data: Message) => void;
    messageStatusUpdate: (data: { messageId: string; isRead: boolean }) => void;
    order_updated: (data: { orderId: string; status: string }) => void;
    token_expired: () => void;
    pong: (data: { message: string; time: string }) => void;
}

interface ClientToServerEvents {
    ping: (data: { text: string }) => void;
}

interface SocketContextType {
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const [socket, setSocket] = useState<Socket<
        ServerToClientEvents,
        ClientToServerEvents
    > | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    // Dùng ref để tránh recreate socket khi re-render
    const socketRef = useRef<Socket<
        ServerToClientEvents,
        ClientToServerEvents
    > | null>(null);
    const isRefreshingRef = useRef(false);

    // Hàm refresh access token
    const refreshToken = async (): Promise<string | null> => {
        if (isRefreshingRef.current) return null;
        isRefreshingRef.current = true;
        try {
            const res = await fetch('/api/auth/refresh', { method: 'POST' });
            if (!res.ok) return null;
            // Sau khi refresh, đọc lại token từ cookie
            return getAccessToken() || null;
        } catch {
            return null;
        } finally {
            isRefreshingRef.current = false;
        }
    };

    useEffect(() => {
        // Đợi auth query xong trước khi khởi tạo socket
        if (isLoading) return;

        if (!isAuthenticated) {
            // User đã logout → disconnect socket nếu đang có
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Nếu đã có socket đang chạy thì không tạo mới
        if (socketRef.current?.connected) return;
        const apiUri =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3052';

        const socketInstance: Socket<
            ServerToClientEvents,
            ClientToServerEvents
        > = io(apiUri, {
                auth: (cb) => {
                    // Luôn lấy token mới nhất từ cookie khi reconnect
                    cb({ token: getAccessToken() });
                },
                withCredentials: true,
                // WebSocket trước, fallback sang polling nếu ws bị block
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                timeout: 20000,
            },
        );

        socketInstance.on('connect', () => {
            console.log('[Socket] Connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.warn('[Socket] Connection error:', error.message);
            setIsConnected(false);
        });

        // Xử lý token hết hạn: refresh token rồi reconnect
        socketInstance.on('token_expired', async () => {
            console.warn('[Socket] Token expired, attempting refresh...');
            socketInstance.disconnect();

            const newToken = await refreshToken();
            if (newToken) {
                console.log('[Socket] Token refreshed, reconnecting...');
                socketInstance.connect();
            } else {
                console.warn(
                    '[Socket] Token refresh failed. User may need to re-login.',
                );
            }
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            socketRef.current = null;
        };
        // Chỉ chạy khi isAuthenticated thay đổi THẬT SỰ, không phải khi isLoading thay đổi
    }, [isAuthenticated, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
