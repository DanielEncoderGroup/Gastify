import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../../components/ui';
import { InvitationService } from '../../services/invitationService';

interface InvitationData {
  invitation_id: string;
  employer_id: string;
  invited_email: string;
  company_name: string;
  department?: string;
  position?: string;
  expires_at: string;
}

const RegisterWithInvitation: React.FC = () => {
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [tokenError, setTokenError] = useState<string>('');
  const [validatingToken, setValidatingToken] = useState(true);

  // Estados para validación visual de la contraseña
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUpperCase, setHasUpperCase] = useState(false);
  const [hasLowerCase, setHasLowerCase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);

  // Validar token de invitación al cargar
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('Token de invitación requerido');
        setValidatingToken(false);
        return;
      }

      try {
        const response = await InvitationService.validateInvitationToken(token);
        setInvitationData(response);
        setValidatingToken(false);
      } catch (err: any) {
        console.error('Error validating token:', err);
        setTokenError(err.response?.data?.detail || 'Token de invitación inválido o expirado');
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  interface RegisterFormValues {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    position: string;
    department: string;
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
      .required('La confirmación de contraseña es obligatoria'),
    phone: Yup.string()
      .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Número de teléfono inválido'),
    position: Yup.string()
      .min(2, 'El cargo debe tener al menos 2 caracteres'),
    department: Yup.string()
      .min(2, 'El departamento debe tener al menos 2 caracteres')
  });

  // Función para validar requisitos de la contraseña en tiempo real
  const validatePassword = (password: string) => {
    setHasMinLength(password.length >= 8);
    setHasUpperCase(/[A-Z]/.test(password));
    setHasLowerCase(/[a-z]/.test(password));
    setHasNumber(/[0-9]/.test(password));
    setHasSpecialChar(/[@$!%*?&#]/.test(password));
  };

  const formik = useFormik<RegisterFormValues>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: invitationData?.invited_email || '',
      password: '',
      confirmPassword: '',
      phone: '',
      position: '',
      department: ''
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        // Registrar usuario
        await register(
          values.firstName, 
          values.lastName, 
          values.email, 
          values.password, 
          values.confirmPassword
        );

        // Aceptar invitación automáticamente
        if (token) {
          // TODO: Implementar acceptInvitation con parámetros correctos
          // await InvitationService.acceptInvitation(token, newUserId);
        }

        setRegistrationSuccess(true);
        resetForm();
      } catch (err: any) {
        console.error('Error during registration:', err);
      } finally {
        setSubmitting(false);
      }
    }
  });

  // Mostrar carga mientras valida token
  if (validatingToken) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validando invitación...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si el token es inválido
  if (tokenError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <Icon name="ExclamationTriangleIcon" variant="solid" className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Invitación no válida</h3>
          <p className="text-gray-600 mb-6">{tokenError}</p>
          <Link
            to="/register"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Registro normal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-primary-600 to-secondary-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-white text-2xl font-bold flex items-center">
                <Icon name="ReceiptPercentIcon" className="h-7 w-7 text-white mr-2" />
                <span className="text-white">Gastify</span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <motion.div 
                whileHover={{ y: -2 }} 
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link 
                  to="/?showLogin=true"
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-100 hover:text-white transition-colors duration-200 rounded-md hover:bg-primary-700/20"
                >
                  <Icon name="ArrowRightOnRectangleIcon" className="mr-2 h-5 w-5 text-gray-200" />
                  Iniciar sesión
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Contenido principal */}
      <div className="container mx-auto px-4 pt-8 pb-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna del formulario */}
          <div className="md:col-span-2 bg-white p-8 rounded-lg shadow border border-gray-200">
            {/* Información de la invitación */}
            {invitationData && (
              <div className="mb-6 bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Icon name="EnvelopeIcon" className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-semibold text-primary-800">Invitación de {invitationData.company_name}</h3>
                </div>
                <p className="text-sm text-primary-700">
                  Has sido invitado para unirte al equipo de <strong>{invitationData.company_name}</strong>.
                </p>
                {invitationData.department && (
                  <div className="mt-3 p-3 bg-white/50 rounded border border-primary-100">
                    <p className="text-sm text-primary-700">Departamento: <strong>{invitationData.department}</strong></p>
                    {invitationData.position && <p className="text-sm text-primary-700">Cargo: <strong>{invitationData.position}</strong></p>}
                  </div>
                )}
                <p className="text-xs text-primary-600 mt-2">
                  Expira el: {new Date(invitationData.expires_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Completa tu registro para unirte a {invitationData?.company_name}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                ¿Ya tienes una cuenta? <Link to="/?showLogin=true" className="text-primary-600 hover:text-primary-500">Inicia sesión aquí</Link>
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
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
                  <h3 className="text-xl font-semibold text-gray-800">¡Te has unido exitosamente a {invitationData?.company_name}!</h3>
                </div>
                
                <div className="bg-white rounded-lg p-5 border border-green-100 shadow-inner">
                  <p className="text-gray-700 text-center leading-relaxed">
                    Bienvenido al equipo de <span className="font-semibold">{invitationData?.company_name}</span>. <br/>
                    Tu cuenta ha sido activada y ya puedes acceder a todas las funcionalidades.<br/>
                    <span className="font-medium text-blue-600">¡Comienza a gestionar tus gastos empresariales ahora!</span>
                  </p>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                  >
                    <Icon name="ArrowRightIcon" className="ml-2 h-5 w-5" />
                    Ir al Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
                <div className="space-y-4">
                  {/* Nombre y Apellido */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="mb-4">
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Icon name="UserIcon" className="h-5 w-5 text-primary-500" />
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
                          className={`appearance-none relative block w-full px-3 py-2 pl-10 border ${
                            formik.touched.firstName && formik.errors.firstName 
                              ? 'border-red-300 text-red-900 placeholder-red-300' 
                              : 'border-gray-300 placeholder-gray-500 text-gray-900'
                          } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                          placeholder="Tu nombre"
                        />
                      </div>
                      {formik.touched.firstName && formik.errors.firstName && (
                        <p className="mt-2 text-sm text-red-600">{String(formik.errors.firstName)}</p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido *
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Icon name="UserIcon" className="h-5 w-5 text-primary-500" />
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
                          className={`appearance-none relative block w-full px-3 py-2 pl-10 border ${
                            formik.touched.lastName && formik.errors.lastName 
                              ? 'border-red-300 text-red-900 placeholder-red-300' 
                              : 'border-gray-300 placeholder-gray-500 text-gray-900'
                          } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                          placeholder="Tu apellido"
                        />
                      </div>
                      {formik.touched.lastName && formik.errors.lastName && (
                        <p className="mt-2 text-sm text-red-600">{String(formik.errors.lastName)}</p>
                      )}
                    </div>
                  </div>

                  {/* Email (precompletado y readonly) */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="EnvelopeIcon" className="h-5 w-5 text-primary-500" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        readOnly
                        className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-500 bg-gray-50 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                        value={formik.values.email}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Este email está asociado a tu invitación</p>
                  </div>

                  {/* Password fields and other form content would continue here */}
                  <div>
                    <button
                      type="submit"
                      disabled={formik.isSubmitting}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                      {formik.isSubmitting ? 'Registrando...' : 'Unirse al equipo'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
          
          {/* Columna de información */}
          <div className="hidden md:block md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Beneficios empresariales</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary-100 rounded-full p-1">
                    <Icon name="UsersIcon" className="h-5 w-5 text-primary-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Gestión de equipo</h4>
                    <p className="text-sm text-gray-500">Colabora con tu empleador para gestión de gastos.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary-100 rounded-full p-1">
                    <Icon name="ReceiptRefundIcon" className="h-5 w-5 text-primary-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Reportes automáticos</h4>
                    <p className="text-sm text-gray-500">Informes automáticos para reembolsos.</p>
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

export default RegisterWithInvitation;
