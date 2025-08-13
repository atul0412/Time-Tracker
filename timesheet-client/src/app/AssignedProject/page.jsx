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
  const [deassigning, setDeassigning] = useState({}); // Track deassigning state for each assignment
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy] = useState('all');
  const [modalUser, setModalUser] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [confirmDeassign, setConfirmDeassign] = useState(null); // For confirmation dialog

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

  // ✅ Check if user is already assigned to the project
  const isUserAlreadyAssigned = (userId, projectId) => {
    return activeAssignments.some(assignment => 
      assignment.user?._id === userId && assignment.project?._id === projectId
    );
  };

  // ✅ Get user projects for validation message
  const getUserAssignedProjects = (userId) => {
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

    // ✅ Check if user is already assigned to this project
    if (isUserAlreadyAssigned(selectedUser, selectedProject)) {
      const userName = getSelectedUserName();
      const projectName = getSelectedProjectName();
      
      toast.error(
        `${userName} is already assigned to "${projectName}"`,
        {
          duration: 4000,
          icon: '⚠️',
        }
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

  // ✅ New function to handle deassignment
  const handleDeassign = async (assignmentId, userName, projectName) => {
    setDeassigning(prev => ({ ...prev, [assignmentId]: true }));
    try {
      await api.delete(`/assignProject/deassign/${assignmentId}`);
      toast.success(`Successfully removed ${userName} from "${projectName}"`);
      setConfirmDeassign(null);
      fetchData(); // Refresh the data
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to deassign project.';
      toast.error(errorMsg);
    } finally {
      setDeassigning(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  // ✅ Only include assignments where BOTH user and project still exist
  const activeAssignments = assignments.filter(
    (a) => a.user && a.user._id && a.project && a.project._id
  );

  // Search filter
  const filteredAssignments = activeAssignments.filter((assignment) => {
    const matchesSearch = 
      assignment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.project?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterBy === 'all') return matchesSearch;
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

  const clearSearch = () => {
    setSearchTerm('');
    setShowMobileSearch(false);
  };

  // ✅ Check if current selection is already assigned
  const isCurrentSelectionDuplicate = selectedUser && selectedProject && 
    isUserAlreadyAssigned(selectedUser, selectedProject);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading project assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header stats */}
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
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-purple-600">{projects.length}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <FolderOpen className="w-5 h-5 text-purple-700" />
              </div>
            </div>

            {/* ✅ Active Assignments count now checks both user and project */}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Select User *</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Choose user</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Project *</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                  value={selectedProject} 
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Choose project</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ✅ Show assignment preview or duplicate warning */}
            {selectedUser && selectedProject && (
              <div className={`mt-4 p-3 border rounded-lg flex items-center gap-2 ${
                isCurrentSelectionDuplicate 
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
              className={`mt-6 px-6 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isCurrentSelectionDuplicate
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
                    : 'Start by assigning projects to users above'
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
