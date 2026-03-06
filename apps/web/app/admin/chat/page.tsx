import { ChatSidebar } from '@/components/admin/chat/chat-sidebar';
import { ChatWindow } from '@/components/admin/chat/chat-window';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hỗ trợ trực tuyến | Admin',
    description: 'Bảo mật tin nhắn hỗ trợ khách hàng',
};

export default function AdminChatPage() {
    return (
        <div className="flex h-[calc(100vh-(--spacing(16)))] w-full overflow-hidden bg-background border rounded-lg shadow-sm">
            <ChatSidebar />
            <ChatWindow />
        </div>
    );
}
