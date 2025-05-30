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

  // Estados para validación visual de la contraseña
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUpperCase, setHasUpperCase] = useState(false);
  const [hasLowerCase, setHasLowerCase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);

  // Esquema de validación
  // Definir el tipo para los valores del formulario
  interface RegisterFormValues {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }

  const validationSchema = Yup.object({
    firstName: Yup.string()
      .required('El nombre es obligatorio')
      .min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: Yup.string()
      .required('El apellido es obligatorio')
      .min(2, 'El apellido debe tener al menos 2 caracteres'),
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

  // Función para validar requisitos de la contraseña en tiempo real
  const validatePassword = (password: string) => {
    setHasMinLength(password.length >= 8);
    setHasUpperCase(/[A-Z]/.test(password));
    setHasLowerCase(/[a-z]/.test(password));
    setHasNumber(/[0-9]/.test(password));
    setHasSpecialChar(/[@$!%*?&#]/.test(password));
  };

  // Configuración de Formik
  const formik = useFormik<RegisterFormValues>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await register(values.firstName, values.lastName, values.email, values.password, values.confirmPassword);
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
          <div className="rounded-lg bg-gradient-to-r from-green-50 to-blue-50 p-8 shadow-sm border border-green-100">
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <Icon name="CheckCircleIcon" variant="solid" className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">¡Registro Completado con Éxito!</h3>
            </div>
            
            <div className="bg-white rounded-lg p-5 border border-green-100 shadow-inner">
              <p className="text-gray-700 text-center leading-relaxed">
                Gracias por unirte a <span className="font-semibold">EncoderGroup</span>. <br/>
                Hemos enviado un correo de confirmación a tu dirección de email.<br/>
                <span className="font-medium text-blue-600">Por favor, verifica tu bandeja de entrada para activar tu cuenta.</span>
              </p>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Icon name="ArrowRightOnRectangleIcon" className="-ml-1 mr-2 h-5 w-5" />
                Ir a iniciar sesión
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                ¿No recibiste el correo? Revisa tu carpeta de spam o <button onClick={() => alert('Funcionalidad pendiente de implementar')} className="text-blue-600 hover:text-blue-800 font-medium">solicita un nuevo enlace</button>
              </p>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="mb-4">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="UserIcon" className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      required
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.firstName}
                      className={`appearance-none relative block w-full px-3 py-2 pl-10 border ${formik.touched.firstName && formik.errors.firstName ? 'border-red-300 text-red-900 placeholder-red-300' : 'border-gray-300 placeholder-gray-500 text-gray-900'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                      placeholder="Tu nombre"
                    />
                  </div>
                  {formik.touched.firstName && formik.errors.firstName && (
                    <p className="mt-2 text-sm text-red-600">
                      {typeof formik.errors.firstName === 'string' ? formik.errors.firstName : ''}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="UserIcon" className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      required
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.lastName}
                      className={`appearance-none relative block w-full px-3 py-2 pl-10 border ${formik.touched.lastName && formik.errors.lastName ? 'border-red-300 text-red-900 placeholder-red-300' : 'border-gray-300 placeholder-gray-500 text-gray-900'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                      placeholder="Tu apellido"
                    />
                  </div>
                  {formik.touched.lastName && formik.errors.lastName && (
                    <p className="mt-2 text-sm text-red-600">
                      {typeof formik.errors.lastName === 'string' ? formik.errors.lastName : ''}
                    </p>
                  )}
                </div>
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
                  <p className="mt-2 text-sm text-red-600">
                    {typeof formik.errors.email === 'string' ? formik.errors.email : ''}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`appearance-none block w-full px-3 py-2 pr-10 border ${
                      formik.touched.password && formik.errors.password 
                        ? 'border-red-300 text-red-900 placeholder-red-300' 
                        : 'border-gray-300 placeholder-gray-500 text-gray-900'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Contraseña"
                    value={formik.values.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      formik.handleChange(e);
                      validatePassword(e.target.value);
                    }}
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
                <div className="mt-1 text-xs text-gray-500">
                  <p>La contraseña debe tener:</p>
                  <ul className="pl-4 mt-1 list-disc">
                    <li className={hasMinLength ? 'text-green-500 font-medium' : 'text-gray-500'}>Al menos 8 caracteres</li>
                    <li className={hasUpperCase ? 'text-green-500 font-medium' : 'text-gray-500'}>Al menos 1 mayúscula</li>
                    <li className={hasLowerCase ? 'text-green-500 font-medium' : 'text-gray-500'}>Al menos 1 minúscula</li>
                    <li className={hasNumber ? 'text-green-500 font-medium' : 'text-gray-500'}>Al menos 1 número</li>
                    <li className={hasSpecialChar ? 'text-green-500 font-medium' : 'text-gray-500'}>Al menos 1 carácter especial (@$!%*?&#)</li>
                  </ul>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-2 text-sm text-red-600">
                    {typeof formik.errors.password === 'string' ? formik.errors.password : ''}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <div className="relative flex items-center">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`appearance-none block w-full px-3 py-2 pr-10 border ${
                      formik.touched.confirmPassword && formik.errors.confirmPassword 
                        ? 'border-red-300 text-red-900 placeholder-red-300' 
                        : 'border-gray-300 placeholder-gray-500 text-gray-900'
                    } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Confirmar contraseña"
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
                  <p className="mt-2 text-sm text-red-600">
                    {typeof formik.errors.confirmPassword === 'string' ? formik.errors.confirmPassword : ''}
                  </p>
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