import React from 'react';
import { X, Plus, Calendar, User, AlertTriangle } from 'lucide-react';
import { formatDateToReadable } from '../../lib/dateFormate';

const AddTimesheetModal = ({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  isLoading,
  user,
  filteredFields
}) => {
  if (!isOpen) return null;

  // Helper function to check if field is hours-related
  const isHoursField = (fieldName) => {
    return fieldName.toLowerCase().includes("effort") ||
           fieldName.toLowerCase().includes("hours") ||
           fieldName.toLowerCase().includes("hour");
  };

  return (
    <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Add Timesheet Entry</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Developer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Developer Name</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              <User className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={user?.name || ""}
                readOnly
                className="flex-1 bg-transparent text-gray-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Dynamic fields */}
          {filteredFields?.map((field) => {
            const isDate = field.fieldType === "Date";
            const fieldValue = formData[field.fieldName];
            const isTaskField = field.fieldName.toLowerCase().includes("task");
            const isHours = isHoursField(field.fieldName);

            const inputValue = (() => {
              if (fieldValue !== undefined) {
                if (isDate && fieldValue) {
                  return formatDateToReadable(fieldValue);
                }
                return fieldValue;
              }
              return isDate ? formatDateToReadable(new Date()) : "";
            })();

            return (
              <div key={field.fieldName}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {field.fieldName.replace(/_/g, " ")}
                  {field.fieldType === "Date" && (
                    <span className="text-xs text-purple-600 font-normal ml-1">*</span>
                  )}
                </label>

                {field.fieldName === "Frontend/Backend" ? (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={inputValue}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.fieldName]: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select type</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                  </select>
                ) : isTaskField ? (
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    value={inputValue}
                    placeholder="Describe what you worked on..."
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [field.fieldName]: e.target.value,
                      }))
                    }
                  />
                ) : isDate ? (
                  <div className="relative">
                    <div className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-black font-medium flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors">
                      <span className="flex items-center gap-2">
                        {inputValue}
                      </span>
                      <span className="text-gray-600 text-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                      </span>
                    </div>

                    <input
                      type="date"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      value={fieldValue ? new Date(fieldValue).toISOString().split("T")[0] : new Date().toISOString().split("T")}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          [field.fieldName]: selectedDate,
                        }));
                      }}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type={
                        field.fieldType === "Number"
                          ? "number"
                          : "text"
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        isHours && Number(inputValue) > 8
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-gray-300'
                      }`}
                      value={inputValue}
                      placeholder={
                        field.fieldType === "Number"
                          ? "Enter number..."
                          : `Enter ${field.fieldName.toLowerCase()}...`
                      }
                      onChange={(e) => {
                        const value = field.fieldType === "Number"
                          ? (e.target.value === "" ? "" : Number(e.target.value))
                          : e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          [field.fieldName]: value,
                        }));
                      }}
                    />
                    
                    {/* Show warning for hours > 8 */}
                    {isHours && Number(inputValue) > 8 && (
                      <div className="mt-1 flex items-center gap-1 text-amber-600 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Hours exceed standard 8-hour workday</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end items-center">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTimesheetModal;
