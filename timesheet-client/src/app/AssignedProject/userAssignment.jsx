import { useState, useEffect } from 'react';
import { X, FolderOpen, User, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import api from '../../lib/axios';

const UserAssignmentsModal = ({ isOpen, onClose, user }) => {
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAssignedProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assignProject/user/${user._id}`);
        setAssignedProjects(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch user projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedProjects();
  }, [user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <User className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.name}'s Projects
                </h2>
                <p className="text-gray-500 text-sm mt-1">View all assigned projects</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="p-6 border-b border-gray-200">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-3">
                <User className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">{user.name}</h3>
                <p className="text-purple-700 text-sm">{user.email}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-purple-600">
                  <span className={`px-2 py-1 rounded-full ${
                    user.role === 'admin' ? 'bg-purple-200' : 'bg-blue-200 text-blue-700'
                  }`}>
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {assignedProjects.length} project{assignedProjects.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Assigned Projects</h3>
            {assignedProjects.length > 0 && (
              <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                {assignedProjects.length} active
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading projects...</span>
            </div>
          ) : assignedProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Projects Assigned</h4>
              <p className="text-gray-500">This user hasn't been assigned to any projects yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedProjects.map((assignment) => {
                const project = assignment.project;
                return (
                  <div
                    key={assignment._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
                          <FolderOpen className="w-5 h-5 text-purple-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                            {project?.name || 'Untitled Project'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {project?.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Assigned {assignment.createdAt 
                                ? new Date(assignment.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : 'Recently'
                              }
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Project Link */}
                      <Link 
                        href={`/projects/${project?._id}`}
                        className="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                        title="View project details"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {assignedProjects.length > 0 ? (
                <>Showing {assignedProjects.length} project{assignedProjects.length !== 1 ? 's' : ''}</>
              ) : (
                <>No active assignments</>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAssignmentsModal;
