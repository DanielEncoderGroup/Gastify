/**
 * Componente de imagen lazy loading optimizado para recibos
 */

import React, { useState, useRef, useEffect } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  fallback,
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const defaultPlaceholder = (
    <div className={`bg-gray-100 animate-pulse flex items-center justify-center ${className}`}>
      <DocumentTextIcon className="w-8 h-8 text-gray-400" />
    </div>
  );

  const defaultFallback = (
    <div className={`bg-gray-100 flex items-center justify-center text-gray-500 ${className}`}>
      <div className="text-center">
        <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Imagen no disponible</p>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {!isInView && (placeholder || defaultPlaceholder)}
      
      {isInView && (
        <>
          {isLoading && (placeholder || defaultPlaceholder)}
          
          {hasError ? (
            fallback || defaultFallback
          ) : (
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
              onLoad={handleLoad}
              onError={handleError}
              loading="lazy"
            />
          )}
        </>
      )}
    </div>
  );
};

export default LazyImage;
