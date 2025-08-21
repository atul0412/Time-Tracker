import React from 'react';
import Select from 'react-select';
import { X, Save, Trash2, FileText, Plus } from 'lucide-react';

const EditProjectModal = ({
  open,
  onClose,
  onSave,
  formData,
  setFormData,
  users,
  usersLoading,
  usersError,
  editLoading
}) => {
  if (!open) return null;

  // Filter custom fields (remove default ones)
  const customFields = formData.fields?.filter(field => {
    const defaultFields = [
      "task", "date", "Effort Hours", "Frontend/Backend", "Developer Name", "Task"
    ];
    return !defaultFields.includes(field.fieldName);
  }) || [];

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Edit Project Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Project Managers Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Managers *
            </label>
            <Select
              isMulti
              options={users}
              value={formData.projectManagers || []}
              onChange={selectedOptions => {
                setFormData(prev => ({
                  ...prev,
                  projectManagers: selectedOptions || []
                }));
              }}
              placeholder="Select project managers..."
              isLoading={usersLoading}
              isDisabled={usersLoading}
              className="react-select-container"
              classNamePrefix="react-select"
              isSearchable
              isClearable
              closeMenuOnSelect={true}
              hideSelectedOptions={false}
              blurInputOnSelect={false}
              noOptionsMessage={() =>
                <div className="text-gray-500 text-sm py-2 px-3">
                  {usersError ? 'Error loading users' : 'No users found'}
                </div>
              }
              loadingMessage={() =>
                <div className="text-gray-500 text-sm py-2 px-3 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  Loading users...
                </div>
              }
              formatOptionLabel={option => {
                if (!option) return null;
                const displayName = option.label || 'Unknown User';
                const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                return (
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 text-sm">{displayName}</span>
                      <span className="text-xs text-gray-500">{option.email || 'No email'}</span>
                    </div>
                  </div>
                );
              }}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
            />

            {/* Selected Preview */}
            {formData.projectManagers?.length > 0 && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700 font-medium mb-2">
                  Selected Project Managers ({formData.projectManagers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.projectManagers.map((manager, index) => {
                    const displayName = manager.label || 'Unknown User';
                    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                    return (
                      <div key={manager.value || index} className="flex items-center gap-2 bg-white px-2 py-1 rounded-full border border-purple-200 text-sm">
                        <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {initials}
                        </div>
                        <span className="text-gray-700">{displayName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Custom Fields Only */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Custom Fields</h4>
            {customFields.map((field, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Field {index + 1}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const customFieldsList = formData.fields.filter(f => {
                        const defaultFields = [
                          "task", "date", "workingHours", "Frontend/Backend",
                          "Developer Name", "Task", "Date", "Working Hours"
                        ];
                        return !defaultFields.includes(f.fieldName);
                      });
                      const updated = formData.fields.filter((_, i) =>
                        i !== customFieldsList.findIndex(cf => cf.fieldName === field.fieldName)
                      );
                      setFormData(prev => ({
                        ...prev,
                        fields: updated
                      }));
                    }}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                    title="Delete field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Field Name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={field.fieldName}
                    onChange={e => {
                      const updated = [...formData.fields];
                      const actualIndex = updated.findIndex(f => f.fieldName === field.fieldName && f.fieldType === field.fieldType);
                      if (actualIndex !== -1) {
                        updated[actualIndex].fieldName = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          fields: updated
                        }));
                      }
                    }}
                  />
                  <select
                    className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={field.fieldType}
                    onChange={e => {
                      const updated = [...formData.fields];
                      const actualIndex = updated.findIndex(f => f.fieldName === field.fieldName && f.fieldType === field.fieldType);
                      if (actualIndex !== -1) {
                        updated[actualIndex].fieldType = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          fields: updated
                        }));
                      }
                    }}
                  >
                    <option value="String">String</option>
                    <option value="Number">Number</option>
                    <option value="Date">Date</option>
                    <option value="Boolean">Boolean</option>
                  </select>
                </div>
              </div>
            ))}
            {/* If no custom fields yet */}
            {customFields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No custom fields added yet</p>
                <p className="text-sm">Click "Add Custom Field" to create one</p>
              </div>
            )}
          </div>

          {/* Add New Field Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  fields: [...prev.fields, { fieldName: "", fieldType: "String" }]
                }));
              }}
              className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Custom Field
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={editLoading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={editLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {editLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProjectModal;
