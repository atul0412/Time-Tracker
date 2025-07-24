'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function CreateProject() {
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    fields: [],
  });

  const [errors, setErrors] = useState({});

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
      fields: [...prev.fields, { fieldName: '', fieldType: 'String' }],
    }));
  };

  const removeField = (index) => {
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
      setProjectData({ name: '', description: '', fields: [] });
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Add Project</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Project Name</label>
          <input
            type="text"
            name="name"
            value={projectData.name}
            onChange={handleChange}
            className={`w-full mt-1 p-2 border rounded-md ${
              errors.name ? 'border-red-500' : ''
            }`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block font-medium">Description</label>
          <textarea
            name="description"
            value={projectData.description}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded-md"
            rows="3"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Fields</label>

          {projectData.fields.map((field, index) => (
            <div key={index} className="flex gap-3 mb-2 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  name="fieldName"
                  placeholder="Field Name"
                  value={field.fieldName}
                  onChange={(e) => handleFieldChange(index, e)}
                  className={`w-full p-2 border rounded-md ${
                    errors[`fieldName_${index}`] ? 'border-red-500' : ''
                  }`}
                />
                {errors[`fieldName_${index}`] && (
                  <p className="text-red-500 text-sm">
                    {errors[`fieldName_${index}`]}
                  </p>
                )}
              </div>

              <div>
                <select
                  name="fieldType"
                  value={field.fieldType}
                  onChange={(e) => handleFieldChange(index, e)}
                  className={`p-2 border rounded-md ${
                    errors[`fieldType_${index}`] ? 'border-red-500' : ''
                  }`}
                >
                  <option value="" disabled>
                    Choose a fieldType
                  </option>
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

              <button
                type="button"
                onClick={() => removeField(index)}
                className="text-red-500 hover:text-red-700 mt-2"
              >
                X
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addField}
            className="mt-2 text-blue-600 font-semibold hover:underline"
          >
            + Add Field
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Create Project
        </button>
      </form>
    </div>
  );
}
