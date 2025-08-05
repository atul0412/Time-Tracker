'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import { toast } from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

const defaultFields = [
  { fieldName: 'date', fieldType: 'Date', isDefault: true },
  { fieldName: 'task', fieldType: 'String', isDefault: true },
  { fieldName: 'workingHours', fieldType: 'Number', isDefault: true },
  { fieldName: 'Frontend/Backend', fieldType: 'String', isDefault: true } // ✅ New field added
];


export default function CreateProject() {
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    fields: [...defaultFields],
  });

  const [errors, setErrors] = useState({});
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
  };

  const addField = () => {
    setProjectData((prev) => ({
      ...prev,
      fields: [...prev.fields, { fieldName: '', fieldType: 'String', isDefault: false }],
    }));
  };

  const removeField = (index) => {
    const field = projectData.fields[index];
    if (field.isDefault) return; // prevent deleting default fields

    const updatedFields = [...projectData.fields];
    updatedFields.splice(index, 1);
    setProjectData((prev) => ({ ...prev, fields: updatedFields }));
  };

  const validate = () => {
    const newErrors = {};

    if (!projectData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    const fieldNames = projectData.fields.map((f) => f.fieldName.trim());
    const duplicates = fieldNames.filter((name, i) => fieldNames.indexOf(name) !== i);

    projectData.fields.forEach((field, index) => {
      if (!field.fieldName.trim()) {
        newErrors[`fieldName_${index}`] = 'Field name is required';
      } else if (duplicates.includes(field.fieldName.trim())) {
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

    try {
      await api.post('/projects/create', projectData);
      toast.success('Project created successfully');
      router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 px-6 py-8 bg-gray-200 shadow-xl rounded-2xl">
      <h2 className="text-3xl font-extrabold mb-6 text-purple-950">Add New Project</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-1000">Project Name</label>
          <input
            type="text"
            name="name"
            value={projectData.name}
            onChange={handleChange}
            placeholder="Enter project name"
            className={`mt-2 w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-800 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-1000">Description</label>
          <textarea
            name="description"
            value={projectData.description}
            onChange={handleChange}
            placeholder="Brief project description"
            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-800"
            rows="4"
          />
        </div>

        {/* Dynamic Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-1000 mb-2">Project Fields</label>

          {projectData.fields.map((field, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="fieldName"
                  placeholder="Field Name"
                  value={field.fieldName}
                  onChange={(e) => handleFieldChange(index, e)}
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2
                  ${errors[`fieldName_${index}`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-800'}
                  ${field.isDefault ? 'text-gray-600 bg-gray-100 cursor-not-allowed' : 'text-black'}
                `}
                  disabled={field.isDefault}
                />
                {errors[`fieldName_${index}`] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[`fieldName_${index}`]}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-48">
                <select
                  name="fieldType"
                  value={field.fieldType} // fallback to empty string if undefined
                  onChange={(e) => handleFieldChange(index, e)}
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2
                  ${errors[`fieldName_${index}`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-800'}
                  ${field.isDefault ? 'text-gray-600 bg-gray-100 cursor-not-allowed' : 'text-black'} `}
                  disabled={field.isDefault} // prevent changing type of default fields
                >
                  <option value="" disabled>Choose a Field Type</option>
                  <option value="String">String</option>
                  <option value="Number">Number</option>
                  <option value="Date">Date</option>
                  <option value="Boolean">Boolean</option>
                </select>

                {errors[`fieldType_${index}`] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[`fieldType_${index}`]}
                  </p>
                )}
              </div>


              {!field.isDefault && (
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="text-red-500 hover:text-red-1000 mt-1 sm:mt-0"
                >
                  <Trash2 size={14} className="mr-1" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addField}
            className="mt-2 text-sm font-semibold text-purple-800 hover:underline"
          >
            + Add Field
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-purple-800 hover:bg-purple-900 text-white font-semibold py-3 rounded-lg shadow-md transition"
        >
          Create Project
        </button>
      </form>
    </div>
  );
}
