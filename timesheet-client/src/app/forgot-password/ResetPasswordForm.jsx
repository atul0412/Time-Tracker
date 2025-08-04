'use client';

import { useState } from "react";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import Spinner from "../../components/spinner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post(`/users/forgot-password`, { email });
      setMessage(res.data.message || "Check your email for the reset link.");
      toast.success("Reset link sent!");
    } catch (error) {
      const msg =
        error?.response?.data?.message || "Something went wrong. Try again.";
      setMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 to-purple-300 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-purple-950 text-center mb-6">
          Forgot Your Password?
        </h2>

        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your email and we’ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-800 disabled:bg-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-950 hover:bg-purple-900 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Sending...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        {message && (
          <div className="mt-4 text-sm text-center text-purple-800">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
