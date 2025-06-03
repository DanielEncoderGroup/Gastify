import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authService } from '../../services/api';
import { Icon } from '../../components/ui';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Esquema de validación
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Correo electrónico inválido')
      .required('Ingresa un correo electrónico')
  });

  // Configuración de Formik
  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await authService.requestPasswordReset(values.email);
        setSuccess(true);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Error al solicitar el restablecimiento de contraseña';
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <Link to="/" className="text-white text-2xl font-bold flex items-center">
                <Icon name="CommandLineIcon" className="h-8 w-8 text-blue-500 mr-2" />
                <span className="text-blue-500">Encoder</span>Group
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0 space-x-8">
              <Link 
                to="/" 
                className="text-base font-medium text-gray-300 hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('metodologias')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Metodologías
              </Link>
              <Link 
                to="/" 
                className="text-base font-medium text-gray-300 hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('tecnologias')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Tecnologías
              </Link>
              <Link 
                to="/" 
                className="text-base font-medium text-gray-300 hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('valores')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Valores
              </Link>
              <Link to="/?showLogin=true" className="text-base font-medium text-gray-300 hover:text-white">Iniciar sesión</Link>
              <Link to="/register" className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700">
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Contenido principal */}
      <div className="flex flex-col items-center justify-start py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Columna del formulario */}
            <div className="md:col-span-2 bg-white p-8 rounded-lg shadow-md border border-gray-200">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <Icon name="KeyIcon" className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  Recuperar tu cuenta
                </h2>
                <p className="text-sm text-gray-600">
                  ¿Ya tienes una cuenta? <Link to="/?showLogin=true" className="text-blue-600 hover:text-blue-500">Inicia sesión aquí</Link>
                </p>
              </div>
              
              {success ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <Icon name="CheckCircleIcon" className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">¡Solicitud enviada!</h3>
                  <div className="mt-2 text-gray-600 mb-6 max-w-md mx-auto">
                    <p>Hemos enviado un enlace de recuperación a tu correo electrónico. Por favor, revisa tu bandeja de entrada y sigue las instrucciones.</p>
                  </div>
                  <div className="flex flex-col space-y-3 max-w-xs mx-auto">
                    <Link
                      to="/?showLogin=true"
                      className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors duration-150"
                    >
                      <Icon name="ArrowRightOnRectangleIcon" className="h-5 w-5 mr-2" />
                      Ir a iniciar sesión
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSuccess(false)}
                      className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Icon name="EnvelopeIcon" className="h-5 w-5 mr-2" />
                      Enviar de nuevo
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="rounded-md bg-red-50 p-4 mb-6 border border-red-100">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Icon name="XCircleIcon" className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                        <div className="ml-auto pl-3">
                          <div className="-mx-1.5 -my-1.5">
                            <button
                              onClick={() => setError(null)}
                              type="button"
                              className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                            >
                              <span className="sr-only">Cerrar</span>
                              <Icon name="XMarkIcon" className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Correo electrónico
                      </label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Icon name="EnvelopeIcon" className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                            formik.touched.email && formik.errors.email 
                              ? 'border-red-300 text-red-900 placeholder-red-300' 
                              : 'border-gray-300 placeholder-gray-500 text-gray-900'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          placeholder="nombre@ejemplo.com"
                          value={formik.values.email}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                      </div>
                      {formik.touched.email && formik.errors.email && (
                        <p className="mt-2 text-sm text-red-600">{formik.errors.email as string}</p>
                      )}
                    </div>

                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={formik.isSubmitting}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-150"
                      >
                        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                          <Icon name="EnvelopeIcon" className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                        </span>
                        {formik.isSubmitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enviando...
                          </span>
                        ) : 'Enviar enlace de recuperación'}
                      </button>
                    </div>

                    <div className="mt-4 text-center">
                      <div className="text-sm">
                        <Link to="/?showLogin=true" className="font-medium text-blue-600 hover:text-blue-500">
                          Volver a iniciar sesión
                        </Link>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
            
            {/* Columna de beneficios */}
            <div className="hidden md:block md:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Beneficios de EncoderGroup</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                      <Icon name="CodeBracketIcon" className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">Tecnologías de vanguardia</h4>
                      <p className="text-sm text-gray-500">Accede a las últimas tecnologías y metodologías de desarrollo.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                      <Icon name="UserGroupIcon" className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">Comunidad colaborativa</h4>
                      <p className="text-sm text-gray-500">Forma parte de una comunidad global de desarrolladores y expertos.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                      <Icon name="ShieldCheckIcon" className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">Seguridad garantizada</h4>
                      <p className="text-sm text-gray-500">Tus proyectos y datos personales están protegidos con los más altos estándares.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                      <Icon name="ArrowTrendingUpIcon" className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">Soluciones escalables</h4>
                      <p className="text-sm text-gray-500">Desarrolla proyectos que crecen junto a tus necesidades.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;