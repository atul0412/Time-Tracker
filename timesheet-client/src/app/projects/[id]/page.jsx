'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import {
  Pencil,
  Trash2,
  Download,
  Plus,
  Calendar,
  Clock,
  User,
  FileText,
  Settings,
  ArrowLeft,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
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

  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const [addingEntry, setAddingEntry] = useState(false);
  const [addFormData, setAddFormData] = useState({});
  const [addLoading, setAddLoading] = useState(false);

  const [editingProject, setEditingProject] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    fields: [],
  });
  const [editProjectLoading, setEditProjectLoading] = useState(false);

  // Delete confirmation states
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    type: '', // 'project' or 'timesheet'
    id: null,
    title: '',
    message: '',
    loading: false
  });

  const [userRole, setUserRole] = useState('');
  const [errors, setErrors] = useState({});

  const groupByDate = (entries) => {
    return entries.reduce((acc, entry) => {
      const date = formatDateToReadable(entry.data?.date || entry.date);
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
        const sortedTimesheets = (timesheetRes.data || []).sort(
          (a, b) => new Date(a.data?.date) - new Date(b.data?.date)
        );
        setTimesheets(sortedTimesheets);
        console.log(sortedTimesheets);
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
      initialData["Developer Name"] = user?.name;
      setAddFormData(initialData);
    }
  }, [addingEntry, project]);

  // Show delete confirmation
  const showDeleteConfirmation = (type, itemId, title, message) => {
    setDeleteConfirmation({
      show: true,
      type,
      id: itemId,
      title,
      message,
      loading: false
    });
  };

  // Hide delete confirmation
  const hideDeleteConfirmation = () => {
    setDeleteConfirmation({
      show: false,
      type: '',
      id: null,
      title: '',
      message: '',
      loading: false
    });
  };

  // Handle confirmed deletion
  const handleConfirmedDelete = async () => {
    const { type, id: itemId } = deleteConfirmation;

    setDeleteConfirmation(prev => ({ ...prev, loading: true }));

    try {
      if (type === 'project') {
        await api.delete(`/projects/delete/${itemId}`);
        toast.success('Project deleted successfully');
        router.push('/');
      } else if (type === 'timesheet') {
        await api.delete(`/timesheets/${itemId}`);
        toast.success('Timesheet deleted');
        setTimesheets((prev) => prev.filter((t) => t._id !== itemId));
      }
      hideDeleteConfirmation();
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to delete ${type}`);
    } finally {
      setDeleteConfirmation(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDelete = () => {
    showDeleteConfirmation(
      'project',
      id,
      'Delete Project',
      `Are you sure you want to delete "${project?.name}"? This action cannot be undone and will also delete all associated timesheet entries.`
    );
  };

  const handleTimesheetDelete = (entryId) => {
    showDeleteConfirmation(
      'timesheet',
      entryId,
      'Delete Timesheet Entry',
      'Are you sure you want to delete this timesheet entry? This action cannot be undone.'
    );
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
      setEditLoading(true);
      await api.put(`/timesheets/${editingEntry._id}`, { data: formData });
      toast.success('Timesheet updated');
      setTimesheets((prev) =>
        prev.map((t) => (t._id === editingEntry._id ? { ...t, data: formData } : t))
      );
      closeEditModal();
    } catch (err) {
      toast.error('Failed to update timesheet');
    } finally {
      setEditLoading(false);
    }
  };

  const openAddModal = () => {
    const defaultData = {};
    project.fields?.forEach((field) => {
      defaultData[field.fieldName] = '';
    });
    defaultData["Developer Name"] = user?.name;
    setAddFormData(defaultData);
    setAddingEntry(true);
  };

  const closeAddModal = () => {
    setAddingEntry(false);
    setAddFormData({});
  };

  const handleAddSubmit = async () => {
    try {
      setAddLoading(true);
      const res = await api.post(`/timesheets/create-timesheet`, {
        project: id,
        data: addFormData,
      });
      toast.success('Timesheet added');
      setTimesheets((prev) => [...prev, res.data]);
      closeAddModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add timesheet');
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-red-200 text-center max-w-md">
          <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Project</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No project found</p>
        </div>
      </div>
    );
  }

  const grouped = groupByDate(timesheets);

  const filteredFields = project.fields?.filter(
    (field) => field.fieldName != "Developer Name"
  );

  console.log(project, filteredFields);

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-purple-600 hover:text-purple-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          {/* Project Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-purple-700" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                </div>
                <p className="text-gray-600 mb-4">{project.description || "No description available"}</p>

                {/* Project Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Created {project.createdAt ? formatDateToReadable(project.createdAt) : "N/A"}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    {timesheets.length} timesheet entries
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 bg-purple-800 text-white px-4 py-2 rounded-lg hover:bg-purple-900 transition-all duration-200 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
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
                      className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-all duration-200 shadow-sm"
                    >
                      <Settings className="w-4 h-4" />
                      Edit Project
                    </button>

                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-2 bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition-all duration-200 shadow-sm disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Project
                    </button>
                  </>
                )}

                <button
                  onClick={() => exportTimesheetToExcel(project, timesheets)}
                  className="flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900 transition-all duration-200 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timesheets Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Timesheet Entries
              {timesheets.length > 0 && (
                <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full">
                  {timesheets.length}
                </span>
              )}
            </h2>
          </div>

          <div className="p-6">
            {timesheets.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No timesheet entries yet</h3>
                <p className="text-gray-500 mb-6">Start tracking time by adding your first entry.</p>
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add First Entry
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([date, entries]) => {
                  const allKeys = Array.from(
                    new Set(entries.flatMap((entry) => Object.keys(entry.data || {})))
                  );

                  return (
                    <div key={date} className="space-y-4">
                      {/* Date Header */}
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 px-3 py-1 rounded-full">
                          <span className="text-purple-800 font-medium text-sm">{date}</span>
                        </div>
                        <div className="h-px bg-gray-200 flex-1"></div>
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              {allKeys.map((key) => (
                                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {key.replace(/_/g, ' ')}
                                </th>
                              ))}
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {entries.map((entry) => (
                              <tr key={entry._id} className="hover:bg-gray-50">
                                {allKeys.map((key) => {
                                  const value = entry.data?.[key];
                                  const displayValue =
                                    key.toLowerCase().includes('date') && value
                                      ? formatDateToReadable(value)
                                      : value?.toString() || '-';

                                  return (
                                    <td key={key} className="px-6 py-4 text-sm text-gray-900">
                                      {key.toLowerCase().includes('hours') ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                          {displayValue}h
                                        </span>
                                      ) : key.toLowerCase() === 'task' ? (
                                        <div className="max-w-xs truncate" title={displayValue}>
                                          {displayValue}
                                        </div>
                                      ) : (
                                        displayValue
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="px-6 py-4 text-right text-sm font-medium">
                                  {(user?.role === "admin" || entry.user === user?.id || entry.user?._id === user?.id) && (
                                    <div className="flex items-center gap-2 justify-end">
                                      <button
                                        onClick={() => openEditModal(entry)}
                                        className="text-purple-600 hover:text-purple-800 transition-colors"
                                        title="Edit entry"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleTimesheetDelete(entry._id)}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                        title="Delete entry"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="block md:hidden space-y-4">
                        {entries.map((entry) => (
                          <div
                            key={entry._id}
                            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                          >
                            <div className="space-y-3">
                              {allKeys.map((key) => {
                                const value = entry.data?.[key];
                                const displayValue =
                                  key.toLowerCase().includes('date') && value
                                    ? formatDateToReadable(value)
                                    : value?.toString() || '-';

                                return (
                                  <div key={key} className="flex justify-between items-start">
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                      {key.replace(/_/g, ' ')}:
                                    </span>
                                    <span className="text-sm text-gray-900 text-right flex-1 ml-4">
                                      {key.toLowerCase().includes('hours') ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                          {displayValue}h
                                        </span>
                                      ) : (
                                        displayValue
                                      )}
                                    </span>
                                  </div>
                                );
                              })}

                              {(user?.role === "admin" || entry.user === user?.id || entry.user?._id === user?.id) && (
                                <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                                  <button
                                    onClick={() => openEditModal(entry)}
                                    className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleTimesheetDelete(entry._id)}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{deleteConfirmation.title}</h3>
                </div>
              </div>

              <p className="text-gray-600 mb-8 leading-relaxed">
                {deleteConfirmation.message}
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={hideDeleteConfirmation}
                  disabled={deleteConfirmation.loading}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedDelete}
                  disabled={deleteConfirmation.loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {deleteConfirmation.loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Timesheet Modal */}
     {editingEntry && (
  <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Edit Timesheet Entry</h3>
          <button
            onClick={closeEditModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Date field with formatted display */}
        {formData.date && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entry Date
              <span className="text-xs text-purple-600 font-normal ml-1">*</span>
            </label>
            <div className="relative">
              <div className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 font-medium flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors">
                <span className="flex items-center gap-2">
                  {formatDateToReadable(formData.date)}
                </span>
                <span className="text-purple-600 text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              
              {/* Invisible date input overlay for editing */}
              <input
                type="date"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                value={formData.date.slice(0, 10)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        )}

        {/* Other fields */}
        {Object.entries(formData).map(([key, value]) => {
          if (key === 'date') return null;

          const isTaskField = key.toLowerCase() === 'task';
          const isDateField = key.toLowerCase().includes('date');
          const inputType =
            typeof value === 'number' || key.toLowerCase().includes('hours')
              ? 'number'
              : isDateField
              ? 'date'
              : 'text';

          return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {key.replace(/_/g, ' ')}
                {isDateField && (
                  <span className="text-xs text-purple-600 font-normal ml-1">*</span>
                )}
              </label>
              
              {isTaskField ? (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none"
                  value={value}
                  placeholder="Describe what you worked on..."
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                />
              ) : isDateField ? (
                // ✅ Format other date fields too
                <div className="relative">
                  <div className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 font-medium flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors">
                    <span className="flex items-center gap-2">
                      {value ? formatDateToReadable(value) : 'Select date'}
                    </span>
                    <span className="text-purple-600 text-sm flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                    </span>
                  </div>
                  
                  <input
                    type="date"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={value || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ) : (
                <input
                  type={inputType}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={value || ''}
                  placeholder={
                    inputType === 'number' 
                      ? "Enter number..." 
                      : `Enter ${key.toLowerCase().replace(/_/g, ' ')}...`
                  }
                  onChange={(e) => {
                    const newValue = inputType === 'number' 
                      ? (e.target.value === "" ? "" : Number(e.target.value))
                      : e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      [key]: newValue,
                    }));
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end items-center">
          <div className="flex gap-3">
            <button
              onClick={closeEditModal}
              disabled={editLoading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={editLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {editLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Entry
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Add Timesheet Modal */}
      {addingEntry && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Add Timesheet Entry</h3>
                <button
                  onClick={closeAddModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Developer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Developer Name</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <User className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={user?.name || ""}
                    readOnly
                    className="flex-1 bg-transparent text-gray-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic fields */}
              {filteredFields?.map((field) => {
                const isDate = field.fieldType === "Date";
                const fieldValue = addFormData[field.fieldName];
                const isTaskField = field.fieldName.toLowerCase().includes("task");

                // ✅ For date fields, use formatted date directly as display value
                const inputValue = (() => {
                  if (fieldValue !== undefined) {
                    if (isDate && fieldValue) {
                      // Show formatted date directly
                      return formatDateToReadable(fieldValue);
                    }
                    return fieldValue;
                  }
                  // Default value for new entries - show today's date formatted
                  return isDate ? formatDateToReadable(new Date()) : "";
                })();

                return (
                  <div key={field.fieldName}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {field.fieldName.replace(/_/g, " ")}
                      {field.fieldType === "Date" && (
                        <span className="text-xs text-purple-600 font-normal ml-1">*</span>
                      )}
                    </label>

                    {field.fieldName === "Frontend/Backend" ? (
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={inputValue}
                        onChange={(e) =>
                          setAddFormData((prev) => ({
                            ...prev,
                            [field.fieldName]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select type</option>
                        <option value="Frontend">Frontend</option>
                        <option value="Backend">Backend</option>
                      </select>
                    ) : isTaskField ? (
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                        value={inputValue}
                        placeholder="Describe what you worked on..."
                        onChange={(e) =>
                          setAddFormData((prev) => ({
                            ...prev,
                            [field.fieldName]: e.target.value,
                          }))
                        }
                      />
                    ) : isDate ? (
                      // ✅ Enhanced date field with formatted display and editing capability
                      <div className="relative">
                        <div className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-black-800 font-medium flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors">
                          <span className="flex items-center gap-2">
                            {inputValue}
                          </span>
                          <span className="text-gray-600 text-sm flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                          </span>
                        </div>

                        {/* Invisible date input overlay for editing */}
                        <input
                          type="date"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          value={fieldValue ? new Date(fieldValue).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            setAddFormData((prev) => ({
                              ...prev,
                              [field.fieldName]: selectedDate,
                            }));
                          }}
                        />
                      </div>
                    ) : (
                      <input
                        type={
                          field.fieldType === "Number"
                            ? "number"
                            : "text"
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={inputValue}
                        placeholder={
                          field.fieldType === "Number"
                            ? "Enter number..."
                            : `Enter ${field.fieldName.toLowerCase()}...`
                        }
                        onChange={(e) => {
                          const value = field.fieldType === "Number"
                            ? (e.target.value === "" ? "" : Number(e.target.value))
                            : e.target.value;
                          setAddFormData((prev) => ({
                            ...prev,
                            [field.fieldName]: value,
                          }));
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end items-center">
                <div className="flex gap-3">
                  <button
                    onClick={closeAddModal}
                    disabled={addLoading}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSubmit}
                    disabled={addLoading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Entry
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Edit Project Modal */}
   {editingProject && (
  <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Edit Project Settings</h3>
        <button
          onClick={() => setEditingProject(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            value={projectFormData.name}
            onChange={(e) =>
              setProjectFormData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none"
            value={projectFormData.description}
            onChange={(e) =>
              setProjectFormData((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>

        {/* Custom Fields Only */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Custom Fields</h4>
          
          {/* ✅ Filter out ALL default fields */}
          {projectFormData.fields
            ?.filter((field) => {
              const defaultFields = [
                "task", 
                "date", 
                "Effort Hours", 
                "Frontend/Backend",
                "Developer Name",
                "Task",
              ];
              return !defaultFields.includes(field.fieldName);
            })
            .map((field, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Field {index + 1}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = projectFormData.fields.filter((_, i) => {
                        const customFields = projectFormData.fields.filter(f => {
                          const defaultFields = [
                            "task", "date", "workingHours", "Frontend/Backend",
                            "Developer Name", "Task", "Date", "Working Hours"
                          ];
                          return !defaultFields.includes(f.fieldName);
                        });
                        return i !== customFields.findIndex(cf => cf.fieldName === field.fieldName);
                      });
                      setProjectFormData((prev) => ({
                        ...prev,
                        fields: updated,
                      }));
                    }}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                    title="Delete field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Field Name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={field.fieldName}
                    onChange={(e) => {
                      const updated = [...projectFormData.fields];
                      const actualIndex = updated.findIndex(f => f.fieldName === field.fieldName && f.fieldType === field.fieldType);
                      if (actualIndex !== -1) {
                        updated[actualIndex].fieldName = e.target.value;
                        setProjectFormData((prev) => ({
                          ...prev,
                          fields: updated,
                        }));
                      }
                    }}
                  />
                  <select
                    className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={field.fieldType}
                    onChange={(e) => {
                      const updated = [...projectFormData.fields];
                      const actualIndex = updated.findIndex(f => f.fieldName === field.fieldName && f.fieldType === field.fieldType);
                      if (actualIndex !== -1) {
                        updated[actualIndex].fieldType = e.target.value;
                        setProjectFormData((prev) => ({
                          ...prev,
                          fields: updated,
                        }));
                      }
                    }}
                  >
                    <option value="String">String</option>
                    <option value="Number">Number</option>
                    <option value="Date">Date</option>
                    <option value="Boolean">Boolean</option>
                  </select>
                </div>
              </div>
            ))}

          {/* Show message if no custom fields */}
          {projectFormData.fields?.filter((field) => {
            const defaultFields = [
              "task", "date", "workingHours", "Frontend/Backend",
              "Developer Name", "Task", "Date", "Working Hours"
            ];
            return !defaultFields.includes(field.fieldName);
          }).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No custom fields added yet</p>
              <p className="text-sm">Click "Add Custom Field" to create one</p>
            </div>
          )}
        </div>

        {/* Add New Field Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setProjectFormData((prev) => ({
                ...prev,
                fields: [...prev.fields, { fieldName: "", fieldType: "String" }]
              }));
            }}
            className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Custom Field
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setEditingProject(false)}
            disabled={editProjectLoading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                setEditProjectLoading(true);
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
              } finally {
                setEditProjectLoading(false);
              }
            }}
            disabled={editProjectLoading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {editProjectLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
