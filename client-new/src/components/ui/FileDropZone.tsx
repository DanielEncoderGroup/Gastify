import React, { useState, useRef } from 'react';
import Icon from './Icon';
import LoadingSpinner from './LoadingSpinner';

interface FileDropZoneProps {
  onFileUpload: (file: File) => void;
  loading?: boolean;
  accept?: string;
  maxSize?: number;
  className?: string;
  preview?: string;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFileUpload,
  loading = false,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  className = '',
  preview
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return 'El archivo es muy grande (máx. 5MB)';
    }
    if (!file.type.startsWith('image/')) {
      return 'Solo se permiten archivos de imagen';
    }
    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    onFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${dragActive 
            ? 'border-primary-500 bg-primary-50 scale-105' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${loading ? 'pointer-events-none' : ''}
        `}
      >
        <input 
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {loading ? (
          <div className="py-8">
            <LoadingSpinner withLogo size="lg" />
            <p className="mt-4 text-sm text-gray-600">
              Procesando imagen con IA...
            </p>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="relative mx-auto w-32 h-32 rounded-lg overflow-hidden shadow-md">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Icon name="PencilIcon" className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Imagen cargada exitosamente
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Haz clic o arrastra para cambiar
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              dragActive 
                ? 'bg-primary-100 scale-110' 
                : 'bg-gray-100'
            }`}>
              <Icon 
                name={dragActive ? "CloudArrowUpIcon" : "PhotoIcon"} 
                className={`h-8 w-8 transition-colors duration-300 ${
                  dragActive 
                    ? 'text-primary-600' 
                    : 'text-gray-400'
                }`} 
              />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {dragActive 
                  ? '¡Suelta la imagen aquí!' 
                  : 'Sube tu recibo'
                }
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Arrastra y suelta una imagen o{' '}
                <span className="text-primary-600 font-medium">
                  haz clic para seleccionar
                </span>
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <span>PNG, JPG, GIF hasta 5MB</span>
                <span>•</span>
                <span>Procesamiento automático con IA</span>
              </div>
            </div>
          </div>
        )}

        {/* Animación de ondas cuando está activo */}
        {dragActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-primary-300 rounded-lg animate-ping opacity-20"></div>
            <div className="absolute inset-8 border-2 border-primary-400 rounded-lg animate-ping opacity-30 animation-delay-200"></div>
          </div>
        )}
      </div>

      {/* Errores */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          <p>{error}</p>
        </div>
      )}

      {/* Consejos */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <Icon name="LightBulbIcon" className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">💡 Consejos para mejores resultados:</p>
            <ul className="space-y-1 text-blue-600">
              <li>• Asegúrate de que el texto sea legible</li>
              <li>• Evita sombras y reflejos</li>
              <li>• Mantén el recibo plano y bien iluminado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDropZone;
