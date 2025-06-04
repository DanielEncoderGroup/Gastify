import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  RocketLaunchIcon,
  LightBulbIcon,
  CogIcon,
  ArrowLeftIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ComputerDesktopIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import ProjectRequestForm from '../../components/projects/ProjectRequestForm';

const NewProjectRequest: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Verificar que el usuario tenga permiso
  useEffect(() => {
    if (user && !['user', 'client'].includes(user.role)) {
      toast.error('No tienes permiso para acceder a esta página');
      navigate('/app/requests');
      return;
    }
    // Simular carga suave
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleCancel = () => {
    navigate('/app/requests');
  };

  const handleSaved = (id: string) => {
    toast.success(
      <div className="flex items-center">
        <CheckBadgeIcon className="w-5 h-5 mr-2 text-green-600" />
        <span>¡Solicitud creada exitosamente!</span>
      </div>,
      { duration: 4000 }
    );
    navigate('/app/requests');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg animate-pulse">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Superior */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Botón Volver */}
            <button
              onClick={handleCancel}
              className="
                inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 
                bg-white/80 border border-gray-200 rounded-xl shadow-sm
                hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900
                transition-all duration-200 ease-in-out transform hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Volver a Solicitudes
            </button>

            {/* Título y Progreso */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-4 py-1.5 bg-blue-50 rounded-full">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-blue-700">Paso único</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <RocketLaunchIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-800">Nueva Solicitud</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Decoraciones abstractas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl opacity-70 animate-pulse"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl opacity-60 animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-200/25 rounded-full blur-3xl opacity-50 animate-pulse delay-2000"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            {/* Icono Principal */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl mb-6 shadow-lg animate-bounce">
              <RocketLaunchIcon className="w-10 h-10 text-white" />
            </div>

            {/* Título Principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-4 leading-tight">
              Transforma tu Idea
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-relaxed">
                en Realidad Digital
              </span>
            </h1>

            {/* Descripción */}
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Cuéntanos sobre tu proyecto y nuestro equipo de expertos creará una solución tecnológica personalizada.
            </p>

            {/* Características Destacadas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mb-4">
                  <LightBulbIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Análisis Profesional</h3>
                <p className="text-sm text-gray-600 text-center">
                  Evaluamos tu proyecto con metodologías probadas
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl mb-4">
                  <CogIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Soluciones Personalizadas</h3>
                <p className="text-sm text-gray-600 text-center">
                  Desarrollo adaptado a tus necesidades específicas
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl mb-4">
                  <CheckBadgeIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Garantía de Calidad</h3>
                <p className="text-sm text-gray-600 text-center">
                  Entrega puntual con los más altos estándares
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center text-sm text-gray-600">
                <ComputerDesktopIcon className="w-5 h-5 mr-2 text-blue-600" />
                <span>Tecnología de Vanguardia</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
              <div className="flex items-center text-sm text-gray-600">
                <ClipboardDocumentListIcon className="w-5 h-5 mr-2 text-indigo-600" />
                <span>Proceso Estructurado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario Principal */}
      <main className="relative z-10">
        <ProjectRequestForm onCancel={handleCancel} onSaved={handleSaved} />
      </main>

      {/* Footer Informativo */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-white/20 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-800">¿Necesitas ayuda?</span>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto mb-4">
              Nuestro equipo está aquí para ayudarte en cada paso del proceso. Si tienes preguntas, no dudes en contactarnos.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
              <div>📧 Soporte: soporte@empresa.com</div>
              <div className="hidden sm:block">|</div>
              <div>📞 Teléfono: +1 (555) 123-4567</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewProjectRequest;