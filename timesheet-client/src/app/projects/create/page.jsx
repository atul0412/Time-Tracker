'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Save
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
    default: return Type;
  }
};

export default function CreateProject() {
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    fields: [...defaultFields],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProjectData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFieldChange = (index, e) => {
    const { name, value } = e.target;
    const updatedFields = [...projectData.fields];
    updatedFields[index][name] = value;
    setProjectData((prev) => ({ ...prev, fields: updatedFields }));
    
    // Clear field-specific errors
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
      await api.post('/projects/create', projectData);
      toast.success('Project created successfully');
      router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto">
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

          {/* Page Title */}
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
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.name 
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

            {/* Project Fields Section */}
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
                        className={`p-4 rounded-lg border transition-all ${
                          field.isDefault 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-white border-purple-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* Field Icon and Info */}
                          <div className="flex items-center gap-3 lg:min-w-0 lg:flex-1">
                            <div className={`p-2 rounded-lg ${
                              field.isDefault ? 'bg-gray-200' : 'bg-purple-100'
                            }`}>
                              <IconComponent className={`w-4 h-4 ${
                                field.isDefault ? 'text-gray-600' : 'text-purple-600'
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
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                  errors[`fieldName_${index}`]
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

                          {/* Field Type and Actions */}
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
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                  errors[`fieldType_${index}`]
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
                              </select>
                              {errors[`fieldType_${index}`] && (
                                <p className="text-red-600 text-sm mt-1">
                                  {errors[`fieldType_${index}`]}
                                </p>
                              )}
                            </div>

                            {/* Remove Button */}
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

                      {/* Separator Line - Only show if not the last field */}
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

              {/* Add Field Button */}
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
