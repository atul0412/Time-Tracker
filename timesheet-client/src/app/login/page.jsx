'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react'; // ✅ icons for password toggle
import Spinner from '../../components/spinner';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false); // ✅ loading state
  const router = useRouter();
  const { setUser } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true); // start loading

    try {
      const res = await api.post('/users/login', formData);

      if (res.status === 200) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        toast.success('Login successful!');
        router.push('/');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false); // stop loading
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 to-purple-300 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-extrabold text-center text-purple-950 mb-8">Welcome Back</h1>

        {errorMsg && (
          <div className="mb-4 px-4 py-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-800"
              placeholder="Enter Your Email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-800 pr-10"
                placeholder="Enter Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-purple-800 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-purple-950 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md flex justify-center items-center ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-purple-900'
            }`}
          >
            {loading ? (
             <Spinner/>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
