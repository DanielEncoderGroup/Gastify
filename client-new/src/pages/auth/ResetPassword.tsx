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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Enlace inválido
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              El enlace para restablecer la contraseña es inválido o ha expirado.
            </p>
            <div className="mt-5 text-center">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Solicitar un nuevo enlace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Restablecer contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu nueva contraseña para continuar.
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon name="XCircleIcon" variant="solid" className="text-red-400" />
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
                    <Icon name="XMarkIcon" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon name="CheckCircleIcon" variant="solid" className="text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Contraseña restablecida</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Tu contraseña ha sido restablecida correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.</p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
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
            </div>

            <div>
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <Icon name="KeyIcon" variant="solid" className="text-blue-500 group-hover:text-blue-400" />
                </span>
                {formik.isSubmitting ? 'Guardando...' : 'Restablecer contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;