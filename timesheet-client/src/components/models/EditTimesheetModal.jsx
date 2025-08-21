import React, { useState } from 'react';
import { X, Save, Calendar, AlertTriangle } from 'lucide-react';
import { formatDateToReadable } from '../../lib/dateFormate';
import ConfirmHoursModal from './confirmationHours';

const EditTimesheetModal = ({
    isOpen,
    onClose,
    onSave,
    formData,
    setFormData,
    isLoading,
    projectFields // ✅ Add this prop to access project fields for hours validation
}) => {
    // ✅ Add states for hours confirmation
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmHoursData, setConfirmHoursData] = useState(null);

    if (!isOpen) return null;

    // ✅ Updated save handler with hours validation
    const handleSave = async () => {
        try {
            // Check for effort/working hours exceeding 8 hours
            const hoursFields = projectFields?.filter(field =>
                field.fieldName.toLowerCase().includes("effort") ||
                field.fieldName.toLowerCase().includes("hours") ||
                field.fieldName.toLowerCase().includes("hour")
            ) || [];

            let exceedsEightHours = false;
            let hoursData = null;

            // Check each hours field in formData
            hoursFields.forEach(field => {
                const hours = Number(formData[field.fieldName]) || 0;
                if (hours > 8) {
                    exceedsEightHours = true;
                    hoursData = {
                        fieldName: field.fieldName,
                        hours: hours,
                        totalHours: hours
                    };
                }
            });

            // Show confirmation modal if hours exceed 8
            if (exceedsEightHours) {
                setConfirmHoursData(hoursData);
                setShowConfirmModal(true);
                return; // Wait for user confirmation
            }

            // Proceed with normal save
            await onSave();

        } catch (error) {
            console.error("Error in handleSave:", error);
        }
    };

    // ✅ Handlers for confirmation modal
    const handleConfirmHours = async () => {
        setShowConfirmModal(false);
        setConfirmHoursData(null);
        await onSave();
    };

    const handleCancelConfirm = () => {
        setShowConfirmModal(false);
        setConfirmHoursData(null);
    };

    return (
        <>
            <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-900">Edit Timesheet Entry</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Date field with formatted display */}
                        {formData.date && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Entry Date
                                    <span className="text-xs text-purple-600 font-normal ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <div className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 font-medium flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors">
                                        <span className="flex items-center gap-2">
                                            {formatDateToReadable(formData.date)}
                                        </span>
                                        <span className="text-purple-600 text-sm flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                        </span>
                                    </div>

                                    <input
                                        type="date"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        value={formData.date.slice(0, 10)}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                date: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {/* Other fields */}
                        {Object.entries(formData).map(([key, value]) => {
                            if (key === 'date') return null;

                            const isTaskField = key.toLowerCase() === 'task';
                            const isDateField = key.toLowerCase().includes('date');
                            // ✅ Check if this is an effort/hours field
                            const isHoursField = key.toLowerCase().includes("effort") ||
                                key.toLowerCase().includes("hours") ||
                                key.toLowerCase().includes("hour");
                            const inputType =
                                typeof value === 'number' || key.toLowerCase().includes('hours')
                                    ? 'number'
                                    : isDateField
                                        ? 'date'
                                        : 'text';

                            return (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                                        {key.replace(/_/g, ' ')}
                                        {isDateField && (
                                            <span className="text-xs text-purple-600 font-normal ml-1">*</span>
                                        )}
                                    </label>

                                    {isTaskField ? (
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none"
                                            value={value}
                                            placeholder="Describe what you worked on..."
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    [key]: e.target.value,
                                                }))
                                            }
                                        />
                                    ) : isDateField ? (
                                        <div className="relative">
                                            <div className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 font-medium flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors">
                                                <span className="flex items-center gap-2">
                                                    {value ? formatDateToReadable(value) : 'Select date'}
                                                </span>
                                                <span className="text-purple-600 text-sm flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                </span>
                                            </div>

                                            <input
                                                type="date"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                value={value || ''}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        [key]: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    ) : (
                                        // ✅ Updated input with hours warning
                                        <div className="relative">
                                            <input
                                                type={inputType}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${isHoursField && Number(value) > 8
                                                        ? 'border-amber-300 bg-amber-50'
                                                        : 'border-gray-300'
                                                    }`}
                                                value={value || ''}
                                                placeholder={
                                                    inputType === 'number'
                                                        ? "Enter number..."
                                                        : `Enter ${key.toLowerCase().replace(/_/g, ' ')}...`
                                                }
                                                onChange={(e) => {
                                                    const newValue = inputType === 'number'
                                                        ? (e.target.value === "" ? "" : Number(e.target.value))
                                                        : e.target.value;
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        [key]: newValue,
                                                    }));
                                                }}
                                            />

                                            {/* ✅ Show warning for hours > 8 */}
                                            {isHoursField && Number(value) > 8 && (
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
                                    onClick={handleSave} // ✅ Updated to use new handler
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Update Entry
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ Hours Confirmation Modal */}
            <ConfirmHoursModal
                isOpen={showConfirmModal}
                onConfirm={handleConfirmHours}
                onCancel={handleCancelConfirm}
                hoursData={confirmHoursData}
                isLoading={isLoading}
            />
        </>
    );
};

export default EditTimesheetModal;
