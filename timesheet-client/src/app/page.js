'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects/allproject');
        setProjects(res.data.data || []); // Adjust based on your backend response
      } catch (err) {
        setError(err?.response?.data?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 to-blue-100 px-4 py-8 sm:px-6 lg:px-16">

      {loading && <p className="text-center text-gray-500 text-lg">Loading projects...</p>}
      {error && <p className="text-center text-red-600 text-lg">{error}</p>}
      {!loading && !error && projects.length === 0 && (
        <p className="text-center text-gray-500 text-lg">No projects available.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project) => (
          <div
            key={project._id}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-2xl font-semibold text-blue-700 mb-2">{project.name}</h2>
              <p className="text-gray-600 mb-4">{project.description}</p>
            </div>
            <div className="mt-auto">
              <p className="text-sm text-gray-400">
                Created by: <span className="font-medium">{project.createdBy?.name || 'Unknown'}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}