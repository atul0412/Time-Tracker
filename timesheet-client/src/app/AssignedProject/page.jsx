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
  Filter,
  ArrowRight
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  
  const [modalUser, setModalUser] = useState(null);

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
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    
    if (!selectedUser || !selectedProject) {
      toast.error('Please select both user and project');
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

  // Filter assignments based on search and filter
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.project?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    
    // You can add more filter logic here based on your needs
    return matchesSearch;
  });

  const getSelectedUserName = () => {
    const user = users.find(u => u._id === selectedUser);
    return user?.name || '';
  };

  const getSelectedProjectName = () => {
    const project = projects.find(p => p._id === selectedProject);
    return project?.name || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br  flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading project assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br ">
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-3 rounded-xl">
              <UserCheck className="w-8 h-8 text-purple-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Assignments</h1>
              <p className="text-gray-600 mt-1">Assign projects to users and manage existing assignments</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-blue-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-purple-600">{projects.length}</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-purple-700" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Assignments</p>
                  <p className="text-2xl font-bold text-green-600">{assignments.length}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              New Assignment
            </h2>
            <p className="text-gray-600 text-sm mt-1">Assign a project to a user</p>
          </div>

          <form onSubmit={handleAssign} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    required
                  >
                    <option value="">Choose a user to assign project</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name || user.email} 
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project *
                </label>
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    required
                  >
                    <option value="">Choose a project to assign</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Preview Assignment */}
            {selectedUser && selectedProject && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800 mb-2">Assignment Preview</h3>
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <span className="font-medium">{getSelectedUserName()}</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">{getSelectedProjectName()}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={assigning || !selectedUser || !selectedProject}
                className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {assigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Assign Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Current Assignments
                  {assignments.length > 0 && (
                    <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full">
                      {assignments.length}
                    </span>
                  )}
                </h2>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-64"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                {assignments.length === 0 ? (
                  <>
                    <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments yet</h3>
                    <p className="text-gray-500 mb-6">Start by assigning your first project to a user.</p>
                  </>
                ) : (
                  <>
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching assignments</h3>
                    <p className="text-gray-500">Try adjusting your search criteria.</p>
                  </>
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
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAssignments.map((assignment, index) => (
                        <tr key={assignment._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-purple-100 rounded-full p-2 mr-3">
                                <Users className="w-4 h-4 text-purple-700" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {assignment.user?.name || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {assignment.user?.email || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-green-100 rounded-full p-1 mr-2">
                                <FolderOpen className="w-3 h-3 text-green-700" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {assignment.project?.name || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setModalUser(assignment.user)}
                              className="text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1"
                              title="View user assignments"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="block md:hidden space-y-4">
                  {filteredAssignments.map((assignment, index) => (
                    <div
                      key={assignment._id}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 rounded-full p-2">
                            <Users className="w-4 h-4 text-purple-700" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {assignment.user?.name || 'N/A'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {assignment.user?.email || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {assignment.project?.name || 'N/A'}
                          </span>
                        </div>
                        <button
                          onClick={() => setModalUser(assignment.user)}
                          className="text-purple-600 hover:text-purple-800 transition-colors text-sm font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Component */}
        <UserAssignmentsModal
          isOpen={!!modalUser}
          onClose={() => setModalUser(null)}
          user={modalUser}
        />
      </div>
    </div>
  );
};

export default AssignProjectPage;
