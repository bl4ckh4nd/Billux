import React from 'react';
import { CheckCircle, AlertCircle, Loader2, Clock, FileText } from 'lucide-react';
import { ProcessingStatus as ProcessingStatusType, ProcessingStep } from '../types/upload';

interface ProcessingStatusProps {
  status: ProcessingStatusType;
  className?: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status, className = '' }) => {
  const getStageIcon = (stage: ProcessingStatusType['stage']) => {
    switch (stage) {
      case 'upload':
        return <FileText className="w-5 h-5" />;
      case 'ocr':
        return <FileText className="w-5 h-5" />;
      case 'parsing':
        return <FileText className="w-5 h-5" />;
      case 'validation':
        return <CheckCircle className="w-5 h-5" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };
  
  const getStageLabel = (stage: ProcessingStatusType['stage']) => {
    switch (stage) {
      case 'upload':
        return 'Upload';
      case 'ocr':
        return 'OCR-Verarbeitung';
      case 'parsing':
        return 'Datenextraktion';
      case 'validation':
        return 'Validierung';
      case 'complete':
        return 'Abgeschlossen';
      default:
        return 'Verarbeitung';
    }
  };
  
  const getStageColor = (stage: ProcessingStatusType['stage']) => {
    switch (stage) {
      case 'upload':
        return 'text-blue-600';
      case 'ocr':
        return 'text-yellow-600';
      case 'parsing':
        return 'text-purple-600';
      case 'validation':
        return 'text-orange-600';
      case 'complete':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  const stages: ProcessingStatusType['stage'][] = ['upload', 'ocr', 'parsing', 'validation', 'complete'];
  const currentStageIndex = stages.indexOf(status.stage);
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Verarbeitungsstatus
        </h3>
        <div className="text-sm text-gray-500">
          Dokument: {status.documentId}
        </div>
      </div>
      
      {/* Current Stage Info */}
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2 rounded-full bg-gray-100 ${getStageColor(status.stage)}`}>
          {status.stage !== 'complete' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            getStageIcon(status.stage)
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">
              {getStageLabel(status.stage)}
            </span>
            <span className="text-sm text-gray-500">
              {status.progress}%
            </span>
          </div>
          <p className="text-sm text-gray-600">{status.message}</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>
      
      {/* Stage Progress */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {stages.map((stage, index) => {
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;
          const isPending = index > currentStageIndex;
          
          return (
            <div
              key={stage}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-50 border border-blue-200' 
                  : isCompleted 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`p-1 rounded-full ${
                isActive 
                  ? 'bg-blue-500 text-white' 
                  : isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3" />
                ) : isActive ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  getStageIcon(stage)
                )}
              </div>
              <span className={`text-xs font-medium text-center ${
                isActive 
                  ? 'text-blue-700' 
                  : isCompleted 
                    ? 'text-green-700' 
                    : 'text-gray-500'
              }`}>
                {getStageLabel(stage)}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Time Information */}
      <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-3">
        <div className="flex items-center space-x-4">
          <span>
            <Clock className="w-4 h-4 inline mr-1" />
            Verstrichene Zeit: {formatTime(Math.floor(status.timeElapsed / 1000))}
          </span>
          {status.estimatedTimeRemaining > 0 && (
            <span>
              Verbleibend: {formatTime(Math.floor(status.estimatedTimeRemaining / 1000))}
            </span>
          )}
        </div>
        <div className="text-right">
          {status.stage === 'complete' ? (
            <span className="text-green-600 font-medium">
              ✓ Erfolgreich abgeschlossen
            </span>
          ) : (
            <span>
              {status.progress < 100 ? 'Wird verarbeitet...' : 'Fast fertig...'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Component for displaying multiple processing statuses
interface ProcessingStatusListProps {
  statuses: ProcessingStatusType[];
  className?: string;
}

export const ProcessingStatusList: React.FC<ProcessingStatusListProps> = ({ 
  statuses, 
  className = '' 
}) => {
  const activeStatuses = statuses.filter(status => status.stage !== 'complete');
  const completedStatuses = statuses.filter(status => status.stage === 'complete');
  
  if (statuses.length === 0) {
    return null;
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Active Processing */}
      {activeStatuses.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Aktive Verarbeitung ({activeStatuses.length})
          </h4>
          <div className="space-y-3">
            {activeStatuses.map(status => (
              <ProcessingStatus key={status.documentId} status={status} />
            ))}
          </div>
        </div>
      )}
      
      {/* Completed Processing (collapsed) */}
      {completedStatuses.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Abgeschlossen ({completedStatuses.length})
          </h4>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700 font-medium">
                {completedStatuses.length} Dokument{completedStatuses.length !== 1 ? 'e' : ''} erfolgreich verarbeitet
              </span>
            </div>
            <div className="mt-2 text-sm text-green-600">
              Durchschnittliche Verarbeitungszeit: {' '}
              {formatTime(
                Math.floor(
                  completedStatuses.reduce((sum, s) => sum + s.timeElapsed, 0) / 
                  completedStatuses.length / 1000
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component for individual processing steps
interface ProcessingStepsProps {
  steps: ProcessingStep[];
  className?: string;
}

export const ProcessingSteps: React.FC<ProcessingStepsProps> = ({ steps, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center space-x-3 p-2 rounded">
          <div className={`w-2 h-2 rounded-full ${
            step.status === 'completed' ? 'bg-green-500' :
            step.status === 'running' ? 'bg-blue-500 animate-pulse' :
            step.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
          }`} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                step.status === 'failed' ? 'text-red-600' : 'text-gray-900'
              }`}>
                {step.name}
              </span>
              {step.duration && (
                <span className="text-xs text-gray-500">
                  {step.duration}ms
                </span>
              )}
            </div>
            {step.error && (
              <div className="flex items-center space-x-1 mt-1">
                <AlertCircle className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-600">{step.error}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export default ProcessingStatus;