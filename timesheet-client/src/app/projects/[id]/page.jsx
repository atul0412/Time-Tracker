'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import { Pencil, Trash2 } from 'lucide-react';
import { exportTimesheetToExcel } from '../../../lib/exportToExcel';
import { formatDateToReadable } from '../../../lib/dateFormate';
import { useAuth } from '../../../context/AuthContext';


export default function ProjectDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [editingEntry, setEditingEntry] = useState(null); // timesheet
  const [formData, setFormData] = useState({});

  const [addingEntry, setAddingEntry] = useState(false);
  const [addFormData, setAddFormData] = useState({});

  const [editingProject, setEditingProject] = useState(false); // project
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    fields: [],
  });

  const [userRole, setUserRole] = useState('');

  // At the top of your component (before return)
  const [errors, setErrors] = useState({});


  const groupByDate = (entries) => {
    return entries.reduce((acc, entry) => {
      const date = formatDateToReadable(entry.date);
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

    const loadUserRole = () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        setUserRole(user?.role || '');
      } catch {
        setUserRole('');
      }
    };

    if (id) fetchProjectAndTimesheets();
    loadUserRole();
  }, [id]);


  useEffect(() => {
    if (addingEntry && project?.fields) {
      const initialData = {};

      project.fields.forEach((field) => {
        if (field.fieldType === 'Date') {
          initialData[field.fieldName] = new Date().toISOString().split('T')[0];
        } else {
          initialData[field.fieldName] = '';
        }
      });

      setAddFormData(initialData);
    }
  }, [addingEntry, project]);


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
  const openAddModal = () => {
    const defaultData = {};
    project.fields?.forEach((field) => {
      defaultData[field.fieldName] = '';
    });
    setAddFormData(defaultData);
    setAddingEntry(true);
  };

  const closeAddModal = () => {
    setAddingEntry(false);
    setAddFormData({});
  };

  const handleAddSubmit = async () => {
    try {
      const res = await api.post(`/timesheets/create-timesheet`, {
        project: id,
        data: addFormData,
      });
      toast.success('Timesheet added');
      setTimesheets((prev) => [...prev, res.data]);
      closeAddModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add timesheet');
    }
  };


  if (loading) return <p className="p-8 text-center text-gray-500">Loading project...</p>;
  if (error) return <p className="p-8 text-center text-red-600 font-semibold">{error}</p>;
  if (!project) return <p className="p-8 text-center">No project found</p>;

  const grouped = groupByDate(timesheets);

  return (
    <div className=" px-4 py-10 sm:px-6 lg:px-20 relative">
      <div className="max-w-5xl mx-auto">
        {/* Project Info */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-black">{project.name}</h1>

          <div className="flex flex-wrap gap-3 mt-1 sm:mt-0">
            <button
              onClick={openAddModal}
              className="bg-purple-950 text-white px-4 py-2 rounded-md hover:bg-purple-800 transition"
            >
              + Add Timesheet
            </button>
            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => {
                    setProjectFormData({
                      name: project.name || '',
                      description: project.description || '',
                      fields: project.fields || [],
                    });
                    setEditingProject(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition"
                >
                  <Pencil size={14} className="mr-1" />
                </button>

                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-500 transition disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button onClick={() => exportTimesheetToExcel(project, timesheets)}
              className="bg-green-800 text-white px-4 py-2 rounded-md hover:bg-green-950 transition">
              Export Timesheets
            </button>
          </div>
        </div>

        <p className="text-gray-700 mt-2 mb-5">{project.description}</p>

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
                  <div className="hidden md:block overflow-x-auto rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                      <thead className="bg-gray-50">
                        <tr>
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
                            {allKeys.map((key) => {
                              const value = entry.data?.[key];
                              const displayValue =
                                key.toLowerCase().includes('date') && value
                                  ? formatDateToReadable(value)
                                  : value?.toString() || '-';

                              return (
                                <td key={key} className="px-4 py-2 text-gray-600">
                                  {displayValue}
                                </td>
                              );
                            })}
                            <td className="px-4 py-2 space-x-2">
                              {(user?.role === "admin" || entry.user === user?.id || entry.user?._id === user?.id) && (
                                <>
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
                                </>
                              )}
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Accordion View (Mobile) */}
                  <div className="block md:hidden space-y-4">
                    {entries.map((entry) => (
                      <div
                        key={entry._id}
                        className="border border-purple-300 rounded-xl shadow-sm bg-white overflow-hidden"
                      >
                        <details className="p-4 group">
                          <summary className="cursor-pointer font-semibold text-gray-900 text-base list-none flex justify-between items-center">
                            <span>
                              {entry.data?.['task']
                                ? entry.data['task'].split(' ').slice(0, 7).join(' ') +
                                (entry.data['task'].split(' ').length > 7 ? '...' : '')
                                : entry.data?.['Task']
                                  ? entry.data['Task'].split(' ').slice(0, 7).join(' ') +
                                  (entry.data['Task'].split(' ').length > 7 ? '...' : '')
                                  : 'No task specified'}
                            </span>

                            <span className="text-sm text-purple-900 group-open:rotate-180 transition-transform">
                              ▼
                            </span>
                          </summary>

                          <div className="mt-3 space-y-2 text-sm text-gray-800">
                            {allKeys.map((key) => {
                              const value = entry.data?.[key];
                              const displayValue =
                                key.toLowerCase().includes('date') && value
                                  ? formatDateToReadable(value)
                                  : value?.toString() || '-';

                              return (
                                <p key={key} className="flex justify-between">
                                  <span className="capitalize font-bold  text-black">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span>{displayValue}</span>
                                </p>
                              );
                            })}

                            {(user?.role === "admin" || entry.user === user?.id || entry.user?._id === user?.id) && (
                              <div className="mt-4 flex justify-end gap-4">
                                <button
                                  onClick={() => openEditModal(entry)}
                                  className="inline-flex items-center text-purple-700 text-sm font-medium hover:underline"
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
                            )}

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

      {/* Timesheet Edit Modal */}
     {editingEntry && (
  <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 px-4 sm:px-0">
    <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg animate-fadeIn overflow-y-auto max-h-[70vh]">
      <h3 className="text-2xl font-bold text-purple-800 mb-6 text-center sm:text-left">
        Edit Timesheet Entry
      </h3>

      <form className="space-y-4">
        {/* Editable Date */}
        {formData.date && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entry Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              value={formData.date.slice(0, 10)} // Format: YYYY-MM-DD
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  date: e.target.value,
                }))
              }
            />
          </div>
        )}

        {/* Editable fields (excluding 'date') */}
        {Object.entries(formData).map(([key, value]) => {
          if (key === 'date') return null;

          const isTaskField = key.toLowerCase() === 'task';

          const inputType =
            typeof value === 'number' || key.toLowerCase().includes('hours')
              ? 'number'
              : key.toLowerCase().includes('date')
              ? 'date'
              : 'text';

          return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                {key.replace(/_/g, ' ')}
              </label>

              {isTaskField ? (
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 h-28 resize-none"
                  value={value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                />
              ) : (
                <input
                  type={inputType}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  value={value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [key]: inputType === 'number' ? Number(e.target.value) : e.target.value,
                    }))
                  }
                />
              )}
            </div>
          );
        })}
      </form>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
        <button
          onClick={closeEditModal}
          className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-red-300 text-gray-700 font-medium w-full sm:w-auto"
        >
          Cancel
        </button>
        <button
          onClick={handleEditSubmit}
          className="px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-medium w-full sm:w-auto"
        >
          Update
        </button>
      </div>
    </div>
  </div>
)}



      {/* Timesheet Add Modal */}
  {addingEntry && (
  <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
      <h3 className="text-xl sm:text-2xl font-bold text-purple-800 mb-6 text-center">
        Add Timesheet Entry
      </h3>

      <form className="space-y-4">
        {/* Developer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Developer Name
          </label>
          <input
            type="text"
            value={user?.name || ""}
            readOnly
            className="w-full px-3 py-2 border rounded-lg shadow-sm bg-gray-100 text-gray-700 focus:outline-none "
          />
        </div>

        {project.fields?.map((field) => {
          const isDate = field.fieldType === "Date";
          const fieldValue = addFormData[field.fieldName];
          const isTaskField = field.fieldName.toLowerCase().includes("task");

          const inputValue =
            fieldValue !== undefined
              ? isDate && !fieldValue
                ? new Date().toISOString().split("T")[0]
                : fieldValue
              : isDate
              ? new Date().toISOString().split("T")[0]
              : "";

          return (
            <div key={field.fieldName}>
              <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                {field.fieldName.replace(/_/g, " ")}
              </label>

              {field.fieldName === "Frontend/Backend" ? (
                <select
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                    errors?.[`fieldType_${field.fieldName}`]
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-purple-800"
                  }`}
                  value={inputValue}
                  onChange={(e) =>
                    setAddFormData((prev) => ({
                      ...prev,
                      [field.fieldName]: e.target.value,
                    }))
                  }
                >
                  <option value="">Select</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                </select>
              ) : isTaskField ? (
                <textarea
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm resize-none focus:outline-none focus:ring-2 ${
                    errors?.[`fieldType_${field.fieldName}`]
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-purple-800"
                  }`}
                  value={inputValue}
                  onChange={(e) =>
                    setAddFormData((prev) => ({
                      ...prev,
                      [field.fieldName]: e.target.value,
                    }))
                  }
                />
              ) : (
                <input
                  type={
                    field.fieldType === "Number"
                      ? "number"
                      : isDate
                      ? "date"
                      : "text"
                  }
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                    errors?.[`fieldType_${field.fieldName}`]
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-purple-800"
                  }`}
                  value={inputValue}
                  onChange={(e) =>
                    setAddFormData((prev) => ({
                      ...prev,
                      [field.fieldName]: e.target.value,
                    }))
                  }
                />
              )}
            </div>
          );
        })}
      </form>

      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
        <button
          onClick={closeAddModal}
          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-gray-200 hover:bg-red-300 text-gray-700 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleAddSubmit}
          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-medium"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
)}





      {/* Project Edit Modal */}

     {editingProject && (
  <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 px-2">
    <div className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-lg shadow-lg overflow-y-auto max-h-[70vh]">
      <h2 className="text-xl sm:text-2xl font-semibold text-purple-800 mb-6">Edit Project</h2>

      <form className="space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            value={projectFormData.name}
            onChange={(e) =>
              setProjectFormData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-2 h-28 resize-none"
            value={projectFormData.description}
            onChange={(e) =>
              setProjectFormData((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>

        {/* Editable Fields (excluding default fields) */}
        {projectFormData.fields
          ?.filter(
            (field) =>
              !["task", "date", "workingHours", "Frontend/Backend"].includes(
                field.fieldName
              )
          )
          .map((field, index) => (
            <div key={index} className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                {field.fieldName.replace(/_/g, ' ')}
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Field Name Input */}
                <input
                  type="text"
                  placeholder="Field Name"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                  value={field.fieldName}
                  onChange={(e) => {
                    const updated = [...projectFormData.fields];
                    updated[index].fieldName = e.target.value;
                    setProjectFormData((prev) => ({
                      ...prev,
                      fields: updated,
                    }));
                  }}
                />

                {/* Field Type Selector */}
                <select
                  className="w-full sm:w-44 border border-gray-300 rounded-lg px-4 py-2"
                  value={field.fieldType}
                  onChange={(e) => {
                    const updated = [...projectFormData.fields];
                    updated[index].fieldType = e.target.value;
                    setProjectFormData((prev) => ({
                      ...prev,
                      fields: updated,
                    }));
                  }}
                >
                  <option value="String">String</option>
                  <option value="Number">Number</option>
                  <option value="Date">Date</option>
                  <option value="Boolean">Boolean</option>
                </select>

                {/* Delete Field Button */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...projectFormData.fields];
                    updated.splice(index, 1);
                    setProjectFormData((prev) => ({
                      ...prev,
                      fields: updated,
                    }));
                  }}
                  className="text-red-500 hover:text-red-700 self-center sm:self-auto"
                  title="Delete Field"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
      </form>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end sm:space-x-4 space-y-3 sm:space-y-0 mt-8">
        <button
          onClick={() => setEditingProject(false)}
          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-gray-200 hover:bg-red-300 text-gray-700 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            try {
              await api.put(`/projects/${id}`, projectFormData);
              toast.success("Project updated");
              setProject((prev) => ({
                ...prev,
                ...projectFormData,
              }));
              setEditingProject(false);
            } catch (err) {
              toast.error(
                err?.response?.data?.message || "Failed to update project"
              );
            }
          }}
          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}




    </div>
  );
}
