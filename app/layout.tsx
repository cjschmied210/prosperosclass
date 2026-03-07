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
            <body>
                <AuthProvider>
                    <Navbar />
                    <main className="pb-24 pt-6 w-full">{children}</main>
                    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 py-3 flex justify-center items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <Image
                            src="/Built at Bridgeview2.png"
                            alt="Built at Bridgeview Watermark"
                            width={150}
                            height={50}
                            className="object-contain"
                        />
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
