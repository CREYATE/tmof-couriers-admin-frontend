"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginForm() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        // Mock login logic for admin
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('admin_jwt', 'mock_admin_token');
            router.push('/dashboard');
        } else {
            setError('Incorrect username or password. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleLogin} className="w-full bg-white rounded-xl shadow-lg p-6 border-t-4 border-tmof-yellow">
            <div className="flex justify-center mb-4">
                <img src="/tmof logo.png" alt="TMOF Couriers Logo" className="h-8 sm:h-10" />
            </div>
            
            <div className="text-center space-y-1 mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Admin Login</h2>
                <p className="text-xs sm:text-sm text-gray-600">Please sign in to continue</p>
            </div>
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-center mb-4">
                    <p className="text-xs sm:text-sm">{error}</p>
                </div>
            )}
            
            <div className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="username" className="text-xs sm:text-sm font-medium text-gray-700">Username</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="username"
                            type="text"
                            placeholder="Enter username"
                            className="pl-9 h-10 sm:h-11 bg-gray-50 border-gray-200 focus:border-tmof-yellow focus:ring-1 focus:ring-tmof-yellow/20 rounded-lg text-sm"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            className="pl-9 pr-10 h-10 sm:h-11 bg-gray-50 border-gray-200 focus:border-tmof-yellow focus:ring-1 focus:ring-tmof-yellow/20 rounded-lg text-sm"
                            placeholder="Enter password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-6">
                <Button
                    type="submit"
                    className="w-full h-10 sm:h-11 bg-tmof-yellow hover:bg-tmof-yellow/90 text-black font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg"
                    disabled={isLoading}
                >
                    {isLoading && (
                        <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                    )}
                    {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
            </div>
            
            <div className="text-center mt-4">
                <p className="text-xs text-gray-500">
                    Need help? Contact administrator
                </p>
            </div>
        </form>
    );
}
