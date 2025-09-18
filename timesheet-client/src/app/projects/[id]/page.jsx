'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import Select from 'react-select';
import toast from 'react-hot-toast';
import {
  Pencil,
  Trash2,
  Download,
  Plus,
  Calendar,
  Clock,
  User,
  Users,
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

// Components
import ConfirmHoursModal from '../../../components/models/confirmationHours';
import DeleteConfirmationModal from '../../../components/models/confirmationDelete';
import EditProjectModal from '../../../components/models/EditProjectModal';
import EditTimesheetModal from '../../../components/models/EditTimesheetModal';
import AddTimesheetModal from '../../../components/models/AddTimesheetModal'; // ✅ New import

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

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(false);

  const [editingProject, setEditingProject] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    fields: [],
    projectManagers: [],
  });
  const [editProjectLoading, setEditProjectLoading] = useState(false);

  // ✅ Updated delete confirmation states for the separate modal
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    type: '',
    id: null,
    title: '',
    message: '',
    loading: false
  });

  // ✅ Hours confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmHoursData, setConfirmHoursData] = useState(null);

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

        const projectData = projectRes.data.data || projectRes.data;
        setProject(projectData);

        if (projectData) {
          initializeProjectFormData(projectData);
        }

        const sortedTimesheets = (timesheetRes.data || []).sort(
          (a, b) => new Date(a.data?.date) - new Date(b.data?.date)
        );
        setTimesheets(sortedTimesheets);
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

  useEffect(() => {
    if (id && user && (user.role === "admin" || user.role === "project_manager")) {
      fetchUsers(id);
    }
  }, [id, user?.role]);

  const fetchUsers = async (projectId) => {
    try {
      setUsersLoading(true);
      setUsersError(false);
      if (!projectId) {
        setUsersError(true);
        toast.error('Project ID is required to fetch users');
        return;
      }

      let response;
      try {
        response = await api.get('/users/getAlluser');
      } catch {
        console.error('Failed to fetch assigned users, falling back to all users');
      }

      const rawUsers = Array.isArray(response.data) ? response.data : response.data?.data || [];
      const userOptions = rawUsers.map(user => ({
        value: user._id || user.id,
        label: user.name || user.email || 'Unknown User',
        email: user.email || '',
        role: user.role || 'User'
      }));
      setUsers(userOptions);

    } catch (error) {
      setUsersError(true);
      if (error.response?.status === 404) {
        toast.error('Project not found or no assigned users');
      } else if (error.response?.status === 403) {
        toast.error('Access denied to view assigned users');
      } else {
        toast.error('Failed to load users');
      }
    } finally {
      setUsersLoading(false);
    }
  };

  const initializeProjectFormData = (project) => {
    const existingManagers = Array.isArray(project.projectManagersDetails)
      ? project.projectManagersDetails
      : Array.isArray(project.projectManagers)
        ? project.projectManagers
        : [];

    const formattedManagers = existingManagers.map(manager => ({
      value: manager._id || manager.id,
      label: manager.name || manager.email || 'Unknown User',
      email: manager.email || '',
      role: manager.role || 'User'
    }));

    setProjectFormData({
      name: project.name || '',
      description: project.description || '',
      fields: Array.isArray(project.fields) ? project.fields : [],
      projectManagers: formattedManagers
    });
  };

  // ✅ Updated to use the separate modal
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

  // ✅ Updated to work with separate modal
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

  // ✅ Updated edit modal handlers
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
    // ✅ Also reset confirmation modal states
    setShowConfirmModal(false);
    setConfirmHoursData(null);
  };

  // ✅ Updated handleAddSubmit with hours validation
  const handleAddSubmit = async () => {
    try {
      // Check for effort/working hours exceeding 8 hours
      const hoursFields = project.fields?.filter(field =>
        field.fieldName.toLowerCase().includes("effort") ||
        field.fieldName.toLowerCase().includes("hours") ||
        field.fieldName.toLowerCase().includes("hour")
      );

      let exceedsEightHours = false;
      let hoursData = null;

      // Check each hours field
      hoursFields?.forEach(field => {
        const hours = Number(addFormData[field.fieldName]) || 0;
        if (hours > 8) {
          exceedsEightHours = true;
          hoursData = {
            fieldName: field.fieldName,
            hours: hours,
            totalHours: hours
          };
        }
      });

      // Show confirmation modal if hours exceed 8
      if (exceedsEightHours) {
        setConfirmHoursData(hoursData);
        setShowConfirmModal(true);
        return; // Wait for user confirmation
      }

      // Proceed with normal submission
      await submitTimesheet();

    } catch (error) {
      console.error("Error in handleAddSubmit:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  // ✅ Separate function to handle actual submission
  const submitTimesheet = async () => {
    try {
      // Validate required fields
      const hasDate = project.fields?.some(field =>
        field.fieldType === "Date" && addFormData[field.fieldName]
      );

      if (!hasDate) {
        toast.error("Please select a date");
        return;
      }

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
      setShowConfirmModal(false);
      setConfirmHoursData(null);
    }
  };

  // ✅ Handlers for confirmation modal
  const handleConfirmHours = async () => {
    await submitTimesheet();
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmHoursData(null);
  };

  if (loading) {
    return (
      <div className=" bg-gradient-to-br flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mt-5 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className=" bg-gradient-to-br flex items-center justify-center">
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
      <div className=" bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No project found</p>
        </div>
      </div>
    );
  }

  const grouped = groupByDate(timesheets);
  const filteredFields = project.fields?.filter(
    (field) => field.fieldName !== "Developer Name"
  );

  return (
    <div className=" bg-gradient-to-br">
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

                {/* Project Managers Card */}
                {project.projectManagers && project.projectManagers.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-semibold text-purple-900">
                        Project Managers ({project.projectManagers.length})
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.projectManagersDetails.map((manager, index) => {
                        const initials = manager?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                        return (
                          <div
                            key={manager._id || manager.id || index}
                            className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {initials}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{manager?.name}</span>
                            {manager?.email && (
                              <span className="text-xs text-gray-500 hidden sm:inline">
                                ({manager?.email})
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No Project Managers Fallback */}
                {(!project.projectManagers || project.projectManagers.length === 0) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">No project managers assigned</span>
                    </div>
                  </div>
                )}

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
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
                </button>

                {(userRole === 'admin' || userRole === 'project_manager') && (
                  <>
                    <button
                      onClick={() => {
                        initializeProjectFormData(project);
                        setEditingProject(true);
                      }}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
                    >
                      <Settings className="w-4 h-4" />
                      Edit Project
                    </button>

                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Project
                    </button>
                  </>
                )}

                <button
                  onClick={() => exportTimesheetToExcel(project, timesheets)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm"
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
                                  {(
                                    user?.role === "admin" ||
                                    user?.role === "project_manager" ||
                                    entry.user === user?.id ||
                                    entry.user?._id === user?.id
                                  ) && (
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

      {/* ✅ Updated Delete Confirmation Modal - Now using separate component */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmation.show}
        onConfirm={handleConfirmedDelete}
        onCancel={hideDeleteConfirmation}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
        isLoading={deleteConfirmation.loading}
      />

      {/* ✅ Edit Timesheet Modal - Updated with projectFields prop */}
      <EditTimesheetModal
        isOpen={!!editingEntry}
        onClose={closeEditModal}
        onSave={handleEditSubmit}
        formData={formData}
        setFormData={setFormData}
        isLoading={editLoading}
        projectFields={project?.fields}
      />

      {/* ✅ Add Timesheet Modal - Now using separate component */}
      <AddTimesheetModal
        isOpen={addingEntry}
        onClose={closeAddModal}
        onSave={handleAddSubmit}
        formData={addFormData}
        setFormData={setAddFormData}
        isLoading={addLoading}
        user={user}
        filteredFields={filteredFields}
      />

      {/* ✅ Hours Confirmation Modal */}
      <ConfirmHoursModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmHours}
        onCancel={handleCancelConfirm}
        hoursData={confirmHoursData}
        isLoading={addLoading}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        open={editingProject}
        onClose={() => setEditingProject(false)}
        onSave={async () => {
          try {
            setEditProjectLoading(true);
            const submitData = {
              ...projectFormData,
              projectManagers: projectFormData.projectManagers?.map(pm => pm.value) || [],
            };
            await api.put(`/projects/${id}`, submitData);
            toast.success("Project updated successfully");
            const freshProjectRes = await api.get(`/projects/${id}`);
            const freshProjectData = freshProjectRes.data.data || freshProjectRes.data;
            setProject(freshProjectData);
            setProjectFormData({
              name: freshProjectData.name || "",
              description: freshProjectData.description || "",
              fields: Array.isArray(freshProjectData.fields) ? freshProjectData.fields : [],
              projectManagers: (Array.isArray(freshProjectData.projectManagersDetails)
                ? freshProjectData.projectManagersDetails
                : []).map(manager => ({
                  value: manager._id || manager.id,
                  label: manager.name || manager.email || "Unknown User",
                  email: manager.email || ""
                }))
            });
            setEditingProject(false);
          } catch (err) {
            toast.error(
              err?.response?.data?.message || "Failed to update project"
            );
          } finally {
            setEditProjectLoading(false);
          }
        }}
        formData={projectFormData}
        setFormData={setProjectFormData}
        users={users}
        usersLoading={usersLoading}
        usersError={usersError}
        editLoading={editProjectLoading}
      />

    </div>
  );
}
