'use client';

import { useEffect, useState } from 'react';
import { 
  X, 
  Trash2, 
  Eye, 
  EyeOff, 
  Users, 
  Plus, 
  User,
  Mail,
  Shield,
  FolderOpen,
  Calendar,
  Search,
  Filter,
  Edit3,
  Save,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';

export default function AllUsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });

  // Edit user states
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });
  const [updating, setUpdating] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  // ✅ Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

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

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleInputChange = (e) => {
    setNewUser((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditInputChange = (e) => {
    setEditFormData((prev) => ({
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
        createdAt: new Date().toISOString()
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

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      await api.put(`/users/${editingUser._id}`, editFormData);
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user._id === editingUser._id 
            ? { ...user, ...editFormData }
            : user
        )
      );
      
      setEditingUser(null);
      setEditFormData({ name: '', email: '', role: 'user' });
      toast.success('User updated successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update user');
      toast.error(err?.response?.data?.message || 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Open delete confirmation modal
  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  // ✅ Confirm delete action
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setDeleting(true);
    
    try {
      await api.delete(`/users/${userToDelete._id}`);
      setUsers((prev) => prev.filter((user) => user._id !== userToDelete._id));
      toast.success('User deleted successfully');
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete user';
      setError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ✅ Cancel delete action
  const cancelDeleteUser = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setProjectModalOpen(true);
    setLoadingProjects(true);

    try {
      const res = await api.get(`/assignProject/user/${user._id}`);
      const projects = res?.data?.data;
      const normalizedProjects = Array.isArray(projects)
        ? projects
        : Array.isArray(projects?.projects)
          ? projects.projects
          : [];

      setUserProjects(normalizedProjects);
    } catch (err) {
      toast.error('Failed to fetch user projects');
      setUserProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-red-200 text-center max-w-md">
          <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Users</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50">
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="w-8 h-8 text-purple-700" />
                </div>
                User Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage all users and their project assignments
              </p>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New User
            </button>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-purple-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Administrators</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(user => user.role === 'admin').length}
                  </p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-700" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Regular Users</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {users.filter(user => user.role === 'user').length}
                  </p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="user">Regular Users</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              All Users
              {filteredUsers.length > 0 && (
                <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full">
                  {filteredUsers.length}
                </span>
              )}
            </h2>
          </div>

          <div className="p-6">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || roleFilter !== 'all' ? 'No matching users found' : 'No users yet'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || roleFilter !== 'all' 
                    ? 'Try adjusting your search criteria.' 
                    : 'Start by adding your first user to the system.'
                  }
                </p>
                {!searchTerm && roleFilter === 'all' && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add First User
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user, index) => (
                        <tr key={user._id || user.email || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-purple-100 rounded-full p-2 mr-3">
                                <User className="w-4 h-4 text-purple-700" />
                              </div>
                              <button
                                onClick={() => handleUserClick(user)}
                                className="text-purple-700 font-medium hover:text-purple-900 hover:underline transition-colors"
                              >
                                {user.name}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                              {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              {user.createdAt 
                                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'N/A'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-purple-800 hover:text-purple-900 transition-colors p-1 rounded"
                                title="Edit user"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 hover:text-red-800 transition-colors p-1 rounded"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block md:hidden space-y-4">
                  {filteredUsers.map((user, index) => (
                    <div
                      key={user._id || user.email || index}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <button
                            onClick={() => handleUserClick(user)}
                            className="flex items-center gap-3 mb-2 group"
                          >
                            <div className="bg-purple-100 rounded-full p-2">
                              <User className="w-4 h-4 text-purple-700" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-purple-700 group-hover:text-purple-900 group-hover:underline transition-colors">
                                {user.name}
                              </h3>
                              <div className="flex items-center text-sm text-gray-500">
                                <Mail className="w-3 h-3 mr-1" />
                                {user.email}
                              </div>
                            </div>
                          </button>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                              {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                            </span>
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              {user.createdAt 
                                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : 'N/A'
                              }
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-3 border-t border-gray-200 mt-3">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="flex items-center gap-2 text-purple-600 hover:text-purple-900 text-sm font-medium transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      name="name"
                      type="text"
                      value={newUser.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      name="email"
                      type="email"
                      value={newUser.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={newUser.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-10"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      name="role"
                      value={newUser.role}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="user">Regular User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setEditFormData({ name: '', email: '', role: 'user' });
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      name="name"
                      type="text"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      name="email"
                      type="email"
                      value={editFormData.email}
                      onChange={handleEditInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      name="role"
                      value={editFormData.role}
                      onChange={handleEditInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="user">Regular User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setEditFormData({ name: '', email: '', role: 'user' });
                      setError('');
                    }}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 px-4 py-3 bg-purple-800 text-white rounded-lg hover:bg-purple-900 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Delete Confirmation Modal */}
      {deleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Delete User</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center">
                <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Are you sure you want to delete this user?
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 rounded-full p-2">
                      <User className="w-4 h-4 text-purple-700" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{userToDelete.name}</p>
                      <p className="text-sm text-gray-500">{userToDelete.email}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        userToDelete.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {userToDelete.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                        {userToDelete.role ? userToDelete.role.charAt(0).toUpperCase() + userToDelete.role.slice(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6">
                  This action cannot be undone. All user data and project assignments will be permanently removed.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelDeleteUser}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {projectModalOpen && selectedUser && (
        <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Projects for {selectedUser.name}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">View all assigned projects</p>
                </div>
                <button
                  onClick={() => {
                    setProjectModalOpen(false);
                    setSelectedUser(null);
                    setUserProjects([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-gray-600">Loading projects...</span>
                </div>
              ) : userProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Assigned</h3>
                  <p className="text-gray-500">This user hasn't been assigned to any projects yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userProjects.map((assignedProject) => (
                    <Link
                      key={assignedProject._id}
                      href={`/projects/${assignedProject.project?._id}`}
                      className="block"
                    >
                      <div className="border border-purple-200 rounded-lg p-4 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <FolderOpen className="w-5 h-5 text-purple-700" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                {assignedProject.project?.name || 'Untitled Project'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {assignedProject.project?.description || 'No description available'}
                              </p>
                            </div>
                          </div>
                          <div className="text-purple-600 group-hover:translate-x-1 transition-transform">
                            →
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
