'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './AuthProvider';
import { usePathname } from 'next/navigation';
import { useState, Fragment } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    // Hide navbar on login and signup pages
    if (pathname === '/' || pathname === '/signup') {
        return null;
    }

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Title */}
                    <Link href="/" className="flex items-center space-x-2">
                        <Image
                            src="/prospero-logo.png"
                            alt="Prospero Logo"
                            width={240}
                            height={80}
                            className="h-16 w-auto"
                        />
                    </Link>

                    {/* User Info and Profile Dropdown */}
                    {user && (
                        <div className="relative inline-block text-left">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center space-x-3 focus:outline-none group"
                            >
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">{user.displayName}</p>
                                </div>

                                {/* Avatar Circle */}
                                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-sm group-hover:shadow-md transition-all ring-2 ring-transparent group-hover:ring-primary/20">
                                    {user.displayName
                                        ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
                                        : 'U'}
                                </div>

                                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {menuOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50">
                                    <div className="px-4 py-3">
                                        <p className="text-sm text-gray-900 font-medium">Signed in as</p>
                                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={() => { logout(); setMenuOpen(false); }}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            role="menuitem"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
