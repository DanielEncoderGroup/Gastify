/**
 * Error Boundary optimizado para workflows
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import Card from './Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Llamar callback personalizado
    this.props.onError?.(error, errorInfo);

    // Log a servicio de monitoreo (implementar según necesidad)
    // logErrorToService(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Usar fallback personalizado si existe
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Oops! Algo salió mal
            </h2>
            
            <p className="text-gray-600 mb-6">
              Ha ocurrido un error inesperado en la aplicación. 
              Puedes intentar recargar la página o contactar al soporte técnico.
            </p>

            {/* Mostrar detalles del error en desarrollo */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <h4 className="font-semibold text-red-800 mb-2">Detalles del Error:</h4>
                <pre className="text-sm text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-red-800 font-medium cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={this.handleRetry}
                className="inline-flex items-center"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Intentar de nuevo
              </Button>
              
              <Button
                onClick={this.handleReload}
                className="bg-red-600 hover:bg-red-700"
              >
                Recargar página
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Si el problema persiste, contacta al soporte técnico con el código: 
                <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-1">
                  {Date.now().toString(36)}
                </span>
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
