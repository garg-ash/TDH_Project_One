'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

export type ProcessingType = 'import' | 'export' | 'download' | null;

export interface ProcessingState {
  isProcessing: boolean;
  type: ProcessingType;
  progress: number;
  message: string;
  fileName?: string;
  totalSteps?: number;
  currentStep?: number;
}

interface ProcessingContextValue {
  processingState: ProcessingState;
  startProcessing: (type: ProcessingType, fileName?: string, totalSteps?: number) => boolean;
  updateProgress: (progress: number, message?: string, currentStep?: number) => void;
  completeProcessing: (success: boolean, finalMessage?: string) => void;
  cancelProcessing: () => void;
  isProcessing: boolean;
}

const ProcessingContext = createContext<ProcessingContextValue | undefined>(undefined);

export const ProcessingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    type: null,
    progress: 0,
    message: '',
    fileName: undefined,
    totalSteps: undefined,
    currentStep: undefined,
  });

  const startProcessing = useCallback((type: ProcessingType, fileName?: string, totalSteps?: number) => {
    if (processingState.isProcessing) {
      console.warn(`Cannot start ${type} - another operation is already in progress`);
      return false;
    }

    setProcessingState({
      isProcessing: true,
      type,
      progress: 0,
      message: `Starting ${type}...`,
      fileName,
      totalSteps,
      currentStep: 1,
    });
    return true;
  }, [processingState.isProcessing]);

  const updateProgress = useCallback((progress: number, message?: string, currentStep?: number) => {
    setProcessingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      message: message || prev.message,
      currentStep: currentStep || prev.currentStep,
    }));
  }, []);

  const completeProcessing = useCallback((success: boolean, finalMessage?: string) => {
    setProcessingState(prev => ({
      ...prev,
      isProcessing: false,
      progress: 100,
      message: finalMessage || (success ? 'Operation completed successfully!' : 'Operation failed'),
    }));

    // Auto-reset after 3 seconds
    setTimeout(() => {
      setProcessingState({
        isProcessing: false,
        type: null,
        progress: 0,
        message: '',
        fileName: undefined,
        totalSteps: undefined,
        currentStep: undefined,
      });
    }, 3000);
  }, []);

  const cancelProcessing = useCallback(() => {
    setProcessingState({
      isProcessing: false,
      type: null,
      progress: 0,
      message: 'Operation cancelled',
      fileName: undefined,
      totalSteps: undefined,
      currentStep: undefined,
    });
  }, []);

  const value: ProcessingContextValue = {
    processingState,
    startProcessing,
    updateProgress,
    completeProcessing,
    cancelProcessing,
    isProcessing: processingState.isProcessing,
  };

  return (
    <ProcessingContext.Provider value={value}>
      {children}
    </ProcessingContext.Provider>
  );
};

export const useProcessing = (): ProcessingContextValue => {
  const ctx = useContext(ProcessingContext);
  if (!ctx) throw new Error('useProcessing must be used within ProcessingProvider');
  return ctx;
};
