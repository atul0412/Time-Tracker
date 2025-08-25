'use client'

import { useEffect, useState } from 'react'
import { Calendar, Filter, Clock, X, Download, Users, AlertTriangle, Trash2, Edit, Pencil } from 'lucide-react'
import api from '../../lib/axios'
import { exportTimesheetToExcel } from '../../lib/exportToExcel'
import { formatDateToReadable } from '../../lib/dateFormate'
import toast from 'react-hot-toast'

// DeleteConfirmationModal component
function DeleteConfirmationModal({ show, title, message, onConfirm, onCancel, loading }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                    <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{title}</h3>
                <p className="text-gray-600 text-center mb-6">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        {loading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ReportPage() {
    const [viewMode, setViewMode] = useState('user')
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [assignedProjects, setAssignedProjects] = useState([])
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [timesheets, setTimesheets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [loadingProjects, setLoadingProjects] = useState(false)
    const [errorProjects, setErrorProjects] = useState('')
    const [timesheetsLoading, setTimesheetsLoading] = useState(false)
    
    // Add states for assigned users
    const [assignedUsers, setAssignedUsers] = useState([])
    const [assignedUsersLoading, setAssignedUsersLoading] = useState(false)
    const [assignedUsersError, setAssignedUsersError] = useState('')

    // Date filter states
    const [dateFilter, setDateFilter] = useState('all')
    const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' })
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

    // New states for editing functionality
    const [editMode, setEditMode] = useState(false)
    const [editableTimesheets, setEditableTimesheets] = useState([])

    // Delete confirmation modal state
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        show: false,
        id: null,
        loading: false,
        title: '',
        message: '',
    });

    // Helper functions for formatting
    const formatUserDisplayName = (user) => {
        if (!user) return 'Unknown User';
        const name = user.name || user.username || user.email || 'Unknown User';
        const role = user.role;
        
        const roleDisplay = role ? ` (${formatRole(role)})` : '';
        return `${name}${roleDisplay}`;
    };

    const formatRole = (role) => {
        if (!role) return '';
        
        const roleMap = {
            'admin': 'Admin',
            'project_manager': 'Project Manager',
            'user': 'User',
            'developer': 'Developer',
            'designer': 'Designer',
            'tester': 'Tester'
        };
        
        return roleMap[role] || role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getRoleBadgeColor = (role) => {
        const colorMap = {
            'admin': 'bg-red-100 text-red-800 border-red-200',
            'project_manager': 'bg-blue-100 text-blue-800 border-blue-200',
            'user': 'bg-green-100 text-green-800 border-green-200',
            'developer': 'bg-purple-100 text-purple-800 border-purple-200',
            'designer': 'bg-pink-100 text-pink-800 border-pink-200',
            'tester': 'bg-orange-100 text-orange-800 border-orange-200'
        };
        return colorMap[role] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getDateRange = (filterType) => {
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        
        switch (filterType) {
            case 'today':
                return {
                    start: startOfDay,
                    end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1),
                }
            case 'weekly': {
                const startOfWeek = new Date(startOfDay)
                startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
                const endOfWeek = new Date(startOfWeek)
                endOfWeek.setDate(startOfWeek.getDate() + 6)
                return { start: startOfWeek, end: endOfWeek }
            }
            case 'monthly': {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
                return { start: startOfMonth, end: endOfMonth }
            }
            case 'custom':
                if (customDateRange.startDate && customDateRange.endDate) {
                    return {
                        start: new Date(customDateRange.startDate),
                        end: new Date(customDateRange.endDate + 'T23:59:59'),
                    }
                }
                return null
            default:
                return null
        }
    }

    const filteredTimesheets = timesheets.filter((ts) => {
        if (!ts.data) return false

        if (viewMode === 'user') {
            if (!selectedUser) return false
            const devNameInTS = (ts.data['Developer Name'] || ts.data['Developer name'] || '').trim().toLowerCase()
            const selectedName = (selectedUser.name || '').trim().toLowerCase()
            if (devNameInTS !== selectedName) return false
        }

        if (dateFilter !== 'all') {
            const dateRange = getDateRange(dateFilter)
            if (dateRange) {
                const entryDate = new Date(ts.data.date)
                if (entryDate < dateRange.start || entryDate > dateRange.end) {
                    return false
                }
            }
        }

        return true
    })

    const totalHours = filteredTimesheets.reduce(
        (sum, ts) => sum + parseFloat(ts.data?.['Effort Hours'] || ts.data?.workingHours || 0),
        0
    )

    const uniqueDevelopers = [...new Set(filteredTimesheets.map(ts => (ts.data['Developer Name'] || ts.data['Developer name'] || '').trim()))].length

    // Delete modal handlers
    const showDeleteConfirmation = (timesheetId) => {
        setDeleteConfirmation({
            show: true,
            id: timesheetId,
            loading: false,
            title: 'Delete Timesheet Entry',
            message: 'Are you sure you want to delete this timesheet entry? This action cannot be undone.',
        });
    };

    const hideDeleteConfirmation = () => {
        setDeleteConfirmation({
            show: false,
            id: null,
            loading: false,
            title: '',
            message: '',
        });
    };

    const handleConfirmDelete = async () => {
        setDeleteConfirmation(prev => ({ ...prev, loading: true }));
        try {
            await api.delete(`/timesheets/${deleteConfirmation.id}`);
            setTimesheets(prev => prev.filter(ts => ts._id !== deleteConfirmation.id));
            if (editMode) {
                setEditableTimesheets(prev => prev.filter(ts => ts._id !== deleteConfirmation.id));
            }
            hideDeleteConfirmation();
            toast.success('Timesheet entry deleted successfully!');
        } catch (error) {
            console.error('Failed to delete timesheet:', error);
            toast.error('Failed to delete timesheet entry. Please try again later.');
        } finally {
            setDeleteConfirmation(prev => ({ ...prev, loading: false }));
        }
    };

    const handleToggleEditMode = () => {
        if (editMode) {
            handleSaveAllChanges();
        } else {
            setEditableTimesheets(filteredTimesheets.map(ts => ({ ...ts })));
        }
        setEditMode(!editMode);
    };

    const handleSaveAllChanges = async () => {
        try {
            const updatePromises = editableTimesheets.map(ts => {
                if (ts._id) {
                    return api.put(`/timesheets/${ts._id}`, ts.data);
                }
                return Promise.resolve();
            });
            await Promise.all(updatePromises);
            setTimesheets(editableTimesheets);
            toast.success('All changes saved successfully!');
        } catch (error) {
            console.error('Failed to save changes:', error);
            toast.error('Failed to save some changes. Please try again.');
        }
    };

    const handleInputChange = (index, field, value) => {
        // Define which fields are editable
        const editableFields = ['Effort Hours', 'task', 'date'];
        
        // Only allow changes to editable fields
        if (!editableFields.includes(field)) {
            console.warn(`Attempted to edit non-editable field: ${field}`);
            return;
        }

        setEditableTimesheets(prev => {
            const newEditable = [...prev];
            if (!newEditable[index]) return newEditable;
            
            newEditable[index] = {
                ...newEditable[index],
                data: {
                    ...newEditable[index].data,
                    [field]: value
                }
            };
            return newEditable;
        });
    };

    const handleDateFilterChange = (filterType) => {
        setDateFilter(filterType)
        if (filterType === 'custom') {
            setShowCustomDatePicker(true)
        } else {
            setShowCustomDatePicker(false)
            setCustomDateRange({ startDate: '', endDate: '' })
        }
    }

    const applyCustomDateRange = () => {
        if (customDateRange.startDate && customDateRange.endDate) {
            setDateFilter('custom')
            setShowCustomDatePicker(false)
        }
    }

    const clearCustomDateRange = () => {
        setCustomDateRange({ startDate: '', endDate: '' })
        setDateFilter('all')
        setShowCustomDatePicker(false)
    }

    const getFilterLabel = () => {
        switch (dateFilter) {
            case 'today':
                return 'Today'
            case 'weekly':
                return 'This Week'
            case 'monthly':
                return 'This Month'
            case 'custom':
                if (customDateRange.startDate && customDateRange.endDate) {
                    return `${formatDateToReadable(customDateRange.startDate)} - ${formatDateToReadable(customDateRange.endDate)}`
                }
                return 'Custom Range'
            default:
                return 'All Time'
        }
    }

    const handleExport = () => {
        try {
            if (!selectedProject || !selectedProject._id) {
                console.error('No project selected for export')
                toast.error('Please select a project to export timesheets')
                return
            }

            if (!filteredTimesheets || filteredTimesheets.length === 0) {
                toast.error('No timesheet data available to export')
                return
            }

            const safeProject = {
                _id: selectedProject._id,
                name: selectedProject.name || 'Unnamed Project',
                ...selectedProject
            }

            const filename = viewMode === 'user'
                ? `timesheet_${selectedUser?.name || 'user'}_${safeProject.name}_${dateFilter === 'all' ? 'all' : getFilterLabel().replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
                : `timesheet_${safeProject.name}_${dateFilter === 'all' ? 'all' : getFilterLabel().replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`

            exportTimesheetToExcel(safeProject, filteredTimesheets, filename)
        } catch (error) {
            console.error('Export failed:', error)
            toast.error('Failed to export timesheet. Please try again.')
        }
    }

    // useEffect hooks
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users/getAlluser')
                setUsers(res.data)
            } catch (err) {
                setError(err?.response?.data?.message || 'Failed to load users')
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [])

    useEffect(() => {
        if (viewMode !== 'user' || !selectedUser?._id) return

        const fetchAssignedProjects = async () => {
            try {
                const res = await api.get(`/assignProject/user/${selectedUser._id}`)
                setAssignedProjects(res.data.data || [])
                setSelectedProject(null)
                setTimesheets([])
            } catch (err) {
                console.error('Failed to fetch assigned projects:', err)
            }
        }
        fetchAssignedProjects()
    }, [viewMode, selectedUser?._id])

    useEffect(() => {
        if (viewMode !== 'project') return;

        const fetchAllProjects = async () => {
            setLoadingProjects(true);
            try {
                const res = await api.get('/projects/allproject');
                const rawData =
                    Array.isArray(res.data) ? res.data :
                        Array.isArray(res.data?.data) ? res.data.data :
                            Array.isArray(res.data?.projects) ? res.data.projects : [];

                const projectsArray = rawData.map(item => item.project || item);
                setProjects(projectsArray);
            } catch (err) {
                console.error('❌ Error fetching projects:', err);
                setErrorProjects(err?.response?.data?.message || 'Failed to load projects');
            } finally {
                setLoadingProjects(false);
            }
        };

        fetchAllProjects();
    }, [viewMode]);

    useEffect(() => {
        if (viewMode !== 'project' || !selectedProject?._id) {
            setAssignedUsers([])
            return
        }

        const fetchAssignedUsers = async () => {
            setAssignedUsersLoading(true)
            setAssignedUsersError('')
            try {
                const response = await api.get(`/assignProject/assigned-users/${selectedProject._id}`)
                const users = response.data?.data || response.data || []
                setAssignedUsers(users)
            } catch (err) {
                console.error('Failed to fetch assigned users:', err)
                if (err.response?.status === 404) {
                    setAssignedUsersError('No assigned users found for this project')
                    setAssignedUsers([])
                } else if (err.response?.status === 403) {
                    setAssignedUsersError('Access denied to view assigned users')
                } else if (err.response?.status === 500) {
                    setAssignedUsersError('Server error while loading assigned users')
                } else {
                    setAssignedUsersError('Failed to load assigned users')
                }
            } finally {
                setAssignedUsersLoading(false)
            }
        }

        fetchAssignedUsers()
    }, [viewMode, selectedProject?._id])

    useEffect(() => {
        const fetchTimesheets = async () => {
            if (viewMode === 'user') {
                if (!selectedUser?._id || !selectedProject?._id) return
                setTimesheetsLoading(true)
                try {
                    const res = await api.get(`/timesheets/${selectedUser._id}/${selectedProject._id}`)
                    setTimesheets(Array.isArray(res.data) ? res.data : res.data?.data || [])
                } catch (err) {
                    console.error('❌ Failed to fetch timesheets:', err)
                    setTimesheets([])
                } finally {
                    setTimesheetsLoading(false)
                }
            } else if (viewMode === 'project') {
                if (!selectedProject?._id) return
                setTimesheetsLoading(true)
                try {
                    const res = await api.get(`/timesheets/project/${selectedProject._id}`)
                    setTimesheets(Array.isArray(res.data) ? res.data : res.data?.data || [])
                } catch (err) {
                    console.error('❌ Failed to fetch project timesheets:', err)
                    setTimesheets([])
                } finally {
                    setTimesheetsLoading(false)
                }
            }
        }
        fetchTimesheets()
    }, [viewMode, selectedUser?._id, selectedProject?._id])

    // Initialize editable timesheets when entering edit mode
    useEffect(() => {
        if (editMode && filteredTimesheets.length > 0) {
            setEditableTimesheets(filteredTimesheets.map(ts => ({ ...ts })));
        }
    }, [editMode])

    return (
        <div className="bg-gradient-to-br py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Timesheet Reports</h1>
                    <p className="mt-2 text-gray-600">
                        Analyze timesheet data by user or project with comprehensive reporting
                    </p>
                </div>

                {/* View Mode Toggle */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Report View Mode
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                value="user"
                                checked={viewMode === 'user'}
                                onChange={(e) => {
                                    setViewMode(e.target.value)
                                    setSelectedUser(null)
                                    setSelectedProject(null)
                                    setTimesheets([])
                                    setAssignedUsers([])
                                    setEditMode(false)
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                            />
                            <span className="ml-2 flex items-center">
                                <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                View by User
                            </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                value="project"
                                checked={viewMode === 'project'}
                                onChange={(e) => {
                                    setViewMode(e.target.value)
                                    setSelectedUser(null)
                                    setSelectedProject(null)
                                    setTimesheets([])
                                    setAssignedUsers([])
                                    setEditMode(false)
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                            />
                            <span className="ml-2 flex items-center">
                                <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                View by Project
                            </span>
                        </label>
                    </div>
                </div>

                {/* User Selection (User View) */}
                {viewMode === 'user' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Select User
                        </h2>
                        {loading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                <span className="ml-2 text-gray-600">Loading users...</span>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <div className="flex">
                                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="ml-3">
                                        <p className="text-red-800">{error}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
                                onChange={(e) => setSelectedUser(users.find((user) => user._id === e.target.value))}
                                value={selectedUser?._id || ''}
                            >
                                <option value="" disabled>
                                    Choose a user to view their timesheets
                                </option>
                                {users
                                    .filter((user) => user.role !== "admin")
                                    .map((user) => (
                                        <option key={user._id} value={user._id}>
                                            {formatUserDisplayName(user)}
                                        </option>
                                    ))}
                            </select>
                        )}
                    </div>
                )}

                {/* Project Selection (Project View) */}
                {viewMode === 'project' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Select Project
                            {projects.length > 0 && (
                                <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {projects.length} available
                                </span>
                            )}
                        </h2>
                        {loadingProjects ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                <span className="ml-2 text-gray-600">Loading projects...</span>
                            </div>
                        ) : errorProjects ? (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <div className="flex">
                                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="ml-3">
                                        <p className="text-red-800">{errorProjects}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
                                onChange={(e) => setSelectedProject(projects.find((project) => project._id === e.target.value))}
                                value={selectedProject?._id || ''}
                            >
                                <option value="" disabled>
                                    Choose a project to view timesheets
                                </option>
                                {projects.map((project) => (
                                    <option key={project._id} value={project._id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {/* Selected User Info */}
                {selectedUser && viewMode === 'user' && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="bg-purple-100 rounded-full p-2">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-medium text-gray-800">{selectedUser.name}</h3>
                                    {selectedUser.role && (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(selectedUser.role)}`}>
                                            {formatRole(selectedUser.role)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-700">{selectedUser.email || 'No email available'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Selected Project Info */}
                {selectedProject && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="bg-purple-100 rounded-full p-2">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-purple-900">{selectedProject.name}</h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Updated Assigned Users List (Project View Only) - Now shows roles */}
                {viewMode === 'project' && selectedProject && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-purple-600" />
                            Assigned Users
                            {assignedUsers.length > 0 && (
                                <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {assignedUsers.length} users
                                </span>
                            )}
                        </h2>

                        {assignedUsersLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                <span className="ml-2 text-gray-600">Loading assigned users...</span>
                            </div>
                        ) : assignedUsersError ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="ml-3">
                                        <p className="text-red-600 text-sm">{assignedUsersError}</p>
                                    </div>
                                </div>
                            </div>
                        ) : assignedUsers.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No users assigned</h3>
                                <p className="text-gray-500">This project doesn't have any assigned users yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {assignedUsers.map((assignment, index) => {
                                    const user = assignment.user || assignment;
                                    const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User';
                                    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

                                    return (
                                        <div key={user._id || assignment._id || index} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                                                {initials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                                                    {user.role && (
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                                                            {formatRole(user.role)}
                                                        </span>
                                                    )}
                                                </div>
                                                {user.email && (
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Assigned Projects Grid (user view only) */}
                {viewMode === 'user' && selectedUser && assignedProjects.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Assigned Projects
                            <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {assignedProjects.length}
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {assignedProjects.map((assigned) => {
                                const project = assigned.project || assigned
                                const isSelected = selectedProject?._id === project._id
                                return (
                                    <div
                                        key={assigned._id}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${isSelected ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                                        onClick={() => setSelectedProject(project)}
                                    >
                                        <div className="flex items-start text-center justify-between">
                                            <div className="flex-1">
                                                <h3 className={`font-semibold ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                                                    {project.name || 'Unnamed Project'}
                                                </h3>
                                            </div>
                                            {isSelected && (
                                                <svg className="w-5 h-5 text-purple-600 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Enhanced Timesheet Table (shown in BOTH views with correct selections) */}
                {(viewMode === 'project' && selectedProject) ||
                    (viewMode === 'user' && selectedUser && selectedProject) ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Timesheets for "{viewMode === 'user' && selectedUser ? `${formatUserDisplayName(selectedUser)} - ` : ''}{selectedProject ? selectedProject.name : ''}"
                                </h2>
                                {filteredTimesheets.length > 0 && (
                                    <div className="flex flex-wrap gap-4 text-right">
                                        <div className="bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                                            <span className="text-sm text-purple-600">Hours: </span>
                                            <span className="text-lg font-bold text-purple-800">{totalHours.toFixed(2)}</span>
                                        </div>
                                        <div className="bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                                            <span className="text-sm text-indigo-600">Devs: </span>
                                            <span className="text-lg font-bold text-indigo-800">{uniqueDevelopers}</span>
                                        </div>
                                        
                                        {/* Edit Button */}
                                        <button
                                            onClick={handleToggleEditMode}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border shadow-sm transition-colors font-medium ${
                                                editMode 
                                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                                                    : 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm'
                                            }`}
                                        >
                                            <Pencil className="w-4 h-4" />
                                            {editMode ? 'Save' : 'Edit'}
                                        </button>

                                        {/* Export Button */}
                                        <button
                                            onClick={handleExport}
                                            disabled={!selectedProject || filteredTimesheets.length === 0}
                                            className="flex items-center gap-2 bg-green-800 hover:bg-green-950 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg border border-green-700 shadow-sm transition-colors font-medium"
                                        >
                                            <Download className="w-5 h-5" />
                                            Export
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Date Filter Section */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'all', label: 'All' },
                                        { value: 'today', label: 'Today' },
                                        { value: 'weekly', label: 'Weekly' },
                                        { value: 'monthly', label: 'Monthly' },
                                        { value: 'custom', label: 'Custom Range' },
                                    ].map((filter) => (
                                        <button
                                            key={filter.value}
                                            onClick={() => handleDateFilterChange(filter.value)}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200 ${dateFilter === filter.value
                                                ? 'bg-purple-600 text-white border-purple-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:text-purple-600'
                                                }`}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                                {dateFilter !== 'all' && (
                                    <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                                        <Clock className="w-4 h-4" />
                                        <span>Showing: {getFilterLabel()}</span>
                                        <button
                                            onClick={() => {
                                                setDateFilter('all')
                                                clearCustomDateRange()
                                            }}
                                            className="text-purple-600 hover:text-purple-800"
                                            aria-label="Clear date filter"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {showCustomDatePicker && (
                                <div className="mt-4 p-4 bg-white border border-purple-200 rounded-lg">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="date"
                                                    value={customDateRange.startDate}
                                                    onChange={(e) => setCustomDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="date"
                                                    value={customDateRange.endDate}
                                                    onChange={(e) => setCustomDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 sm:flex-col sm:justify-end">
                                            <button
                                                onClick={applyCustomDateRange}
                                                disabled={!customDateRange.startDate || !customDateRange.endDate}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Apply
                                            </button>
                                            <button
                                                onClick={clearCustomDateRange}
                                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-0 sm:p-6">
                            {timesheetsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                    <span className="ml-2 text-gray-600">Loading timesheets...</span>
                                </div>
                            ) : filteredTimesheets.length === 0 ? (
                                <div className="text-center py-12 px-6">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No timesheets found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {dateFilter !== 'all'
                                            ? `No timesheet entries found for ${getFilterLabel().toLowerCase()}.`
                                            : 'No timesheet entries are available for this project.'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="block sm:hidden px-4 py-2 bg-purple-50 border-b border-purple-100">
                                        <p className="text-xs text-purple-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                            </svg>
                                            Swipe left to see more columns
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-gray-100">
                                        <div className="min-w-full">
                                            <table className="w-full divide-y divide-gray-300">
                                                <thead className="bg-gray-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                                                            Date
                                                        </th>
                                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] whitespace-nowrap">
                                                            Hours
                                                        </th>
                                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] max-w-[300px]">
                                                            Task
                                                        </th>
                                                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] whitespace-nowrap">
                                                            Developer
                                                        </th>
                                                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                                                            Type
                                                        </th>
                                                        <th className="px-3 sm:px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {(editMode ? editableTimesheets : filteredTimesheets).map((ts, index) => {
                                                        const data = ts.data || {}
                                                        return (
                                                            <tr key={ts._id || index} className="hover:bg-gray-50">
                                                                {/* DATE FIELD - EDITABLE */}
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[100px]">
                                                                    {editMode ? (
                                                                        <input
                                                                            type="date"
                                                                            value={data.date?.slice(0, 10) || ''}
                                                                            onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                        />
                                                                    ) : (
                                                                        <div className="font-medium">
                                                                            {formatDateToReadable(data.date)}
                                                                        </div>
                                                                    )}
                                                                </td>

                                                                {/* EFFORT HOURS FIELD - EDITABLE */}
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[80px]">
                                                                    {editMode ? (
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            min="0"
                                                                            value={data['Effort Hours'] || data.workingHours || ''}
                                                                            onChange={(e) => handleInputChange(index, 'Effort Hours', e.target.value)}
                                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                        />
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                            {data['Effort Hours'] || data.workingHours || '0'}h
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* TASK FIELD - EDITABLE */}
                                                                <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 min-w-[200px] max-w-[300px]">
                                                                    {editMode ? (
                                                                        <textarea
                                                                            value={data.task || ''}
                                                                            onChange={(e) => handleInputChange(index, 'task', e.target.value)}
                                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                                                            rows="2"
                                                                        />
                                                                    ) : (
                                                                        <div className="line-clamp-2 break-words" title={data.task}>
                                                                            {data.task}
                                                                        </div>
                                                                    )}
                                                                </td>

                                                                {/* DEVELOPER NAME FIELD - READ-ONLY */}
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[120px]">
                                                                    <div className="flex items-center">
                                                                        <div className="bg-purple-100 rounded-full p-1 mr-2 flex-shrink-0">
                                                                            <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                            </svg>
                                                                        </div>
                                                                        <span className="truncate">{data['Developer Name'] || data['Developer name']}</span>
                                                                    </div>
                                                                </td>

                                                                {/* TYPE FIELD - READ-ONLY */}
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[100px]">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        data['Frontend/Backend'] === 'Frontend'
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-orange-100 text-orange-800'
                                                                    }`}>
                                                                        {data['Frontend/Backend']}
                                                                    </span>
                                                                </td>

                                                                {/* ACTIONS FIELD */}
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                                                                    <button
                                                                        onClick={() => showDeleteConfirmation(ts._id)}
                                                                        className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors"
                                                                        title="Delete this timesheet entry"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    {/* Mobile table summary */}
                                    <div className="block sm:hidden px-4 py-3 bg-gray-50 border-t border-gray-200">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">{filteredTimesheets.length} entries</span>
                                            <span className="font-medium text-purple-600">{totalHours.toFixed(2)} total hours</span>
                                        </div>
                                        {dateFilter !== 'all' && <div className="mt-2 text-xs text-gray-500">Filtered by: {getFilterLabel()}</div>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal 
                show={deleteConfirmation.show}
                title={deleteConfirmation.title}
                message={deleteConfirmation.message}
                onConfirm={handleConfirmDelete}
                onCancel={hideDeleteConfirmation}
                loading={deleteConfirmation.loading}
            />

            {/* Custom scrollbar styles */}
            <style jsx>{`
                .scrollbar-thin {
                  scrollbar-width: thin;
                  scrollbar-color: rgba(147, 51, 234, 0.3) rgba(243, 244, 246, 1);
                }
                .scrollbar-thin::-webkit-scrollbar {
                  height: 8px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                  background: rgba(243, 244, 246, 1);
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                  background: rgba(147, 51, 234, 0.3);
                  border-radius: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                  background: rgba(147, 51, 234, 0.5);
                }
                .line-clamp-2 {
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                }
            `}</style>
        </div>
    )
// DeleteConfirmationModal component
function DeleteConfirmationModal({ show, title, message, onConfirm, onCancel,  isLoading  }) {
    if (!show) return null;

    return (
    <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
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
  );
}
}
