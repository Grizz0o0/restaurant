import { ChatClient } from '@/features/admin/components/chat/chat-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hỗ trợ trực tuyến | Admin',
    description: 'Bảo mật tin nhắn hỗ trợ khách hàng',
};

export default function AdminChatPage() {
    return <ChatClient />;
}
