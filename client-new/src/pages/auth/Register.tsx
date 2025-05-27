import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../../components/ui';

const Register: React.FC = () => {
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Esquema de validación
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('El nombre es obligatorio')
      .min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: Yup.string()
      .email('Correo electrónico inválido')
      .required('El correo electrónico es obligatorio'),
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
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await register(values.name, values.email, values.password, values.confirmPassword);
        setRegistrationSuccess(true);
        resetForm();
      } catch (err) {
        // El error se maneja en el contexto de autenticación
        console.error('Error during registration:', err);
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
                    onClick={clearError}
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
        
        {registrationSuccess ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon name="CheckCircleIcon" variant="solid" className="text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Registro exitoso</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Te has registrado correctamente. Por favor, verifica tu correo electrónico para activar tu cuenta.</p>
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    formik.touched.name && formik.errors.name 
                      ? 'border-red-300 text-red-900 placeholder-red-300' 
                      : 'border-gray-300 placeholder-gray-500 text-gray-900'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Nombre completo"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="mt-2 text-sm text-red-600">{formik.errors.name as string}</p>
                )}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    formik.touched.email && formik.errors.email 
                      ? 'border-red-300 text-red-900 placeholder-red-300' 
                      : 'border-gray-300 placeholder-gray-500 text-gray-900'
                  } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Correo electrónico"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-2 text-sm text-red-600">{formik.errors.email as string}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      formik.touched.password && formik.errors.password 
                        ? 'border-red-300 text-red-900 placeholder-red-300' 
                        : 'border-gray-300 placeholder-gray-500 text-gray-900'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Contraseña"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Icon name="EyeSlashIcon" className="text-gray-500" />
                    ) : (
                      <Icon name="EyeIcon" className="text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  <p>La contraseña debe tener:</p>
                  <ul className="pl-4 mt-1 list-disc">
                    <li>Al menos 8 caracteres</li>
                    <li>Al menos 1 mayúscula</li>
                    <li>Al menos 1 minúscula</li>
                    <li>Al menos 1 número</li>
                    <li>Al menos 1 carácter especial (@$!%*?&#)</li>
                  </ul>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-2 text-sm text-red-600">{formik.errors.password as string}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      formik.touched.confirmPassword && formik.errors.confirmPassword 
                        ? 'border-red-300 text-red-900 placeholder-red-300' 
                        : 'border-gray-300 placeholder-gray-500 text-gray-900'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Confirmar contraseña"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <Icon name="EyeSlashIcon" className="text-gray-500" />
                    ) : (
                      <Icon name="EyeIcon" className="text-gray-500" />
                    )}
                  </button>
                </div>
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{formik.errors.confirmPassword as string}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {formik.isSubmitting ? 'Registrando...' : 'Registrarse'}
              </button>
              <p className="mt-2 text-xs text-gray-500 text-center">Al registrarte, aceptas nuestros Términos y Condiciones y nuestra Política de Privacidad</p>
            </div>
          </form>
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
                    <p className="text-sm text-gray-500">Desarrolla proyectos que crecen junto con tu negocio y tus necesidades.</p>
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

export default Register;