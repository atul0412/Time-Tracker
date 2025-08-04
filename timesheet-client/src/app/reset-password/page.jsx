'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from "../../components/spinner";
import { Suspense } from 'react';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
    } else {
      toast.error('Invalid or missing token.');
    }
  }, [searchParams]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Missing reset token.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        `/users/reset-password?token=${encodeURIComponent(token)}`,
        { password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      toast.success(response.data.message || 'Password reset successful.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
     <Suspense fallback={<div className="p-6 text-center text-gray-600">Loading reset form...</div>}>
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 to-purple-300 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative">
        <h2 className="text-3xl font-bold text-center text-purple-950 mb-6">
          Reset Password
        </h2>

        <form onSubmit={handleReset} className="space-y-4" autoComplete="off">
          {/* New Password */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="mt-1 block w-full px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-950 disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="mt-1 block w-full px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-950 disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-950 hover:bg-purple-900 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner/>
                Reseting...
              </span>
            ) : (
              " Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
    </Suspense>

  );
}
