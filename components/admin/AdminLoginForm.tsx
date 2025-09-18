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
        <form onSubmit={handleLogin} className="w-full max-w-md space-y-6 bg-white rounded-lg shadow-lg p-8 border-t-4 border-t-[#ffd215]">
            <div className="flex justify-center mb-6">
                <img src="/tmof logo.png" alt="TMOF Couriers Logo" className="h-12" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Admin Login</h2>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                        id="username"
                        type="text"
                        placeholder="admin username"
                        className="pl-10"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="pl-10 pr-10"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>
            <Button
                type="submit"
                className="w-full bg-[#ffd215] hover:bg-[#e6bd13] text-black"
                disabled={isLoading}
            >
                {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
        </form>
    );
}
