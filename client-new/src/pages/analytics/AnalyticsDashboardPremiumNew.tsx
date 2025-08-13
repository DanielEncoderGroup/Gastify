import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AnalyticsDashboardIntegrated } from '../../components/gastify/analytics';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ToastContainer, useToast } from '../../components/ui/Toast';

const AnalyticsDashboardPremium: React.FC = () => {
  const { user, loading } = useAuth();
  const { toasts } = useToast();

  // Mostrar loading mientras se autentica
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" withLogo />
      </div>
    );
  }

  // Redirigir si no hay usuario autenticado
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Acceso Requerido
          </h2>
          <p className="text-gray-600 mb-6">
            Necesitas iniciar sesión para ver el dashboard de analytics.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de la página */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Bienvenido, {user.firstName} {user.lastName}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Rol: {user.role}
              </div>
              {user.profileImage && (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboardIntegrated 
          userId={user.id}
          className="w-full"
        />
      </div>

      {/* Toast Container para notificaciones */}
      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default AnalyticsDashboardPremium;