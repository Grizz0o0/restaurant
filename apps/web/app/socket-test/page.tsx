'use client';

import { useSocket } from '@/features/chat/providers/socket-provider';
import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface TestMessage {
    message: string;
    time: string;
}

export default function SocketTestPage() {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState<TestMessage[]>([]);

    useEffect(() => {
        if (!socket) return;

        socket.on('pong', (data) => {
            setMessages((prev) => [...prev, data]);
        });

        return () => {
            socket.off('pong');
        };
    }, [socket]);

    const sendPing = () => {
        if (socket) {
            socket.emit('ping', { text: 'Hello from Frontend!' });
        }
    };

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Socket.IO Test</h1>

            <div className="flex items-center gap-2">
                <div
                    className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            <Button onClick={sendPing} disabled={!isConnected} variant="hero">
                Send Ping to Server
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Messages from Server</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {messages.map((msg, idx) => (
                            <li key={idx} className="p-2 bg-muted rounded">
                                <p>{msg.message}</p>
                                <small className="text-muted-foreground">
                                    {new Date(msg.time).toLocaleTimeString()}
                                </small>
                            </li>
                        ))}
                        {messages.length === 0 && (
                            <p className="text-muted-foreground italic">
                                No messages yet...
                            </p>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
