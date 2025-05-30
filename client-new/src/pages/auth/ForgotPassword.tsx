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
              <span className="text-white text-2xl font-bold flex items-center">
                <Icon name="CommandLineIcon" className="h-8 w-8 text-blue-500 mr-2" />
                <span className="text-blue-500">Encoder</span>Group
              </span>
            </div>
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0 space-x-8">
              <a href="#" className="text-base font-medium text-gray-300 hover:text-white">Metodologías</a>
              <a href="#" className="text-base font-medium text-gray-300 hover:text-white">Tecnologías</a>
              <a href="#" className="text-base font-medium text-gray-300 hover:text-white">Valores</a>
              <Link to="/?showLogin=true" className="text-base font-medium text-gray-300 hover:text-white">Iniciar sesión</Link>
              <Link to="/register" className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700">
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Contenido principal */}
      <div className="container mx-auto px-4 pt-8 pb-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna del formulario */}
          <div className="md:col-span-2 bg-white p-8 rounded-lg shadow border border-gray-200">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Inicia sesión o regístrate para comenzar
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            ¿Ya tienes una cuenta? <Link to="/?showLogin=true" className="text-blue-600 hover:text-blue-500">Inicia sesión aquí</Link>
          </p>
        </div>
        
        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon name="CheckCircleIcon" variant="solid" className="text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Solicitud enviada</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Hemos enviado un enlace de recuperación a tu correo electrónico. Por favor, revisa tu bandeja de entrada y sigue las instrucciones.</p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      onClick={() => navigate('/?showLogin=true')}
                      className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                    >
                      Ir a iniciar sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <Icon name="LockClosedIcon" className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Restablecer contraseña</h3>
              <p className="mt-2 text-sm text-gray-600">
                Ingresa tu correo electrónico y te enviaremos las instrucciones para una nueva contraseña.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Icon name="XCircleIcon" variant="solid" className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        onClick={() => setError(null)}
                        type="button"
                        className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <span className="sr-only">Cerrar</span>
                        <Icon name="XMarkIcon" className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form className="mt-6" onSubmit={formik.handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`appearance-none block w-full px-3 py-2 border ${
                      formik.touched.email && formik.errors.email 
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                    placeholder="Ingresa tu correo electrónico"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Icon name="ExclamationCircleIcon" className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-2 text-sm text-red-600">{formik.errors.email as string}</p>
                )}
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {formik.isSubmitting ? 'Enviando...' : 'Continuar'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link to="/reset-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Ya tengo el código verificador
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link to="/?showLogin=true" className="text-sm font-medium text-gray-600 hover:text-gray-500">
                  Volver a iniciar sesión
                </Link>
              </div>
            </form>
          </>
        )}
          </div>
          
          {/* Columna de beneficios */}
          <div className="hidden md:block md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
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
  );
};

export default ForgotPassword;