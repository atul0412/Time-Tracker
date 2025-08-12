'use client'

import { useEffect, useState } from 'react'
import { Calendar, Filter, Clock, X, Download } from 'lucide-react'
import api from '../../lib/axios'
import { exportTimesheetToExcel } from '../../lib/exportToExcel'

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

    // Date filter states
    const [dateFilter, setDateFilter] = useState('all')
    const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' })
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

    // Fetch all users on mount
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

    // Fetch assigned projects when selectedUser changes (user view)
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

    // Fetch all projects (project view)
    useEffect(() => {
        if (viewMode !== 'project') return

        const fetchAllProjects = async () => {
            setLoadingProjects(true)
            try {
                const res = await api.get('/projects/allproject')
                const projectsArray =
                    Array.isArray(res.data) ? res.data :
                        Array.isArray(res.data?.data) ? res.data.data :
                            Array.isArray(res.data?.projects) ? res.data.projects : []
                setProjects(projectsArray)
            } catch (err) {
                console.error('❌ Error fetching projects:', err)
                setErrorProjects(err?.response?.data?.message || 'Failed to load projects')
            } finally {
                setLoadingProjects(false)
            }
        }
        fetchAllProjects()
    }, [viewMode])

    // Fetch timesheets when relevant dependencies change
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
                startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay()) // Sunday start
                const endOfWeek = new Date(startOfWeek)
                endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday end
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

    // Filter timesheets according to view mode and date
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
                    return `${new Date(customDateRange.startDate).toLocaleDateString()} - ${new Date(
                        customDateRange.endDate,
                    ).toLocaleDateString()}`
                }
                return 'Custom Range'
            default:
                return 'All Time'
        }
    }

    // Fixed export function with better error handling
    const handleExport = () => {
        try {
            // Ensure we have valid project data
            if (!selectedProject || !selectedProject._id) {
                console.error('No project selected for export')
                alert('Please select a project to export timesheets')
                return
            }

            // Ensure we have timesheets to export
            if (!filteredTimesheets || filteredTimesheets.length === 0) {
                alert('No timesheet data available to export')
                return
            }

            // Create a safe project object with required fields
            const safeProject = {
                _id: selectedProject._id,
                name: selectedProject.name || 'Unnamed Project',
                // Add any other fields your export function might need
                ...selectedProject
            }

            // Generate filename based on context
            const filename = viewMode === 'user'
                ? `timesheet_${selectedUser?.name || 'user'}_${safeProject.name}_${dateFilter === 'all' ? 'all' : getFilterLabel().replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
                : `timesheet_${safeProject.name}_${dateFilter === 'all' ? 'all' : getFilterLabel().replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`

            // Call the export function
            exportTimesheetToExcel(safeProject, filteredTimesheets, filename)
        } catch (error) {
            console.error('Export failed:', error)
            alert('Failed to export timesheet. Please try again.')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br py-8">
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
                                {users.map((user) => (
                                    <option key={user._id} value={user._id}>
                                        {user.name}
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
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-gray-800">{selectedUser.name}</h3>
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

                {/* Timesheet Table (shown in BOTH views with correct selections) */}
                {(viewMode === 'project' && selectedProject) ||
                    (viewMode === 'user' && selectedUser && selectedProject) ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Timesheets for "{viewMode === 'user' && selectedUser ? selectedUser.name + ' - ' : ''}{selectedProject ? selectedProject.name : ''}"
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
                                        {/* Fixed Export button */}
{/* Fixed Export button with debugging */}
<button
    onClick={() => {
        console.log('Export button clicked');
        console.log('Selected Project:', selectedProject);
        console.log('Filtered Timesheets:', filteredTimesheets);
        
        try {
            // Create enhanced project object
            const enhancedProject = {
                ...selectedProject,
                fields: selectedProject?.fields || [
                    { fieldName: 'date' },
                    { fieldName: 'Developer Name' },
                    { fieldName: 'task' },
                    { fieldName: 'Effort Hours' },
                    { fieldName: 'Frontend/Backend' }
                ]
            };

            // Generate filename
            const filename = viewMode === 'user' 
                ? `timesheet_${selectedUser?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'user'}_${selectedProject?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'project'}_${dateFilter === 'all' ? 'all' : getFilterLabel().replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
                : `timesheet_${selectedProject?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'project'}_${dateFilter === 'all' ? 'all' : getFilterLabel().replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

            console.log('Calling exportTimesheetToExcel with:', { enhancedProject, filteredTimesheets, filename });
            
            exportTimesheetToExcel(enhancedProject, filteredTimesheets, filename);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export timesheet: ' + error.message);
        }
    }}
    disabled={!selectedProject || filteredTimesheets.length === 0}
    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg border border-purple-700 shadow-sm transition-colors font-medium"
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
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {filteredTimesheets.map((ts, index) => {
                                                        const data = ts.data || {}
                                                        return (
                                                            <tr key={index} className="hover:bg-gray-50">
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[100px]">
                                                                    <div className="font-medium">
                                                                        {data.date
                                                                            ? new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                                            : ''}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {data.date ? new Date(data.date).getFullYear() : ''}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[80px]">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                        {data['Effort Hours'] || data.workingHours || '0'}h
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 min-w-[200px] max-w-[300px]">
                                                                    <div className="line-clamp-2 break-words" title={data.task}>
                                                                        {data.task}
                                                                    </div>
                                                                </td>
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
                                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[100px]">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${data['Frontend/Backend'] === 'Frontend'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-orange-100 text-orange-800'
                                                                        }`}>
                                                                        {data['Frontend/Backend']}
                                                                    </span>
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
}
