// pages/admin/assign-project.jsx
'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/axios'; // your API wrapper

const AssignProjectPage = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, projectRes] = await Promise.all([
          api.get('/users/getAlluser'), // ✅ Make sure this returns all users
          api.get('/'), // ✅ Returns all projects
        ]);
        setUsers(userRes.data);
        setProjects(projectRes.data);
      } catch (error) {
        console.error('Failed to fetch users or projects', error);
      }
    };

    fetchData();
  }, []);

  const handleAssign = async () => {
    try {
      if (!selectedUser || !selectedProject) {
        setMessage('Please select both a user and a project.');
        return;
      }

      await api.put('/projects/assign-project', {
        userId: selectedUser,
        projectId: selectedProject,
      });

      setMessage('✅ Project successfully assigned!');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to assign project.');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-semibold mb-6 text-center">Assign Project to User</h2>

      <div className="mb-4">
        <label className="block font-medium mb-1">Select User:</label>
        <select
          className="w-full border rounded p-2"
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

      <div className="mb-6">
        <label className="block font-medium mb-1">Select Project:</label>
        <select
          className="w-full border rounded p-2"
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

      <button
        onClick={handleAssign}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Assign Project
      </button>

      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  );
};

export default AssignProjectPage;

