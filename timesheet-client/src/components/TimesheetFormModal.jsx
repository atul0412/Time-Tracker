
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function TimesheetFormModal({ projectId, onClose, onSuccess }) {
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) fetchProjectFields();
  }, [projectId]);

  const fetchProjectFields = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      const projectData = res.data?.data || res.data;
      setProject(projectData);

      const initialFields = {};
      projectData?.fields?.forEach((f) => {
        initialFields[f.fieldName] = f.fieldType === 'Boolean' ? false : '';
      });
      setFormData(initialFields);
    } catch {
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
      await api.post('/timesheets/create-timesheet', {
        project: projectId,
        data: formData,
      });

      toast.success('Timesheet submitted');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (!project) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <p className="text-center text-gray-600">Loading form...</p>
      </div>
    );
  }

  const renderField = (field) => {
    const { fieldName, fieldType } = field;
    const commonClasses =
      'w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-950';

    switch (fieldType) {
      case 'String':
      case 'Number':
      case 'Date':
        return (
          <input
            type={fieldType.toLowerCase()}
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl relative">
        <h2 className="text-2xl font-bold text-purple-950 mb-6">Submit Timesheet</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {project.fields.map((field, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                {field.fieldName}
              </label>
              {renderField(field)}
            </div>
          ))}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
