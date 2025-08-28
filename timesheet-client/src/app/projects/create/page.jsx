'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import api from '../../../lib/axios';
import { toast } from 'react-hot-toast';
import {
  Trash2,
  Plus,
  FolderPlus,
  ArrowLeft,
  Settings,
  Type,
  Calendar,
  Hash,
  ToggleLeft,
  Save,
  Users
} from 'lucide-react';

const defaultFields = [
  { fieldName: 'date', fieldType: 'Date', isDefault: true },
  { fieldName: 'task', fieldType: 'String', isDefault: true },
  { fieldName: 'Developer Name', fieldType: 'String', isDefault: true },
  { fieldName: 'Effort Hours', fieldType: 'Number', isDefault: true },
  { fieldName: 'Frontend/Backend', fieldType: 'String', isDefault: true },
];

const getFieldIcon = (fieldType) => {
  switch (fieldType) {
    case 'Date': return Calendar;
    case 'Number': return Hash;
    case 'Boolean': return ToggleLeft;
    case 'User': return Users;
    default: return Type;
  }
};

export default function CreateProject() {
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    fields: [...defaultFields],
    projectManagers: [],
  });

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError(false);

      const response = await api.get('/users/getAlluser');
      console.log('Fetched users:', response.data);

      // Handle different possible data structures
      const userOptions = response.data.map(user => ({
        value: user._id || user.id,
        label: user.name || `${user.name || ''}`.trim() || user.email || 'Unknown User',
        email: user.email || '',
        role: user.role || 'User'
      }));

      console.log('Mapped user options:', userOptions);
      setUsers(userOptions);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsersError(true);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProjectData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Handle project managers selection
  const handleProjectManagersChange = (selectedOptions) => {
    console.log('Selected options:', selectedOptions);
    setProjectData((prev) => ({
      ...prev,
      projectManagers: selectedOptions || []
    }));
    setErrors((prev) => ({ ...prev, projectManagers: '' }));
  };

  const handleFieldChange = (index, e) => {
    const { name, value } = e.target;
    const updatedFields = [...projectData.fields];
    updatedFields[index][name] = value;
    setProjectData((prev) => ({ ...prev, fields: updatedFields }));

    setErrors((prev) => ({
      ...prev,
      [`fieldName_${index}`]: '',
      [`fieldType_${index}`]: ''
    }));
  };

  const addField = () => {
    setProjectData((prev) => ({
      ...prev,
      fields: [...prev.fields, { fieldName: '', fieldType: 'String', isDefault: false }],
    }));
  };

  const removeField = (index) => {
    const field = projectData.fields[index];
    if (field.isDefault) return;

    const updatedFields = [...projectData.fields];
    updatedFields.splice(index, 1);
    setProjectData((prev) => ({ ...prev, fields: updatedFields }));
  };

  const validate = () => {
    const newErrors = {};

    if (!projectData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (projectData.projectManagers.length === 0) {
      newErrors.projectManagers = 'At least one project manager is required';
    }

    const fieldNames = projectData.fields
      .map((f) => f.fieldName.trim().toLowerCase())
      .filter(name => name !== '');

    const duplicates = fieldNames.filter((name, i) => fieldNames.indexOf(name) !== i);

    projectData.fields.forEach((field, index) => {
      if (!field.fieldName.trim()) {
        newErrors[`fieldName_${index}`] = 'Field name is required';
      } else if (duplicates.includes(field.fieldName.trim().toLowerCase())) {
        newErrors[`fieldName_${index}`] = 'Duplicate field name';
      }

      if (!field.fieldType) {
        newErrors[`fieldType_${index}`] = 'Field type is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Transform project managers to just IDs for backend
      const submitData = {
        ...projectData,
        projectManagers: projectData.projectManagers.map(pm => pm.value)
      };

      await api.post('/projects/create', submitData);
      console.log('Project created successfully:', submitData);
      toast.success('Project created successfully');
      router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" bg-gradient-to-br ">
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-purple-600 hover:text-purple-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-3 rounded-xl">
              <FolderPlus className="w-8 h-8 text-purple-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-gray-600 mt-1">Set up a new project with custom fields for timesheet tracking</p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-300">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Project Configuration
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={projectData.name}
                  onChange={handleChange}
                  placeholder="Enter a descriptive project name"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${errors.name
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500'
                    }`}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <span className="w-4 h-4 text-red-500">⚠</span>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Project Managers Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Managers *
                </label>
                <Select
                  isMulti
                  // ✅ Filter here so dropdown only shows project managers
                  options={users.filter((user) => user.role === "project_manager")}
                  value={projectData.projectManagers}
                  onChange={handleProjectManagersChange}
                  placeholder={usersLoading ? "Loading users..." : "Select project managers..."}
                  isLoading={usersLoading}
                  isDisabled={usersLoading}
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      minHeight: "48px",
                      borderColor: errors.projectManagers
                        ? "#ef4444"
                        : state.isFocused
                          ? "#8b5cf6"
                          : "#d1d5db",
                      borderRadius: "8px",
                      borderWidth: "1px",
                      boxShadow: state.isFocused
                        ? errors.projectManagers
                          ? "0 0 0 3px rgba(239, 68, 68, 0.1)"
                          : "0 0 0 3px rgba(139, 92, 246, 0.1)"
                        : "none",
                      padding: "4px 8px",
                      backgroundColor: "white",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        borderColor: errors.projectManagers ? "#ef4444" : "#8b5cf6",
                      },
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      padding: "2px 8px",
                      gap: "6px",
                    }),
                    multiValue: (provided) => ({
                      ...provided,
                      backgroundColor: "#ede9fe",
                      border: "1px solid #c4b5fd",
                      borderRadius: "6px",
                      margin: "2px",
                      padding: "2px",
                    }),
                    multiValueLabel: (provided) => ({
                      ...provided,
                      color: "#5b21b6",
                      fontSize: "14px",
                      fontWeight: "500",
                      padding: "4px 8px",
                    }),
                    multiValueRemove: (provided) => ({
                      ...provided,
                      color: "#8b5cf6",
                      borderRadius: "4px",
                      padding: "4px",
                      margin: "0 2px",
                      "&:hover": {
                        backgroundColor: "#ef4444",
                        color: "white",
                      },
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: "#9ca3af",
                      fontSize: "14px",
                      fontWeight: "400",
                    }),
                    input: (provided) => ({
                      ...provided,
                      color: "#374151",
                      fontSize: "14px",
                    }),
                    menu: (provided) => ({
                      ...provided,
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow:
                        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      zIndex: 9999,
                    }),
                    menuList: (provided) => ({
                      ...provided,
                      padding: "4px",
                      maxHeight: "240px",
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isSelected
                        ? "#8b5cf6"
                        : state.isFocused
                          ? "#f3f4f6"
                          : "white",
                      color: state.isSelected ? "white" : "#374151",
                      padding: "12px",
                      borderRadius: "6px",
                      margin: "2px 0",
                      cursor: "pointer",
                      transition: "all 0.15s ease-in-out",
                      "&:hover": {
                        backgroundColor: state.isSelected ? "#7c3aed" : "#f9fafb",
                      },
                    }),
                    indicatorSeparator: (provided) => ({
                      ...provided,
                      backgroundColor: "#e5e7eb",
                    }),
                    dropdownIndicator: (provided, state) => ({
                      ...provided,
                      color: state.isFocused ? "#8b5cf6" : "#6b7280",
                      padding: "8px",
                      "&:hover": {
                        color: "#8b5cf6",
                      },
                    }),
                    clearIndicator: (provided) => ({
                      ...provided,
                      color: "#6b7280",
                      padding: "8px",
                      "&:hover": {
                        color: "#ef4444",
                      },
                    }),
                  }}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isSearchable
                  isClearable
                  closeMenuOnSelect={true}
                  hideSelectedOptions={false}
                  blurInputOnSelect={false}
                  noOptionsMessage={() => (
                    <div className="text-gray-500 text-sm py-2 px-3">
                      {usersError ? "Error loading users" : "No users found"}
                    </div>
                  )}
                  loadingMessage={() => (
                    <div className="text-gray-500 text-sm py-2 px-3 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      Loading users...
                    </div>
                  )}
                  formatOptionLabel={(option) => {
                    if (!option) return null;

                    const displayName = option.label || "Unknown User";
                    const initials =
                      displayName.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

                    return (
                      <div className="flex items-center gap-3 py-1">
                        {/* User Avatar */}
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {initials}
                        </div>
                        {/* User Info */}
                        <div className="flex flex-col flex-1">
                          <span className="font-medium text-gray-900">{displayName}</span>
                          <span className="text-sm text-gray-500">
                            {option.email || "No email"}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                  getOptionLabel={(option) => option.label}
                  getOptionValue={(option) => option.value}
                />

                {/* Retry button for failed user loading */}
                {usersError && (
                  <button
                    type="button"
                    onClick={fetchUsers}
                    className="mt-2 text-sm text-purple-600 hover:text-purple-800 underline"
                  >
                    Retry loading users
                  </button>
                )}

                {/* Error Message */}
                {errors.projectManagers && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.projectManagers}
                    </p>
                  </div>
                )}

                {/* Selected Users Summary */}
                {projectData.projectManagers &&
                  projectData.projectManagers.length > 0 && (
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-700 font-medium mb-2">
                        Selected Project Managers ({projectData.projectManagers.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {projectData.projectManagers.map((manager, index) => {
                          const displayName = manager.label || "Unknown User";
                          const initials =
                            displayName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "?";

                          return (
                            <div
                              key={manager.value || index}
                              className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-purple-200"
                            >
                              <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {initials}
                              </div>
                              <span className="text-sm text-gray-700">{displayName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>


              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <textarea
                  name="description"
                  value={projectData.description}
                  onChange={handleChange}
                  placeholder="Provide a brief description of the project"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Timesheet Fields Configuration */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-400 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Timesheet Fields Configuration
                </h3>
                <span className="text-sm text-gray-500">
                  {projectData.fields.length} fields configured
                </span>
              </div>

              {/* Fields List */}
              <div className="space-y-4">
                {projectData.fields.map((field, index) => {
                  const IconComponent = getFieldIcon(field.fieldType);
                  const isLastField = index === projectData.fields.length - 1;

                  return (
                    <div key={index}>
                      <div
                        className={`p-4 rounded-lg border transition-all ${field.isDefault
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-white border-purple-200 hover:border-purple-300'
                          }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex items-center gap-3 lg:min-w-0 lg:flex-1">
                            <div className={`p-2 rounded-lg ${field.isDefault ? 'bg-gray-200' : 'bg-purple-100'
                              }`}>
                              <IconComponent className={`w-4 h-4 ${field.isDefault ? 'text-gray-600' : 'text-purple-600'
                                }`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Field Name {!field.isDefault && '*'}
                              </label>
                              <input
                                type="text"
                                name="fieldName"
                                placeholder="Enter field name"
                                value={field.fieldName}
                                onChange={(e) => handleFieldChange(index, e)}
                                disabled={field.isDefault}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors[`fieldName_${index}`]
                                    ? 'border-red-300 focus:ring-red-500'
                                    : field.isDefault
                                      ? 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                                      : 'border-gray-300 focus:ring-purple-500'
                                  }`}
                              />
                              {errors[`fieldName_${index}`] && (
                                <p className="text-red-600 text-sm mt-1">
                                  {errors[`fieldName_${index}`]}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-end gap-3">
                            <div className="w-full lg:w-44">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Data Type
                              </label>
                              <select
                                name="fieldType"
                                value={field.fieldType}
                                onChange={(e) => handleFieldChange(index, e)}
                                disabled={field.isDefault}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors[`fieldType_${index}`]
                                    ? 'border-red-300 focus:ring-red-500'
                                    : field.isDefault
                                      ? 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                                      : 'border-gray-300 focus:ring-purple-500'
                                  }`}
                              >
                                <option value="String">Text</option>
                                <option value="Number">Number</option>
                                <option value="Date">Date</option>
                                <option value="Boolean">Yes/No</option>
                                <option value="User">User Selection</option>
                              </select>
                              {errors[`fieldType_${index}`] && (
                                <p className="text-red-600 text-sm mt-1">
                                  {errors[`fieldType_${index}`]}
                                </p>
                              )}
                            </div>

                            {!field.isDefault && (
                              <button
                                type="button"
                                onClick={() => removeField(index)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove field"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {field.isDefault && (
                          <div className="mt-2 text-xs text-gray-500 italic">
                            Required system field
                          </div>
                        )}
                      </div>

                      {!isLastField && (
                        <div className="flex items-center my-4">
                          <div className="flex-1 border-t border-gray-300"></div>
                          <div className="px-3">
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          </div>
                          <div className="flex-1 border-t border-gray-300"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addField}
                className="w-full p-4 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:text-purple-800 hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Custom Field
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
