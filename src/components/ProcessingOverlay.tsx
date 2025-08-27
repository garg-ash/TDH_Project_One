'use client';

import React from 'react';
import { X, Pause, Play, CheckCircle, AlertCircle, FileText, Download, Upload } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';

export default function ProcessingOverlay() {
  const { processingState, cancelProcessing, isProcessing } = useProcessing();

  if (!isProcessing) return null;

  const getIcon = () => {
    switch (processingState.type) {
      case 'import':
        return <Upload size={24} className="text-blue-600" />;
      case 'export':
        return <Download size={24} className="text-green-600" />;
      case 'download':
        return <Download size={24} className="text-purple-600" />;
      default:
        return <FileText size={24} className="text-gray-600" />;
    }
  };

  const getTypeColor = () => {
    switch (processingState.type) {
      case 'import':
        return 'border-blue-200 bg-blue-50';
      case 'export':
        return 'border-green-200 bg-green-50';
      case 'download':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getProgressColor = () => {
    if (processingState.progress >= 100) return 'bg-green-500';
    if (processingState.progress >= 80) return 'bg-blue-500';
    if (processingState.progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl border-2 ${getTypeColor()} max-w-md w-full mx-4`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 capitalize">
                {processingState.type} in Progress
              </h3>
              {processingState.fileName && (
                <p className="text-sm text-gray-600 truncate max-w-xs">
                  {processingState.fileName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={cancelProcessing}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Cancel operation"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Progress Section */}
        <div className="p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                {processingState.progress}% Complete
              </span>
              {processingState.totalSteps && processingState.currentStep && (
                <span className="text-xs text-gray-500">
                  Step {processingState.currentStep} of {processingState.totalSteps}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ease-out ${getProgressColor()}`}
                style={{ width: `${processingState.progress}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          <div className="mb-4">
            <p className="text-sm text-gray-700 text-center">
              {processingState.message}
            </p>
          </div>

          {/* Step Progress (if available) */}
          {processingState.totalSteps && processingState.totalSteps > 1 && (
            <div className="mb-4">
              <div className="flex space-x-1">
                {Array.from({ length: processingState.totalSteps }, (_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded ${
                      index < (processingState.currentStep || 0)
                        ? 'bg-green-500'
                        : index === (processingState.currentStep || 0)
                        ? 'bg-blue-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">
                Step {processingState.currentStep || 0} of {processingState.totalSteps}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Processing... Please wait</span>
          </div>
        </div>
      </div>
    </div>
  );
}
