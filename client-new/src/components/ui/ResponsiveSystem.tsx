import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

// Hook para detectar breakpoints
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1024) setBreakpoint('lg');
      else if (width < 1280) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint)
  };
};

// Hook para detectar orientación
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  return orientation;
};

// Hook para detectar si es touch device
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouchDevice;
};

// Componente de navegación móvil
interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  children
}) => {
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isMobile) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Slide-out menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Icon name="XMarkIcon" className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  );
};

// Componente de bottom sheet
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto'
}) => {
  const { isMobile } = useBreakpoint();
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const heightClasses = {
    auto: 'max-h-[80vh]',
    half: 'h-1/2',
    full: 'h-full'
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragY;
    
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || !sheetRef.current) return;
    
    setIsDragging(false);
    const deltaY = e.changedTouches[0].clientY - dragY;
    
    if (deltaY > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = 'translateY(0)';
    }
  };

  if (!isMobile) {
    // En desktop, mostrar como modal
    return (
      <>
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />
        
        <div
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-md transition-all duration-300 ${
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {title && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon name="XMarkIcon" className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="p-4">{children}</div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl z-50 transform transition-transform duration-300 ease-out ${heightClasses[height]} ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {title && (
          <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon name="XMarkIcon" className="h-5 w-5" />
            </button>
          </div>
        )}
        
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};

// Componente de grid responsivo
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 6,
  className = ''
}) => {
  const gridClasses = [
    `grid`,
    `gap-${gap}`,
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

// Componente de texto responsivo
interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: {
    sm?: string;
    md?: string;
    lg?: string;
  };
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
  className = ''
}) => {
  const textClasses = [
    size.sm,
    size.md && `md:${size.md}`,
    size.lg && `lg:${size.lg}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={textClasses}>
      {children}
    </span>
  );
};

// Componente de espaciado responsivo
interface ResponsiveSpacingProps {
  children: React.ReactNode;
  padding?: {
    sm?: string;
    md?: string;
    lg?: string;
  };
  margin?: {
    sm?: string;
    md?: string;
    lg?: string;
  };
  className?: string;
}

export const ResponsiveSpacing: React.FC<ResponsiveSpacingProps> = ({
  children,
  padding,
  margin,
  className = ''
}) => {
  const spacingClasses = [
    padding?.sm,
    padding?.md && `md:${padding.md}`,
    padding?.lg && `lg:${padding.lg}`,
    margin?.sm,
    margin?.md && `md:${margin.md}`,
    margin?.lg && `lg:${margin.lg}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={spacingClasses}>
      {children}
    </div>
  );
};

// Componente de imagen responsiva
interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: {
    sm?: string;
    md?: string;
    lg?: string;
  };
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sizes,
  className = '',
  loading = 'lazy'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const imageClasses = [
    'transition-all duration-300',
    sizes?.sm || 'w-full',
    sizes?.md && `md:${sizes.md}`,
    sizes?.lg && `lg:${sizes.lg}`,
    isLoaded ? 'opacity-100' : 'opacity-0',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="relative overflow-hidden">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <Icon name="PhotoIcon" className="h-8 w-8 text-gray-400" />
        </div>
      )}
      
      {hasError ? (
        <div className="bg-gray-100 flex items-center justify-center p-8">
          <div className="text-center">
            <Icon name="ExclamationTriangleIcon" className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Error al cargar imagen</p>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          className={imageClasses}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};

// Componente de tabla responsiva
interface ResponsiveTableProps {
  headers: string[];
  data: Array<Record<string, any>>;
  mobileLayout?: 'cards' | 'stack';
  className?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  headers,
  data,
  mobileLayout = 'cards',
  className = ''
}) => {
  const { isMobile } = useBreakpoint();

  if (isMobile && mobileLayout === 'cards') {
    return (
      <div className={`space-y-4 ${className}`}>
        {data.map((row, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow border border-gray-200">
            {headers.map((header, headerIndex) => (
              <div key={headerIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="font-medium text-gray-700">{header}</span>
                <span className="text-gray-900">{row[header.toLowerCase()]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (isMobile && mobileLayout === 'stack') {
    return (
      <div className={`space-y-6 ${className}`}>
        {data.map((row, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow border border-gray-200">
            {headers.map((header, headerIndex) => (
              <div key={headerIndex} className="mb-3 last:mb-0">
                <div className="text-sm font-medium text-gray-700 mb-1">{header}</div>
                <div className="text-gray-900">{row[header.toLowerCase()]}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {headers.map((header, headerIndex) => (
                <td key={headerIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row[header.toLowerCase()]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Componente de navegación sticky
interface StickyNavigationProps {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

export const StickyNavigation: React.FC<StickyNavigationProps> = ({
  children,
  threshold = 100,
  className = ''
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return (
    <div
      ref={navRef}
      className={`transition-all duration-300 ${
        isSticky 
          ? 'fixed top-0 left-0 right-0 z-40 shadow-lg backdrop-blur-sm bg-white/95' 
          : 'relative'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Hook para keyboard awareness
export const useKeyboardAware = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDifference = windowHeight - viewportHeight;

      if (heightDifference > 150) {
        setKeyboardHeight(heightDifference);
        setIsKeyboardOpen(true);
      } else {
        setKeyboardHeight(0);
        setIsKeyboardOpen(false);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return { keyboardHeight, isKeyboardOpen };
};

// Componente de formulario keyboard-aware
interface KeyboardAwareFormProps {
  children: React.ReactNode;
  className?: string;
}

export const KeyboardAwareForm: React.FC<KeyboardAwareFormProps> = ({
  children,
  className = ''
}) => {
  const { keyboardHeight, isKeyboardOpen } = useKeyboardAware();

  return (
    <div
      className={`transition-all duration-300 ${className}`}
      style={{
        paddingBottom: isKeyboardOpen ? `${keyboardHeight}px` : '0px'
      }}
    >
      {children}
    </div>
  );
};
