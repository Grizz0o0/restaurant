'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/auth/cookies';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({
    children,
    token,
}: {
    children: React.ReactNode;
    token?: string;
}) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const storedToken = getAccessToken();
        const activeToken = token || storedToken;

        if (!activeToken) return;

        // Ensure we connect to the root/base URL by removing /v1/api if present
        const baseUrl = (
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3052'
        ).replace(/\/v1\/api\/?$/, '');

        const socketInstance = io(baseUrl, {
            auth: {
                token: activeToken,
            },
        });

        socketInstance.on('connect', () => {
            setIsConnected(true);
            console.log('Socket connected:', socketInstance.id);
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
            console.log('Socket disconnected');
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
