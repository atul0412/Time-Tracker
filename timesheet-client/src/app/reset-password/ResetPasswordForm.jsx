'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/axios';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Shield, 
  ArrowLeft, 
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';
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
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
    } else {
      toast.error('Invalid or missing reset token.');
      setTokenValid(false);
    }
  }, [searchParams]);

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: 'weak', color: 'red' };
    if (password.length < 8) return { strength: 'fair', color: 'orange' };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 'strong', color: 'green' };
    }
    return { strength: 'good', color: 'blue' };
  };

  const passwordStrength = getPasswordStrength(password);

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

      toast.success(response.data.message || 'Password reset successful!');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className=" bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Error Header */}
            <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-red-500 to-red-600">
              <div className="text-center">
                <div className="bg-white p-3 rounded-xl inline-block mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Invalid Link</h2>
                <p className="text-red-100">This password reset link is not valid</p>
              </div>
            </div>

            {/* Error Content */}
            <div className="px-8 py-6 text-center">
              <p className="text-gray-600 mb-6">
                The password reset link you're using is invalid or has expired. Please request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gradient-to-br flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        
        {/* Back to Login Link */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-purple-600 to-purple-700">
            <div className="text-center">
              <div className="bg-white p-3 rounded-xl inline-block mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Create New Password
              </h2>
              <p className="text-purple-100">
                Choose a strong password for your account
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-6">
            <form onSubmit={handleReset} className="space-y-6" autoComplete="off">
              
              {/* New Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.color === 'red' ? 'text-red-600' :
                        passwordStrength.color === 'orange' ? 'text-orange-600' :
                        passwordStrength.color === 'blue' ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                      </span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          passwordStrength.color === 'red' ? 'bg-red-500 w-1/4' :
                          passwordStrength.color === 'orange' ? 'bg-orange-500 w-2/4' :
                          passwordStrength.color === 'blue' ? 'bg-blue-500 w-3/4' :
                          'bg-green-500 w-full'
                        }`}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className="mt-2">
                    <div className={`flex items-center gap-2 text-xs ${
                      password === confirmPassword ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {password === confirmPassword ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      <span>
                        {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-600' : ''}`}>
                    {password.length >= 6 ? '✓' : '•'} At least 6 characters
                  </li>
                  <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : ''}`}>
                    {password.length >= 8 ? '✓' : '•'} 8+ characters recommended
                  </li>
                  <li className={`flex items-center gap-2 ${/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) ? 'text-green-600' : ''}`}>
                    {/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) ? '✓' : '•'} Mix of letters and numbers
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  loading || !password || !confirmPassword || password !== confirmPassword
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-200'
                } text-white shadow-sm`}
              >
                {loading ? (
                  <>
                    <Spinner />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Password updated successfully?{' '}
                  <Link 
                    href="/login" 
                    className="font-medium text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
                <p className="text-xs text-gray-500">
                  Your password will be securely encrypted
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 This session is secured with enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  );
}
