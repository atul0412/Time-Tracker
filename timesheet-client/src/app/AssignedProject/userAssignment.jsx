import { useState, useEffect } from 'react';
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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-red-600 text-xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-semibold mb-4">
          Projects assigned to {user.name}
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : assignedProjects.length === 0 ? (
          <p className="text-gray-500">No assigned projects for this user.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-2">
            {assignedProjects.map((item) => (
              <li key={item._id}>
                <span className="font-medium">{item.project.name}</span> — {item.project.description}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserAssignmentsModal;
