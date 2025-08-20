'use client';
import { useEffect, useState } from 'react';
import {
  Users,
  FolderOpen,
  Plus,
  Eye,
  UserCheck,
  Settings,
  Search,
  ArrowRight,
  XCircle,
  X,
  AlertTriangle,
  UserMinus,
  Trash2
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import UserAssignmentsModal from './userAssignment';


const AssignProjectPage = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [deassigning, setDeassigning] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy] = useState('all');
  const [modalUser, setModalUser] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [confirmDeassign, setConfirmDeassign] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ Get logged in user from token or backend
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUser({
            _id: payload.userId || payload.id || payload.sub,
            role: payload.role || 'admin',
            name: payload.name || 'User',
            email: payload.email || 'user@example.com'
          });
          return;
        } catch (decodeError) {
          console.error('Failed to decode token:', decodeError);
        }
      }
      // Replace or add endpoints as your backend provides
      const possibleEndpoints = [
        '/auth/me',
        '/user/me',
        '/users/me',
        '/auth/current',
        '/api/auth/me'
      ];
      for (const endpoint of possibleEndpoints) {
        try {
          const response = await api.get(endpoint);
          setCurrentUser(response.data.user || response.data);
          return;
        } catch (err) {
          if (err.response?.status !== 404) console.error(`Error with ${endpoint}:`, err);
          continue;
        }
      }
      setCurrentUser({ _id: 'default-admin', role: 'admin', name: 'Default Admin', email: 'admin@example.com' });
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      setCurrentUser({ _id: 'default-admin', role: 'admin', name: 'Default Admin', email: 'admin@example.com' });
    }
  };


  const fetchData = async () => {
    try {
      const [userRes, projectRes, assignmentRes] = await Promise.all([
        api.get('/users/getAlluser'),
        api.get('/projects/allProject'),
        api.get('/assignProject/allAssigned'),
      ]);
      const fetchedUsers = userRes.data.users || userRes.data.data || userRes.data;
      setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
      const fetchedProjects = projectRes.data.data || projectRes.data.projects || projectRes.data;
      setProjects(Array.isArray(fetchedProjects) ? fetchedProjects : []);
      const fetchedAssignments = assignmentRes.data.assignments || assignmentRes.data.data || assignmentRes.data;
      setAssignments(Array.isArray(fetchedAssignments) ? fetchedAssignments : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchData();
  }, []);

  // Only show users with role "user"
  const filteredUsers = users.filter(user => user.role === 'user' || user.role === 'User');

  // Only show projects assigned to the project manager, or all if admin
  const filteredProjects = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin' || currentUser.role === 'Admin') return projects;
    if (currentUser.role === 'projectManager' || currentUser.role === 'project_manager') {
      const userAssignedProjects = assignments
        .filter(assignment => assignment.user?._id === currentUser._id)
        .map(assignment => assignment.project?._id)
        .filter(Boolean);
      return projects.filter(projectData => userAssignedProjects.includes(projectData.project._id));
    }
    return projects;
  };

  // Only show assignments for managed projects, or all if admin
  const getFilteredAssignments = () => {
    if (!currentUser) return [];
    const validAssignments = assignments.filter(
      (a) => a.user && a.user._id && a.project && a.project._id
    );
    if (currentUser.role === 'admin' || currentUser.role === 'Admin') return validAssignments;
    if (currentUser.role === 'projectManager' || currentUser.role === 'project_manager') {
      const userAssignedProjects = assignments
        .filter(assignment => assignment.user?._id === currentUser._id)
        .map(assignment => assignment.project?._id)
        .filter(Boolean);
      return validAssignments.filter(assignment => userAssignedProjects.includes(assignment.project?._id));
    }
    return validAssignments;
  };

  const isUserAlreadyAssigned = (userId, projectId) => {
    const activeAssignments = getFilteredAssignments();
    return activeAssignments.some(assignment =>
      assignment.user?._id === userId && assignment.project?._id === projectId
    );
  };

  const getUserAssignedProjects = (userId) => {
    const activeAssignments = getFilteredAssignments();
    return activeAssignments
      .filter(assignment => assignment.user?._id === userId)
      .map(assignment => assignment.project?.name)
      .filter(Boolean);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedProject) {
      toast.error('Please select both user and project');
      return;
    }
    if (isUserAlreadyAssigned(selectedUser, selectedProject)) {
      const userName = getSelectedUserName();
      const projectName = getSelectedProjectName();
      toast.error(
        `${userName} is already assigned to "${projectName}"`,
        { duration: 4000, icon: '⚠️' }
      );
      return;
    }
    setAssigning(true);
    try {
      await api.post('/assignProject/assign', {
        userId: selectedUser,
        projectId: selectedProject,
      });
      toast.success('Project successfully assigned!');
      setSelectedUser('');
      setSelectedProject('');
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to assign project.';
      toast.error(errorMsg);
    } finally {
      setAssigning(false);
    }
  };

  const handleDeassign = async (assignmentId, userName, projectName) => {
    setDeassigning(prev => ({ ...prev, [assignmentId]: true }));
    try {
      await api.delete(`/assignProject/deassign/${assignmentId}`);
      toast.success(`Successfully removed ${userName} from "${projectName}"`);
      setConfirmDeassign(null);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to deassign project.';
      toast.error(errorMsg);
    } finally {
      setDeassigning(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const activeAssignments = getFilteredAssignments();
  const filteredAssignments = activeAssignments.filter((assignment) => {
    const matchesSearch =
      assignment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.project?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterBy === 'all') return matchesSearch;
    return matchesSearch;
  });

  const getSelectedUserName = () => {
    const user = filteredUsers.find(u => u._id === selectedUser);
    return user?.name || '';
  };

  const getSelectedProjectName = () => {
    const availableProjects = filteredProjects();
    const project = availableProjects.find(p => p.project._id === selectedProject);
    return project?.project.name || '';
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowMobileSearch(false);
  };

  const isCurrentSelectionDuplicate = selectedUser && selectedProject &&
    isUserAlreadyAssigned(selectedUser, selectedProject);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading project assignments...</p>
        </div>
      </div>
    );
  }

  const availableProjects = filteredProjects();

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* ✅ Temporary Role Switcher - Remove in Production */}
        {/* <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">Testing Mode - Current Role: <strong>{currentUser.role}</strong></p>
          <div className="flex gap-2">
            <button 
              onClick={() => handleRoleChange('admin')}
              className={`px-3 py-1 text-xs rounded ${currentUser?.role === 'admin' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              Admin
            </button>
            <button 
              onClick={() => handleRoleChange('projectManager')}
              className={`px-3 py-1 text-xs rounded ${currentUser?.role === 'projectManager' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              Project Manager
            </button>
          </div>
        </div> */}

        {/* Header stats */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-3 rounded-xl">
              <UserCheck className="w-8 h-8 text-purple-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Assignments</h1>
              <p className="text-gray-600 mt-1">
                Assign projects to users and manage existing assignments
                {currentUser.role !== 'admin' && currentUser.role !== 'Admin' && (
                  <span className="text-sm text-purple-600 font-medium"> (Project Manager View)</span>
                )}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Users</p>
                <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {currentUser.role === 'admin' || currentUser.role === 'Admin' ? 'Total Projects' : 'My Projects'}
                </p>
                <p className="text-2xl font-bold text-purple-600">{availableProjects.length}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <FolderOpen className="w-5 h-5 text-purple-700" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Assignments</p>
                <p className="text-2xl font-bold text-green-600">{activeAssignments.length}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
              <Plus className="w-5 h-5 text-purple-600" /> New Assignment
            </h2>
          </div>
          <form onSubmit={handleAssign} className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User *
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Choose user</option>

                  {users
                    .filter(user => {
                      // ✅ If current user is admin → show all except admins
                      if (currentUser.role === "admin") {
                        return user.role !== "admin";
                      }
                      // ✅ If current user is project_manager → show only users
                      if (currentUser.role === "project_manager") {
                        return user.role === "user";
                      }
                      return false;
                    })
                    .map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name || user.email} {user.role && `(${user.role})`}
                      </option>
                    ))
                  }
                </select>

                {filteredUsers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No users with role "user" found</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project *
                  {currentUser.role !== 'admin' && currentUser.role !== 'Admin' && (
                    <span className="text-xs text-gray-500">(Your assigned projects only)</span>
                  )}
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Choose project</option>
                  {availableProjects.map(data => (
                    <option key={data.project._id} value={data.project._id}>
                      {data.project.name}
                    </option>
                  ))}
                </select>
                {availableProjects.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {currentUser.role === 'admin' || currentUser.role === 'Admin'
                      ? 'No projects available'
                      : 'No projects assigned to you'
                    }
                  </p>
                )}
              </div>
            </div>

            {/* ✅ Show assignment preview or duplicate warning */}
            {selectedUser && selectedProject && (
              <div className={`mt-4 p-3 border rounded-lg flex items-center gap-2 ${isCurrentSelectionDuplicate
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-purple-200 bg-purple-50 text-purple-700'
                }`}>
                {isCurrentSelectionDuplicate ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-medium">
                      {getSelectedUserName()} is already assigned to "{getSelectedProjectName()}"
                    </span>
                  </>
                ) : (
                  <>
                    <strong>{getSelectedUserName()}</strong>
                    <ArrowRight className="w-4 h-4" />
                    <strong>{getSelectedProjectName()}</strong>
                  </>
                )}
              </div>
            )}

            {/* ✅ Show user's current assignments if user is selected */}
            {selectedUser && !selectedProject && (
              <div className="mt-4">
                {(() => {
                  const userProjects = getUserAssignedProjects(selectedUser);
                  if (userProjects.length > 0) {
                    return (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          {getSelectedUserName()} is currently assigned to:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {userProjects.map((projectName, index) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                            >
                              {projectName}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">
                        {getSelectedUserName()} has no current project assignments
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            <button
              type="submit"
              disabled={assigning || !selectedUser || !selectedProject || isCurrentSelectionDuplicate}
              className={`mt-6 px-6 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isCurrentSelectionDuplicate
                  ? 'bg-gray-400 text-white'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
            >
              {assigning && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {assigning ? "Assigning..." : isCurrentSelectionDuplicate ? "Already Assigned" : "Assign Project"}
            </button>
          </form>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                <Settings className="w-5 h-5 text-purple-600" /> Current Assignments
                <span className="text-sm font-normal text-gray-500">
                  ({filteredAssignments.length})
                </span>
              </h2>

              {/* Desktop Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users, emails, projects..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Mobile Search Button */}
              <div className="md:hidden flex items-center gap-2">
                <button
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Search Input */}
            {showMobileSearch && (
              <div className="md:hidden mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users, emails, projects..."
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Search Results Info */}
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                {filteredAssignments.length > 0 ? (
                  <span>Found {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''} matching "{searchTerm}"</span>
                ) : (
                  <span>No assignments found matching "{searchTerm}"</span>
                )}
              </div>
            )}
          </div>

          <div className="p-6">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No matching assignments' : 'No assignments found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? `No assignments match your search for "${searchTerm}"`
                    : currentUser.role === 'admin' || currentUser.role === 'Admin'
                      ? 'Start by assigning projects to users above'
                      : 'No assignments found for your projects'
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <table className="min-w-full border divide-y divide-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAssignments.map((assignment, idx) => (
                        <tr key={assignment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {assignment.user?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {assignment.user?.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {assignment.project?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setModalUser(assignment.user)}
                                className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors"
                              >
                                <Eye className="w-4 h-4" /> View
                              </button>
                              <button
                                onClick={() => setConfirmDeassign(assignment)}
                                disabled={deassigning[assignment._id]}
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deassigning[assignment._id] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <UserMinus className="w-4 h-4" />
                                )}
                                {deassigning[assignment._id] ? 'Removing...' : 'Remove'}
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
                  {filteredAssignments.map((assignment, idx) => (
                    <div key={assignment._id} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{assignment.user?.name}</h3>
                          <p className="text-sm text-gray-500">{assignment.user?.email}</p>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">#{idx + 1}</span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Assigned Project:</p>
                        <p className="font-medium text-gray-900">{assignment.project?.name}</p>
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <button
                          onClick={() => setModalUser(assignment.user)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" /> View Details
                        </button>
                        <button
                          onClick={() => setConfirmDeassign(assignment)}
                          disabled={deassigning[assignment._id]}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deassigning[assignment._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              Removing...
                            </>
                          ) : (
                            <>
                              <UserMinus className="w-4 h-4" />
                              Remove
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ✅ Confirmation Modal for Deassignment */}
        {confirmDeassign && (
          <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Deassignment</h3>
                </div>

                <p className="text-gray-600 mb-6">
                  Are you sure you want to remove <strong>{confirmDeassign.user?.name}</strong> from
                  project "<strong>{confirmDeassign.project?.name}</strong>"?
                </p>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmDeassign(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeassign(
                      confirmDeassign._id,
                      confirmDeassign.user?.name,
                      confirmDeassign.project?.name
                    )}
                    disabled={deassigning[confirmDeassign._id]}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deassigning[confirmDeassign._id] && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {deassigning[confirmDeassign._id] ? 'Removing...' : 'Yes, Remove'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <UserAssignmentsModal isOpen={!!modalUser} onClose={() => setModalUser(null)} user={modalUser} />
      </div>
    </div>
  );
};


export default AssignProjectPage;
