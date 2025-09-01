'use client';
import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { formatDateToReadable } from '../../lib/dateFormate';
import {
    Search, Filter, Download, Calendar, User, Activity,
    AlertCircle, CheckCircle, Plus, Edit, Trash2, BarChart3,
    Clock, Shield, RefreshCw, MessageSquare, LogIn, LogOut, Menu, X
} from 'lucide-react';

const AuditDashboard = () => {
    const [auditLogs, setAuditLogs] = useState({ docs: [], totalPages: 0, page: 1, totalDocs: 0 });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('logs');
    const [showFilters, setShowFilters] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 15,
        resource: '',
        action: '',
        status: '',
        startDate: '',
        endDate: '',
        search: ''
    });

    // Get user role from localStorage or context
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user && user.role) {
            setUserRole(user.role);
        }
    }, []);

    // Fetch audit logs from backend with role-based filtering
    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value !== '' && value !== null)
            );

            const response = await api.get('/audit', { params: cleanFilters });

            if (response.data.success) {
                setAuditLogs(response.data.data);
                console.log('📊 Query Time:', response.data.queryTime, 'ms');
            } else {
                throw new Error(response.data.message || 'Failed to fetch audit logs');
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            setError(error.response?.data?.message || error.message || 'Failed to fetch audit logs');
            setAuditLogs({ docs: [], totalPages: 0, page: 1, totalDocs: 0 });
        } finally {
            setLoading(false);
        }
    };

    // Fetch statistics from backend
    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const response = await api.get('/audit/stats');

            if (response.data.success) {
                setStats(response.data.data);
                console.log('📈 Stats loaded:', response.data.data.summary);
            } else {
                throw new Error(response.data.message || 'Failed to fetch statistics');
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            setStats({
                summary: {
                    totalLogs: 0,
                    successCount: 0,
                    failureCount: 0,
                    uniqueUsers: 0,
                    actionStats: [],
                    statusStats: []
                },
                topUsers: []
            });
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, [filters]);

    useEffect(() => {
        fetchStats();
    }, []);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value,
            page: field !== 'page' ? 1 : value
        }));
    };

    const handleRefresh = () => {
        fetchAuditLogs();
        fetchStats();
    };

    const resetFilters = () => {
        setFilters({
            page: 1,
            limit: 15,
            resource: '',
            action: '',
            status: '',
            startDate: '',
            endDate: '',
            search: ''
        });
        setShowFilters(false);
    };

    // Role-based dashboard title
    const getDashboardTitle = () => {
        switch (userRole) {
            case 'admin':
                return 'Admin Audit Dashboard';
            case 'project_manager':
                return 'Project Manager Dashboard';
            default:
                return 'Audit Dashboard';
        }
    };

    // Role-based dashboard subtitle
    const getDashboardSubtitle = () => {
        switch (userRole) {
            case 'admin':
                return 'Monitor and track all system activities across the platform';
            case 'project_manager':
                return 'Track activities related to your projects and team members';
            default:
                return 'Monitor and track your activities';
        }
    };

    // Role-based resource filter options
    const getResourceOptions = () => {
        const baseOptions = [
            { value: '', label: 'All Resources' },
            { value: 'auth', label: 'Authentication' }
        ];

        if (userRole === 'admin') {
            return [
                ...baseOptions,
                { value: 'users', label: 'Users' },
                { value: 'projects', label: 'Projects' },
                { value: 'timesheets', label: 'Timesheets' },
                { value: 'assignproject', label: 'Assignments' }
            ];
        } else if (userRole === 'project_manager') {
            return [
                ...baseOptions,
                { value: 'projects', label: 'Projects' },
                { value: 'timesheets', label: 'Timesheets' },
                { value: 'assignproject', label: 'Assignments' },
                { value: 'users', label: 'Team Members' }
            ];
        } else {
            return [
                ...baseOptions,
                { value: 'timesheets', label: 'My Timesheets' }
            ];
        }
    };

    // Role-based action filter options
    const getActionOptions = () => {
        const baseOptions = [
            { value: '', label: 'All Actions' },
            { value: 'LOGIN', label: 'Login' },
            { value: 'LOGOUT', label: 'Logout' }
        ];

        if (userRole === 'admin') {
            return [
                ...baseOptions,
                { value: 'CREATE', label: 'Create' },
                { value: 'UPDATE', label: 'Update' },
                { value: 'DELETE', label: 'Delete' }
            ];
        } else if (userRole === 'project_manager') {
            return [
                ...baseOptions,
                { value: 'CREATE', label: 'Create' },
                { value: 'UPDATE', label: 'Update' },
                { value: 'DELETE', label: 'Delete' }
            ];
        } else {
            return baseOptions;
        }
    };

    const formatTimestamp = (timestamp) => {
        const dateString = formatDateToReadable(timestamp);
        const dateObj = new Date(timestamp);

        if (isNaN(dateObj.getTime())) return { date: '', time: '' };

        return {
            date: dateString,
            time: dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        };
    };

    const getActionStyle = (action) => {
        const styles = {
            CREATE: 'bg-green-50 text-green-700 border-green-200',
            UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
            DELETE: 'bg-red-50 text-red-700 border-red-200',
            LOGIN: 'bg-purple-50 text-purple-700 border-purple-200',
            LOGOUT: 'bg-orange-50 text-orange-700 border-orange-200'
        };
        return styles[action] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const getStatusColor = (status) => {
        const colors = {
            SUCCESS: 'bg-green-100 text-green-800 border-green-300',
            FAILURE: 'bg-red-100 text-red-800 border-red-300',
            ERROR: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const exportLogs = async (format = 'csv') => {
        try {
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value !== '' && value !== null)
            );

            const response = await api.get('/audit/export', {
                params: { ...cleanFilters, format },
                responseType: 'blob'
            });

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Enhanced filename based on role using formatDateToReadable
            const readableDate = formatDateToReadable(new Date());
            const rolePrefix = userRole === 'admin' ? 'admin-all' :
                userRole === 'project_manager' ? 'pm-team' : 'user';
            a.download = `audit-logs-${rolePrefix}-${readableDate}.${format}`;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    };

    const StatCard = ({ title, value, icon, color = 'blue', loading = false }) => (
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 truncate">{title}</p>
                    {loading ? (
                        <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-12 sm:w-16 rounded"></div>
                    ) : (
                        <p className={`text-xl sm:text-3xl font-bold text-${color}-600 truncate`}>{value}</p>
                    )}
                </div>
                <div className={`p-2 sm:p-3 bg-${color}-100 rounded-lg sm:rounded-xl flex-shrink-0 ml-2`}>
                    {React.cloneElement(icon, { className: 'w-4 h-4 sm:w-6 sm:h-6' })}
                </div>
            </div>
        </div>
    );

    const ErrorMessage = ({ message, onRetry }) => (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 mb-4 sm:mb-6 rounded-r-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-red-800 font-medium text-sm sm:text-base">{message}</span>
                </div>
                <button
                    onClick={onRetry}
                    className="text-red-600 hover:text-red-800 font-medium text-sm bg-red-100 px-2 sm:px-3 py-1 rounded-md hover:bg-red-200 transition-colors self-start sm:self-auto"
                >
                    Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-gradient-to-br p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header - Role-based */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                            {getDashboardTitle()}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600">
                            {getDashboardSubtitle()}
                        </p>
                        {/* Role indicator */}
                        {userRole && (
                            <div className="flex items-center mt-2">
                                <Shield className="w-4 h-4 mr-2 text-blue-600" />
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full capitalize">
                                    {userRole.replace('_', ' ')}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm text-sm sm:text-base"
                    >
                        <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${(loading || statsLoading) ? 'animate-spin text-purple-600' : 'text-gray-600'}`} />
                        <span className="font-medium text-gray-700">Refresh</span>
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <ErrorMessage
                        message={error}
                        onRetry={() => {
                            fetchAuditLogs();
                            fetchStats();
                        }}
                    />
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                    <StatCard
                        title={userRole === 'admin' ? 'Total Activities' : userRole === 'project_manager' ? 'Team Activities' : 'My Activities'}
                        value={stats?.summary?.totalLogs?.toLocaleString() || 0}
                        icon={<Activity />}
                        color="blue"
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Success Rate"
                        value={
                            stats?.summary?.totalLogs && stats?.summary?.successCount
                                ? `${Math.round((stats.summary.successCount / stats.summary.totalLogs) * 100)}%`
                                : '0%'
                        }
                        icon={<CheckCircle />}
                        color="green"
                        loading={statsLoading}
                    />
                    <StatCard
                        title={userRole === 'admin' ? 'Active Users' : userRole === 'project_manager' ? 'Team Members' : 'Sessions'}
                        value={stats?.summary?.uniqueUsers || 0}
                        icon={<User />}
                        color="purple"
                        loading={statsLoading}
                    />
                    <StatCard
                        title="Failed Actions"
                        value={stats?.summary?.failureCount || 0}
                        icon={<AlertCircle />}
                        color="red"
                        loading={statsLoading}
                    />
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-lg overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 overflow-x-auto">
                        <nav className="flex space-x-4 sm:space-x-8 px-3 sm:px-6 min-w-max">
                            <button
                                className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-semibold text-sm transition-all duration-300 whitespace-nowrap ${activeTab === 'logs'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                onClick={() => setActiveTab('logs')}
                            >
                                <Activity className="w-4 h-4 inline mr-2" />
                                Activity Logs ({auditLogs.totalDocs})
                            </button>
                        </nav>
                    </div>

                    {/* Activity Logs Tab */}
                    {activeTab === 'logs' && (
                        <div className="p-2 sm:p-4 lg:p-6">
                            {/* Mobile Filter Toggle */}
                            <div className="sm:hidden mb-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center justify-between w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium"
                                >
                                    <span>Filters</span>
                                    {showFilters ? <X className="w-3 h-3" /> : <Menu className="w-3 h-3" />}
                                </button>
                            </div>

                            {/* Compact Filters - Role-based options */}
                            <div className={`mb-4 sm:mb-6 ${showFilters ? 'block' : 'hidden sm:block'}`}>
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    {/* Search Input */}
                                    <div className="relative flex-1 min-w-[200px] max-w-[250px]">
                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-xs"
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                        />
                                    </div>

                                    {/* Resource Filter - Role-based options */}
                                    <select
                                        className="px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-xs min-w-[90px]"
                                        value={filters.resource}
                                        onChange={(e) => handleFilterChange('resource', e.target.value)}
                                    >
                                        {getResourceOptions().map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Action Filter - Role-based options */}
                                    <select
                                        className="px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-xs min-w-[80px]"
                                        value={filters.action}
                                        onChange={(e) => handleFilterChange('action', e.target.value)}
                                    >
                                        {getActionOptions().map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Status Filter */}
                                    <select
                                        className="px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-xs min-w-[70px]"
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="">Status</option>
                                        <option value="SUCCESS">Success</option>
                                        <option value="FAILURE">Failure</option>
                                        <option value="ERROR">Error</option>
                                    </select>

                                    {/* Date Filters */}
                                    <input
                                        type="date"
                                        className="px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-xs min-w-[110px]"
                                        value={filters.startDate}
                                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                        title="Start Date"
                                    />

                                    <input
                                        type="date"
                                        className="px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-xs min-w-[110px]"
                                        value={filters.endDate}
                                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                        title="End Date"
                                    />

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 ml-auto">
                                        <button
                                            onClick={() => exportLogs('csv')}
                                            className="flex items-center px-3 py-1.5 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors text-xs font-medium"
                                        >
                                            <Download className="w-3 h-3 mr-1" />
                                            Export
                                        </button>
                                        <button
                                            onClick={resetFilters}
                                            className="flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-xs font-medium"
                                        >
                                            <Filter className="w-3 h-3 mr-1" />
                                            Reset
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Filter Buttons for Project Managers */}
                                {/* {userRole === 'project_manager' && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <button
                                            onClick={() => handleFilterChange('resource', 'assignproject')}
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                                filters.resource === 'assignproject' 
                                                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                            }`}
                                        >
                                            Assignments
                                        </button>
                                        <button
                                            onClick={() => handleFilterChange('resource', 'auth')}
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                                filters.resource === 'auth' 
                                                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                            }`}
                                        >
                                            Login/Logout
                                        </button>
                                        <button
                                            onClick={() => handleFilterChange('resource', 'timesheets')}
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                                filters.resource === 'timesheets' 
                                                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                            }`}
                                        >
                                            Timesheets
                                        </button>
                                        <button
                                            onClick={() => handleFilterChange('resource', 'projects')}
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                                filters.resource === 'projects' 
                                                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                            }`}
                                        >
                                            Projects
                                        </button>
                                    </div>
                                )} */}
                            </div>

                            {/* Logs Display - Always Table Format */}
                            {loading ? (
                                <div className="flex justify-center items-center py-12 sm:py-16">
                                    <div className="flex flex-col items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600 mb-4"></div>
                                        <span className="text-base sm:text-lg text-gray-600">
                                            {userRole === 'admin' ? 'Loading system audit logs...' :
                                                userRole === 'project_manager' ? 'Loading team activity logs...' :
                                                    'Loading your audit logs...'}
                                        </span>
                                    </div>
                                </div>
                            ) : auditLogs.docs?.length === 0 ? (
                                <div className="text-center py-12 sm:py-16">
                                    <Activity className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4 sm:mb-6" />
                                    <p className="text-lg sm:text-xl text-gray-600 mb-2">
                                        {userRole === 'project_manager'
                                            ? 'No team activity logs found'
                                            : userRole === 'admin'
                                                ? 'No system audit logs found'
                                                : 'No audit logs found'
                                        }
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {userRole === 'project_manager'
                                            ? 'Try adjusting your filters or assign users to your projects'
                                            : 'Try adjusting your filters or check back later'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    {/* Mobile Swipe Hint */}
                                    <div className="block sm:hidden px-3 py-2 bg-blue-50 border-b border-purple-100">
                                        <p className="text-xs text-purple-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                            </svg>
                                            Swipe left to see all columns
                                        </p>
                                    </div>

                                    {/* Scrollable Table for All Screen Sizes */}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                                                        Date & Time
                                                    </th>
                                                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                                                        User
                                                    </th>
                                                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                                                        Action
                                                    </th>
                                                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                                                        Resource
                                                    </th>
                                                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        Message
                                                    </th>
                                                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {auditLogs.docs?.map((log, index) => {
                                                    const timestamp = formatTimestamp(log.createdAt);
                                                    return (
                                                        <tr key={log._id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                                            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                                <div className="flex items-center">
                                                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2 lg:mr-3" />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{timestamp.date}</span>
                                                                        <span className="text-xs text-gray-500">{timestamp.time}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2 lg:mr-3" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-32" title={log.userName || 'Unknown User'}>
                                                                            {log.userName || 'Unknown User'}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500 truncate max-w-32" title={log.userEmail}>
                                                                            {log.userEmail}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 whitespace-nowrap">
                                                                <div className={`inline-flex items-center px-1.5 sm:px-2 lg:px-3 py-1 rounded-full text-xs font-semibold border ${getActionStyle(log.action)}`}>
                                                                    <span>{log.action}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 whitespace-nowrap">
                                                                <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize bg-gray-100 px-1.5 sm:px-2 lg:px-3 py-1 rounded-full">
                                                                    {log.resource}
                                                                </span>
                                                            </td>
                                                            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                                                                <div className="flex items-start">
                                                                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2 lg:mr-3 mt-0.5 flex-shrink-0" />
                                                                    <div className="flex flex-col min-w-0 flex-1">
                                                                        <p className="text-xs sm:text-sm text-gray-900 break-words overflow-wrap-anywhere leading-relaxed" title={log.message}>
                                                                            {log.message}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-1.5 sm:px-2 lg:px-3 py-1 text-xs font-bold rounded-full border-2 ${getStatusColor(log.status)}`}>
                                                                    {log.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Compact Pagination */}
                            {auditLogs.totalPages > 1 && (
                                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg space-y-2 sm:space-y-0">
                                    <div className="text-xs text-gray-700 text-center sm:text-left">
                                        Page <span className="font-medium">{auditLogs.page}</span> of{' '}
                                        <span className="font-medium">{auditLogs.totalPages}</span>
                                        <span className="block sm:inline sm:ml-2">({auditLogs.totalDocs} records)</span>
                                    </div>
                                    <div className="flex justify-center sm:justify-end space-x-1 sm:space-x-2">
                                        <button
                                            disabled={auditLogs.page <= 1}
                                            onClick={() => handleFilterChange('page', filters.page - 1)}
                                            className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Prev
                                        </button>
                                        <span className="px-2 sm:px-3 py-1 text-xs text-gray-600 font-medium">
                                            {auditLogs.page}
                                        </span>
                                        <button
                                            disabled={auditLogs.page >= auditLogs.totalPages}
                                            onClick={() => handleFilterChange('page', filters.page + 1)}
                                            className="px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditDashboard;
