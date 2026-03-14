import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

export const metadata: Metadata = {
    title: 'Prospero - Teacher Behavior & Context Monitor',
    description: 'A comprehensive classroom management tool for tracking student behaviors and progress',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="h-screen flex flex-col overflow-hidden bg-[#FAFAFA]">
                <AuthProvider>
                    <Navbar />
                    <main className="flex-1 overflow-hidden w-full relative">
                        {children}
                    </main>
                    <footer className="h-12 bg-white border-t border-slate-200 z-50 py-2 flex justify-center items-center shadow-soft flex-shrink-0">
                        <Image
                            src="/Built at Bridgeview2.png"
                            alt="Built at Bridgeview Watermark"
                            width={120}
                            height={40}
                            className="object-contain"
                        />
                    </footer>
                </AuthProvider>
            </body>
        </html>
    );
}
