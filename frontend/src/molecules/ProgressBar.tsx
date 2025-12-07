import React from 'react';
import { ProgressBar as BSProgressBar } from 'react-bootstrap';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
  showText?: boolean;
  className?: string;
  variant?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  label = '進捗:',
  showText = true,
  className = '',
  variant = 'primary',
}) => {
  const percentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className={`d-flex align-items-center ${className}`}>
      {label && <span className="text-sm text-gray-400 me-2">{label}</span>}

      <div className="w-100">
        <BSProgressBar
          now={percentage}
          variant={variant}
          className="h-2-5 rounded-full"
          label={showText ? `${currentStep} / ${totalSteps} 問` : undefined}
        />
      </div>

      {showText && (
        <span className="text-sm text-gray-400 ms-2">{`${currentStep} / ${totalSteps} 問`}</span>
      )}
    </div>
  );
};
