import React from 'react';
import { X, AlertTriangle, Clock } from 'lucide-react';

const ConfirmHoursModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  hoursData, 
  isLoading 
}) => {
  if (!isOpen) return null;

  const { fieldName, hours, totalHours } = hoursData || {};

  return (
    <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Confirm Hours Entry</h3>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-amber-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Hours Exceed Standard Workday
            </h4>
            
            <p className="text-gray-600 mb-4">
              You're about to log more than the standard 8-hour workday.
            </p>
          </div>

          {/* Hours Details */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Field:</span>
                <span className="text-gray-900 font-semibold">
                  {fieldName?.replace(/_/g, " ") || "Hours"}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Entered Hours:</span>
                <span className="text-amber-700 font-bold text-lg">
                  {hours} hours
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-amber-200">
                <span className="font-medium text-gray-700">Standard Day:</span>
                <span className="text-gray-600">8 hours</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Overtime:</span>
                <span className="text-red-600 font-semibold">
                  +{hours - 8} hours
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
       
          <p className="text-center text-sm text-gray-500 mb-6">
            Are you sure you want to proceed with this entry?
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  Yes, Log {hours} Hours
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmHoursModal;
