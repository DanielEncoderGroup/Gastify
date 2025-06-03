import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authService } from '../../services/api';
import { Icon } from '../../components/ui';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Esquema de validación
  const validationSchema = Yup.object({
    password: Yup.string()
      .required('La contraseña es obligatoria')
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
        'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial'
      ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Las contraseñas deben coincidir')
      .required('La confirmación de contraseña es obligatoria')
  });

  // Configuración de Formik
  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!token) {
        setError('Token inválido');
        return;
      }

      try {
        await authService.resetPassword(token, values.password, values.confirmPassword);
        setSuccess(true);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Error al restablecer la contraseña';
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    }
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="relative bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex justify-start lg:w-0 lg:flex-1">
                <Link to="/" className="text-white text-2xl font-bold flex items-center">
                  <Icon name="CommandLineIcon" className="h-8 w-8 text-blue-500 mr-2" />
                  <span className="text-blue-500">Encoder</span>Group
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-gray-100">
            <div className="text-center">
              <Icon name="ExclamationTriangleIcon" className="h-16 w-16 text-yellow-500 mx-auto" />
              <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
                Enlace inválido
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                El enlace para restablecer la contraseña es inválido o ha expirado.
              </p>
              <div className="mt-6">
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Icon name="ArrowPathIcon" className="h-5 w-5 mr-2" />
                  Solicitar un nuevo enlace
                </Link>
              </div>
              <div className="mt-4">
                <Link
                  to="/"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Volver a la página principal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <Link to="/" className="text-white text-2xl font-bold flex items-center">
                <Icon name="CommandLineIcon" className="h-8 w-8 text-blue-500 mr-2" />
                <span className="text-blue-500">Encoder</span>Group
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] bg-gray-50">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-gray-100 m-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <Icon name="KeyIcon" className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Restablecer contraseña
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ingresa tu nueva contraseña para continuar.
            </p>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 mt-4 border border-red-100">
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
          
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <Icon name="CheckCircleIcon" className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">¡Contraseña restablecida!</h3>
              <p className="text-gray-600 mb-6">Tu contraseña ha sido actualizada correctamente.</p>
              <Link
                to="/?showLogin=true"
                className="inline-flex items-center justify-center w-full px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Nueva contraseña
                  </label>
                  <div className="mt-1 relative flex items-center">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className={`appearance-none block w-full px-3 py-2 pr-10 border ${
                        formik.touched.password && formik.errors.password 
                          ? 'border-red-300 text-red-900 placeholder-red-300' 
                          : 'border-gray-300 placeholder-gray-500 text-gray-900'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <div 
                      className="absolute right-0 z-20 flex items-center pr-3 h-full cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Icon name="EyeSlashIcon" className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Icon name="EyeIcon" className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.password as string}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmar contraseña
                  </label>
                  <div className="mt-1 relative flex items-center">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className={`appearance-none block w-full px-3 py-2 pr-10 border ${
                        formik.touched.confirmPassword && formik.errors.confirmPassword 
                          ? 'border-red-300 text-red-900 placeholder-red-300' 
                          : 'border-gray-300 placeholder-gray-500 text-gray-900'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      value={formik.values.confirmPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <div 
                      className="absolute right-0 z-20 flex items-center pr-3 h-full cursor-pointer"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <Icon name="EyeSlashIcon" className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Icon name="EyeIcon" className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                  {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.confirmPassword as string}</p>
                  )}
                </div>
                
                {/* Indicadores de seguridad de contraseña */}
                <div className="rounded-md bg-blue-50 p-4 border border-blue-100">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Icon name="InformationCircleIcon" className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800">
                        Tu contraseña debe tener:
                      </p>
                      <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
                        <li>Al menos 8 caracteres</li>
                        <li>Al menos una letra mayúscula</li>
                        <li>Al menos una letra minúscula</li>
                        <li>Al menos un número</li>
                        <li>Al menos un carácter especial (@$!%*?&#)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-150"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <Icon name="KeyIcon" className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                  </span>
                  {formik.isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </span>
                  ) : 'Restablecer contraseña'}
                </button>
              </div>
            </form>
          )}
          
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Volver a la página principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;