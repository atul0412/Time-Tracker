'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Pencil, Trash2 } from 'lucide-react';

export default function ProjectDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [editingEntry, setEditingEntry] = useState(null); // for modal
  const [formData, setFormData] = useState({});

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

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/projects/delete/${id}`);
      toast.success('Project deleted successfully');
      router.push('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const handleTimesheetDelete = async (entryId) => {
    try {
      await api.delete(`/timesheets/${entryId}`);
      toast.success('Timesheet deleted');
      setTimesheets((prev) => prev.filter((t) => t._id !== entryId));
    } catch (err) {
      toast.error('Failed to delete timesheet');
    }
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setFormData(entry.data || {});
  };

  const closeEditModal = () => {
    setEditingEntry(null);
    setFormData({});
  };

  const handleEditSubmit = async () => {
    try {
      await api.put(`/timesheets/${editingEntry._id}`, {
        data: formData,
      });
      toast.success('Timesheet updated');
      setTimesheets((prev) =>
        prev.map((t) => (t._id === editingEntry._id ? { ...t, data: formData } : t))
      );
      closeEditModal();
    } catch (err) {
      toast.error('Failed to update timesheet');
    }
  };

  if (loading) return <p className="p-8 text-center text-gray-500">Loading project...</p>;
  if (error) return <p className="p-8 text-center text-red-600 font-semibold">{error}</p>;
  if (!project) return <p className="p-8 text-center">No project found</p>;

  const grouped = groupByDate(timesheets);

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-20 relative">
      <div className="max-w-5xl mx-auto">
        {/* Project Info */}
        <div className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">{project.name}</h1>
            <p className="text-gray-700">{project.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push(`/projects/${id}/timesheet/create`)}
              className="bg-purple-950 text-white px-4 py-2 rounded-md hover:bg-purple-800 transition"
            >
              + Add Timesheet
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-500 transition disabled:opacity-50"
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </div>

        {/* Timesheets */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Timesheet Entries</h2>

          {timesheets.length === 0 ? (
            <p className="text-gray-600 italic">No timesheet entries yet.</p>
          ) : (
            Object.entries(grouped).map(([date, entries]) => {
              const allKeys = Array.from(
                new Set(entries.flatMap((entry) => Object.keys(entry.data || {})))
              );

              return (
                <div key={date} className="space-y-4">
                  {/* Table View */}
                  <div className="hidden md:block overflow-x-auto  rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-gray-700">User</th>
                          {allKeys.map((key) => (
                            <th key={key} className="px-4 py-2 font-semibold text-gray-700">
                              {key}
                            </th>
                          ))}
                          <th className="px-4 py-2 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {entries.map((entry) => (
                          <tr key={entry._id}>
                            <td className="px-4 py-2 text-gray-700">{entry.user?.name || 'N/A'}</td>
                            {allKeys.map((key) => (
                              <td key={key} className="px-4 py-2 text-gray-600">
                                {entry.data?.[key]?.toString() || '-'}
                              </td>
                            ))}
                            <td className="px-4 py-2 space-x-2">
                              <button
                                onClick={() => openEditModal(entry)}
                                className="inline-flex items-center text-purple-800 hover:underline font-medium"
                              >
                                <Pencil size={16} className="mr-1" />
                              </button>
                              <button
                                onClick={() => handleTimesheetDelete(entry._id)}
                                className="inline-flex items-center text-red-600 hover:underline font-medium"
                              >
                                <Trash2 size={16} className="mr-1" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Accordion View */}
                  <div className="block md:hidden space-y-4">
                    {entries.map((entry) => (
                      <div
                        key={entry._id}
                        className="border border-gray-200 rounded-lg shadow-md bg-white"
                      >
                        <details className="p-4">
                          <summary className="cursor-pointer font-medium text-gray-800">
                            {entry.user?.name || 'N/A'}
                          </summary>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            {allKeys.map((key) => (
                              <p key={key}>
                                <span className="font-semibold">{key}:</span>{' '}
                                {entry.data?.[key]?.toString() || '-'}
                              </p>
                            ))}
                            <div className="mt-3 flex gap-3">
                              <button
                                onClick={() => openEditModal(entry)}
                                className="inline-flex items-center text-purple-800 text-sm font-medium hover:underline"
                              >
                                <Pencil size={14} className="mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleTimesheetDelete(entry._id)}
                                className="inline-flex items-center text-red-600 text-sm font-medium hover:underline"
                              >
                                <Trash2 size={14} className="mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
  <div className="fixed inset-0 bg-black bg-opacity-0z-10 flex items-center justify-center">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-fadeIn">
      <h3 className="text-2xl font-bold text-purple-800 mb-6">Edit Timesheet Entry</h3>

      <form className="space-y-4">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 capitalize mb-1">{key.replace(/_/g, ' ')}</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData[key]}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            />
          </div>
        ))}
      </form>

      <div className="flex justify-end space-x-4 mt-8">
        <button
          onClick={closeEditModal}
          className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition"
        >
          Cancel
        </button>
        <button
          onClick={handleEditSubmit}
          className="px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-medium transition"
        >
          Update
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
