import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import Card from './Card';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  icon,
  isLoading = false
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          defaultIcon: '🗑️'
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          defaultIcon: '⚠️'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
          defaultIcon: 'ℹ️'
        };
      default:
        return {
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          confirmBg: 'bg-gray-600 hover:bg-gray-700',
          defaultIcon: '❓'
        };
    }
  };

  const styles = getTypeStyles();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        
        {/* Modal Container */}
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="p-6">
              <div className="sm:flex sm:items-start">
                {/* Icon */}
                <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                  <div className={`text-xl ${styles.iconColor}`}>
                    {icon || styles.defaultIcon}
                  </div>
                </div>
                
                {/* Content */}
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">
                    {title}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {message}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`w-full sm:ml-3 sm:w-auto focus:ring-2 focus:ring-offset-2 ${
                    type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </div>
                  ) : (
                    confirmText
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  {cancelText}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;
