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
  XCircle
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
  const [filterBy] = useState('all');
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
    <div className="min-h-screen bg-gradient-to-br ">
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
                <label className="block text-sm font-medium">Select User *</label>
                <select className="w-full border rounded px-3 py-2" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                  <option value="">Choose user</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Select Project *</label>
                <select className="w-full border rounded px-3 py-2" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                  <option value="">Choose project</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedUser && selectedProject && (
              <div className="mt-4 p-3 border rounded bg-purple-50 text-purple-700">
                <strong>{getSelectedUserName()}</strong> <ArrowRight className="inline w-4 h-4" /> <strong>{getSelectedProjectName()}</strong>
              </div>
            )}

            <button type="submit" disabled={assigning} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded flex items-center gap-2">
              {assigning && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {assigning ? "Assigning..." : "Assign Project"}
            </button>
          </form>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b flex justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" /> Current Assignments
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="p-6">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-10">
                <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">No assignments found</p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <table className="min-w-full border divide-y divide-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.map((assignment, idx) => (
                        <tr key={assignment._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{idx + 1}</td>
                          <td className="px-4 py-2">{assignment.user?.name}</td>
                          <td className="px-4 py-2 text-gray-500">{assignment.user?.email}</td>
                          <td className="px-4 py-2">{assignment.project?.name}</td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => setModalUser(assignment.user)} className="text-purple-600 hover:underline flex items-center gap-1">
                              <Eye className="w-4 h-4" /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="block md:hidden space-y-4">
                  {filteredAssignments.map((assignment, idx) => (
                    <div key={assignment._id} className="p-4 border rounded-lg">
                      <div className="flex justify-between mb-2">
                        <div>
                          <p className="font-semibold">{assignment.user?.name}</p>
                          <p className="text-sm text-gray-500">{assignment.user?.email}</p>
                        </div>
                        <span className="text-gray-400">#{idx + 1}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">{assignment.project?.name}</span>
                        <button onClick={() => setModalUser(assignment.user)} className="text-purple-600 text-sm flex items-center gap-1">
                          <Eye className="w-4 h-4" /> View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <UserAssignmentsModal isOpen={!!modalUser} onClose={() => setModalUser(null)} user={modalUser} />
      </div>
    </div>
  );
};

export default AssignProjectPage;
