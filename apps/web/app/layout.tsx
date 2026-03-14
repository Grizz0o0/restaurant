import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
    subsets: ['latin', 'vietnamese'],
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-be-vietnam-pro',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        template: '%s | BAMIXO',
        default: 'BAMIXO - Bánh Mì & Xôi',
    },
    description: 'Authentic Vietnamese Bánh Mì & Street Food',
    icons: {
        icon: '/images/logo-trans.png',
        shortcut: '/images/logo-trans.png',
        apple: '/images/logo-trans.png',
    },
};

import TRPCProvider from '../lib/trpc/provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { SocketProvider } from '@/providers/socket-provider';

import { AppShell } from '@/components/layout/app-shell';
import { UnifiedChat } from '@/components/chat/UnifiedChat';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${beVietnamPro.variable} font-sans antialiased`}>
                <TRPCProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <SocketProvider>
                            <TooltipProvider>
                                <AppShell>{children}</AppShell>
                            </TooltipProvider>
                            <UnifiedChat />
                        </SocketProvider>
                    </ThemeProvider>
                </TRPCProvider>
            </body>
        </html>
    );
}
