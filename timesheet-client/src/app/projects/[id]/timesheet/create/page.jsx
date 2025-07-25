'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function TimesheetForm() {
  const { id } = useParams(); // project ID
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) fetchProjectFields();
  }, [id]);

  const fetchProjectFields = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      const projectData = res.data?.data || res.data;

      setProject(projectData);

      // Initialize form data
      const initialFields = {};
      projectData?.fields?.forEach((f) => {
        initialFields[f.fieldName] = f.fieldType === 'Boolean' ? false : '';
      });
      setFormData(initialFields);
    } catch (error) {
      toast.error('Failed to load project schema');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        project: id,
        data: formData,
      };

      await api.post('/timesheets/create-timesheet', payload);
      toast.success('Timesheet submitted');

      // Reset form fields
      const resetFields = {};
      project?.fields?.forEach((f) => {
        resetFields[f.fieldName] = f.fieldType === 'Boolean' ? false : '';
      });
      setFormData(resetFields);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const { fieldName, fieldType } = field;

    switch (fieldType) {
      case 'String':
        return (
          <input
            type="text"
            name={fieldName}
            value={formData[fieldName] || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        );
      case 'Number':
        return (
          <input
            type="number"
            name={fieldName}
            value={formData[fieldName] || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        );
      case 'Date':
        return (
          <input
            type="date"
            name={fieldName}
            value={formData[fieldName] || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        );
      case 'Boolean':
        return (
          <input
            type="checkbox"
            name={fieldName}
            checked={formData[fieldName] || false}
            onChange={handleChange}
          />
        );
      default:
        return null;
    }
  };

  if (!project || !project.fields) {
    return <p className="text-center text-gray-600 py-8">Loading project fields...</p>;
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h2 className="text-2xl font-semibold text-blue-600 mb-4">
        Submit Timesheet for {project.name}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {project.fields.map((field, index) => (
          <div key={index}>
            <label className="block font-medium mb-1">{field.fieldName}</label>
            {renderField(field)}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          {loading ? 'Submitting...' : 'Submit Timesheet'}
        </button>
      </form>
    </div>
  );
}
