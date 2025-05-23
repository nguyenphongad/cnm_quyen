import { ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';

interface AlertProps {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string | ReactNode;
  className?: string;
}

const Alert = ({ type, message, className = '' }: AlertProps) => {
  const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-400',
    info: 'bg-blue-50 text-blue-800 border-blue-400',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-400',
    error: 'bg-red-50 text-red-800 border-red-400',
  };

  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />,
    info: <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />,
    error: <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />,
  };

  return (
    <div className={`rounded-md border px-4 py-3 ${typeStyles[type]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3">
          <div className="text-sm">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert; 