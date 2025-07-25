'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function ProjectDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const groupByDate = (entries) => {
    return entries.reduce((acc, entry) => {
      const date = new Date(entry.date).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    }, {});
  };

  useEffect(() => {
    const fetchProjectAndTimesheets = async () => {
      try {
        const [projectRes, timesheetRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/timesheets/project/${id}`),
        ]);
        setProject(projectRes.data.data || projectRes.data);
        setTimesheets(timesheetRes.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load project or timesheets');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProjectAndTimesheets();
  }, [id]);

  if (loading) return <p className="p-8 text-center text-gray-500">Loading project...</p>;
  if (error) return <p className="p-8 text-center text-red-600 font-semibold">{error}</p>;
  if (!project) return <p className="p-8 text-center">No project found</p>;

  const grouped = groupByDate(timesheets);

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-20 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Project Info */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h1 className="text-3xl font-bold to-black mb-2">{project.name}</h1>
          <p className="text-gray-700 mb-4">{project.description}</p>

          {/* Add Timesheet Button */}
          <button
            onClick={() => router.push(`/projects/${id}/timesheet/create`)}
            className="bg-purple-950 text-white px-4 py-2 rounded-md hover:bg-purple-950 transition"
          >
            + Add Timesheet
          </button>
        </div>

        {/* Timesheets */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Timesheet Entries</h2>

          {timesheets.length === 0 ? (
            <p className="text-gray-600 italic">No timesheet entries yet.</p>
          ) : (
            Object.entries(grouped).map(([date, entries]) => (
              <div key={date} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  
                  {entries.map((entry) => (
                    <div
                      key={entry._id}
                      className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
                    >
                      <p className="text-sm text-gray-500 mb-1">
                        <span className="font-semibold">User:</span> {entry.user?.name || 'N/A'}
                      </p>
                      {Object.entries(entry.data || {}).map(([key, value]) => (
                        <p key={key} className="text-sm text-gray-500 mb-1">
                          <span className="font-semibold">{key}:</span> {value?.toString()}
                        </p>
                      ))}
                    </div>
                  ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
