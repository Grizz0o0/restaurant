'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ProfileSidebar } from '@/components/profile/profile-sidebar';
import { Separator } from '@/components/ui/separator';

interface ProfileLayoutProps {
    children: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 lg:py-16 animate-fade-in-up">
                <div className="space-y-6">
                    <div className="space-y-0.5">
                        <h2 className="text-2xl font-bold tracking-tight font-display">
                            Tài khoản của bạn
                        </h2>
                        <p className="text-muted-foreground">
                            Quản lý thông tin cá nhân và tài khoản.
                        </p>
                    </div>
                    <Separator className="my-6" />
                    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
                        <aside className="lg:w-64">
                            <ProfileSidebar />
                        </aside>
                        <div className="flex-1 lg:max-w-3xl">{children}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
