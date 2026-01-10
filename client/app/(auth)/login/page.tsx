'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Shield } from 'lucide-react';

// Default admin credentials (temporary - can be removed later)
const DEFAULT_ADMIN_EMAIL = 'admin@saree.com';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('Saree Retail Management');

  // Fetch company name from settings on mount (public endpoint)
  useEffect(() => {
    const loadCompanyName = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_BASE_URL}/settings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const settings = await response.json();
          if (settings?.companyName) {
            setCompanyName(settings.companyName + ' Management');
          }
        }
      } catch (error) {
        console.error('Failed to load company name:', error);
        // Keep default name if fetch fails
      }
    };
    loadCompanyName();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { authAPI } = await import('@/lib/api');
      const result = await authAPI.login({ email, password });

      console.log('Login response:', result); // Debug

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Check for successful login - any of these conditions
      if (result.token || result.message === 'Login successful' || result.user) {
        // Successfully logged in - use window.location for reliable redirect
        console.log('Login successful, redirecting to dashboard...');
        console.log('Token stored:', result.token ? 'Yes' : 'No');
        setLoading(false);
        
        // Small delay to ensure token and cookie are stored
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 200);
      } else {
        console.error('Login failed - no token or success message:', result);
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleLoginAsAdmin = () => {
    setEmail(DEFAULT_ADMIN_EMAIL);
    setPassword(DEFAULT_ADMIN_PASSWORD);
    // Auto-submit after a brief delay
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {companyName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
              
              {/* Temporary: Login as Admin button */}
              <div className="w-full border-t border-gray-200 pt-4">
                <Button
                  type="button"
                  onClick={handleLoginAsAdmin}
                  variant="outline"
                  className="w-full h-11 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                  disabled={loading}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Login as Admin (Temporary)
                </Button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Default: admin@saree.com / admin123
                </p>
              </div>

              <p className="text-sm text-center text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

