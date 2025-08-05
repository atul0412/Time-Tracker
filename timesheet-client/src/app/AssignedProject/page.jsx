'use client';
import { useEffect, useState } from 'react';
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
  
 const [modalUser, setModalUser] = useState(null); 

  const fetchData = async () => {
    try {
      const [userRes, projectRes, assignmentRes] = await Promise.all([
        api.get('/users/getAlluser'),
        api.get('/projects/allProject'),
        api.get('/assignProject/allAssigned'), // <-- Adjust this if your endpoint is different
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

  const handleAssign = async () => {
    try {
      if (!selectedUser || !selectedProject) {
        toast.error('Please select required fields');
        return;
      }

      await api.post('/assignProject/assign', {
        userId: selectedUser,
        projectId: selectedProject,
      });

      toast.success('Project successfully assigned!');
      setSelectedUser('');
      setSelectedProject('');
      fetchData(); // Refresh the assignment list
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to assign project.';
      toast.error(`${errorMsg}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-16 bg-white shadow-xl rounded-lg p-8">
      <h2 className="text-3xl font-bold text-center text-purple-950 mb-8">Assign Project to User</h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading users, projects, and assignments...</p>
      ) : (
        <>
          {/* Assignment Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAssign();
            }}
            className="space-y-6 mb-10"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">User</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">-- Choose a user --</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Project</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">-- Choose a project --</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-purple-800 text-white font-semibold py-3 rounded-lg hover:bg-purple-950 transition duration-300"
              >
                Assign Project
              </button>
            </div>
          </form>

          {/* Assigned Projects Table */}
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Assigned Projects</h3>
          {assignments.length === 0 ? (
            <p className="text-gray-500">No assignments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="shadow-md rounded-lg border border-gray-200">
                <table className="min-w-full table-auto text-sm text-left text-gray-700">
                  <thead className="bg-purple-100 text-purple-900 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-3 border-b">#</th>
                      <th className="px-6 py-3 border-b">User Name</th>
                      <th className="px-6 py-3 border-b">User Email</th>
                      <th className="px-6 py-3 border-b">Project Name</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {assignments.map((assignment, index) => (
                      <tr
                        key={assignment._id}
                        className="hover:bg-purple-50 transition duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800"
                          onClick={() => setModalUser(assignment.user)}
                          >
                          {assignment.user?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {assignment.user?.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {assignment.project?.name || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
            {/* ✅ Modal Component */}
          <UserAssignmentsModal
            isOpen={!!modalUser}
            onClose={() => setModalUser(null)}
            user={modalUser}
          />
        </>
      )}
    </div>
  );
};

export default AssignProjectPage;
