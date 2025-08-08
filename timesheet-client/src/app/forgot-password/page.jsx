'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { 
  Mail, 
  ArrowLeft, 
  Send, 
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react';
import Spinner from "../../components/spinner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await api.post(`/users/forgot-password`, { email });
      const successMessage = res.data.message || "Check your email for the reset link.";
      setMessage(successMessage);
      setSuccess(true);
      toast.success("Reset link sent to your email!");
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Something went wrong. Please try again.";
      setMessage(errorMessage);
      setSuccess(false);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br  flex items-center justify-center p-4">
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
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Forgot Password?
              </h2>
              <p className="text-purple-100">
                No worries! Enter your email and we'll send you a reset link
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-6">
            {!success ? (
              // Reset Form
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    loading || !email
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-200'
                  } text-white shadow-sm`}
                >
                  {loading ? (
                    <>
                      <Spinner />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              // Success State
              <div className="text-center space-y-4">
                <div className="bg-green-100 p-4 rounded-full inline-block">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Check Your Email!
                  </h3>
                  <p className="text-gray-600 text-sm">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setMessage("");
                    setEmail("");
                  }}
                  className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
                >
                  Try with different email
                </button>
              </div>
            )}

            {/* Error/Success Message */}
            {message && !success && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Error</h4>
                    <p className="text-sm text-red-700 mt-1">{message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <Link 
                    href="/login" 
                    className="font-medium text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <span>🔒 Secure</span>
                  <span>•</span>
                  <span>⚡ Fast</span>
                  <span>•</span>
                  <span>✅ Reliable</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Reset links expire in 1 hour for security purposes
          </p>
        </div>
      </div>
    </div>
  );
}
