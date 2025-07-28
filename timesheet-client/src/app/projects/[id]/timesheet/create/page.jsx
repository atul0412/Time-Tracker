'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function TimesheetForm() {
  const { id } = useParams(); // project ID
  const router = useRouter();

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

      // Redirect to project detail page after submission
      router.push(`/projects/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const { fieldName, fieldType } = field;

    const commonClasses =
      'w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-950';

    switch (fieldType) {
      case 'String':
        return (
          <input
            type="text"
            name={fieldName}
            value={formData[fieldName] || ''}
            onChange={handleChange}
            className={commonClasses}
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
            className={commonClasses}
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
            className={commonClasses}
            required
          />
        );
      case 'Boolean':
        return (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              name={fieldName}
              checked={formData[fieldName] || false}
              onChange={handleChange}
              className="h-4 w-4 text-purple-950 focus:ring-purple-950 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Yes / No</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!project || !project.fields) {
    return (
      <p className="text-center text-gray-600 py-10 text-lg">
        Loading project fields...
      </p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 px-6 py-8 bg-white shadow-xl rounded-2xl">
      <h2 className="text-3xl font-bold text-purple-950 mb-6">Submit Timesheet</h2>
      <p className="text-gray-700 mb-6 text-lg">
        Project:{' '}
        <span className="font-medium text-gray-900">{project.name}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {project.fields.map((field, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              {field.fieldName}
            </label>
            {renderField(field)}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-700 hover:bg-purple-950 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200"
        >
          {loading ? 'Submitting...' : 'Submit Timesheet'}
        </button>
      </form>
    </div>
  );
}
