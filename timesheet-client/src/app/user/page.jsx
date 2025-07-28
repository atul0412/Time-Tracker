'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export default function AllUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users/getAlluser');
        setUsers(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p className="p-8 text-center text-gray-500">Loading users...</p>;
  if (error) return <p className="p-8 text-center text-red-600 font-semibold">{error}</p>;

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-purple-900 mb-6">All Users</h1>

          {users.length === 0 ? (
            <p className="text-gray-600 italic">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Role</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
