'use client';

import { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function AllUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleInputChange = (e) => {
    setNewUser((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddUser = async (e) => {
  e.preventDefault();
  setCreating(true);
  setError('');

  try {
    const res = await api.post('/users/register', newUser);
    const savedUser = {
      ...newUser,
      _id: res.data.user?._id || res.data._id,
    };
    setUsers((prev) => [...prev, savedUser]);
    setShowModal(false);
    setNewUser({ name: '', email: '', password: '', role: 'user' });
    toast.success('User added successfully');
  } catch (err) {
    setError(err?.response?.data?.message || 'Failed to add user');
    toast.error(err?.response?.data?.message || 'Failed to add user');
  } finally {
    setCreating(false);
  }
};


  const handleDeleteUser = async (userId) => {
  try {
    await api.delete(`/users/${userId}`);
    setUsers((prev) => prev.filter((user) => user._id !== userId));
    toast.success('User deleted successfully');
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to delete user';
    setError(msg);
    toast.error(msg);
  }
};

  if (loading) {
    return <p className="p-8 text-center text-gray-500">Loading users...</p>;
  }

  if (error) {
    return <p className="p-8 text-center text-red-600 font-semibold">{error}</p>;
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-purple-900">All Users</h1>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800"
            >
              Add User +
            </button>
          </div>

          {users.length === 0 ? (
            <p className="text-gray-600 italic">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={user._id || user.email || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                          title="Delete user"
                        >
                          <Trash2 size={20} className="mr-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form to Add User */}
      {showModal && (
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
              onClick={() => setShowModal(false)}
            >
              <X />
            </button>
            <h1 className="text-3xl font-bold text-purple-950 mb-6 text-center">Add New User</h1>

            {error && (
              <div className="mb-4 px-4 py-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Name</label>
                <input
                  name="name"
                  type="text"
                  value={newUser.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-800"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-800"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-800"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Role</label>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-800"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-purple-950 hover:bg-purple-900 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md"
              >
                {creating ? 'Adding...' : 'Add User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
