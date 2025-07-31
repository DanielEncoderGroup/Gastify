import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Icon from '../../components/ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import { authService } from '../../services/api';

// Nuevos componentes de Gastify
import HeroSection from '../../components/gastify/HeroSection';
import ProblemSolutionSection from '../../components/gastify/ProblemSolutionSection';
import FeaturesSection from '../../components/gastify/FeaturesSection';
import ComparisonTable from '../../components/gastify/ComparisonTable';
import BenefitsSection from '../../components/gastify/BenefitsSection';
import DemoSection from '../../components/gastify/DemoSection';
import TestimonialsSection from '../../components/gastify/TestimonialsSection';
import FooterCTASection from '../../components/gastify/FooterCTASection';

const GastifyLandingPage: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isVerificationError, setIsVerificationError] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Efecto para detectar el parámetro showLogin en la URL
  useEffect(() => {
    // Verificar si hay un parámetro showLogin=true en la URL
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('showLogin') === 'true') {
      setShowLoginModal(true);
      // Eliminar el parámetro showLogin de la URL después de procesar
      // para evitar que el modal se abra al navegar entre secciones
      if (location.search) {
        navigate('/', { replace: true });
      }
    }
  }, [location, navigate]);

  // Efecto para bloquear el scroll cuando el modal está abierto
  useEffect(() => {
    if (showLoginModal) {
      // Bloquear el scroll del body
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar el scroll del body
      document.body.style.overflow = 'auto';
    }

    // Limpiar el efecto cuando el componente se desmonte
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showLoginModal]);

  // Función para validar el formato del correo electrónico
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Función para reenviar el correo de verificación
  const handleResendVerification = async () => {
    if (!isValidEmail(email)) {
      setEmailError(true);
      return;
    }
    
    setResendingEmail(true);
    try {
      // Llamada al endpoint para reenviar el correo de verificación
      await authService.resendVerificationEmail(email);
      toast.success('Correo de verificación enviado. Por favor, revisa tu bandeja de entrada.');
    } catch (error: any) {
      console.error('Error al reenviar el correo de verificación:', error);
      toast.error('No se pudo reenviar el correo de verificación. Inténtalo más tarde.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar correo electrónico
    if (!isValidEmail(email)) {
      setEmailError(true);
      return;
    }
    
    // Resetear el error si el correo es válido
    setEmailError(false);
    setIsLoading(true);
    setIsVerificationError(false);
    
    try {
      console.log('Intentando iniciar sesión con:', { email, password });
      
      // Usar el hook useAuth para iniciar sesión y actualizar el estado global
      await login(email, password);
      
      // Si llegamos aquí, el login fue exitoso
      setLoginError('');
      toast.success('Inicio de sesión exitoso');
      
      // Usar navigate en lugar de window.location para evitar recargas completas
      navigate('/app/receipts');
    } catch (error: any) {
      console.error('Error durante el login:', error);
      
      // Manejar el error de autenticación
      let errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Correo electrónico o contraseña incorrecta';
      
      // Traducir mensaje de error al español si está en inglés
      if (errorMessage === 'Incorrect email or password') {
        errorMessage = 'Correo o contraseña incorrectos';
      }
      
      // Detectar si es un error de verificación de correo
      if (errorMessage.toLowerCase().includes('verifica') || 
          errorMessage.toLowerCase().includes('verify') || 
          errorMessage.toLowerCase().includes('verification')) {
        setIsVerificationError(true);
      } else {
        setIsVerificationError(false);
      }
      
      setLoginError(errorMessage);
      // No redirigir a /app/projects cuando hay error
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Limpiar los errores cuando se cierra el modal
  const handleCloseModal = () => {
    setShowLoginModal(false);
    setLoginError('');
    setEmailError(false);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="relative bg-white shadow-sm z-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <span className="text-gray-900 text-2xl font-bold flex items-center">
                <Icon name="ReceiptRefundIcon" className="h-7 w-7 text-primary-600 mr-2" />
                <span className="text-primary-600">Gas</span>tify
              </span>
            </div>
            
            {/* Right side navigation - all elements to the right */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Navigation links */}
              <motion.div 
                whileHover={{ y: -2 }} 
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="relative group"
              >
                <a 
                  href="#caracteristicas" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('caracteristicas')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors duration-200 rounded-md hover:bg-primary-50/50 group"
                >
                  <Icon name="SquaresPlusIcon" className="mr-2 h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-200" aria-hidden="true" />
                  Características
                </a>
              </motion.div>

              <motion.div 
                whileHover={{ y: -2 }} 
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="relative group"
              >
                <a 
                  href="#comparativa"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('comparativa')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors duration-200 rounded-md hover:bg-primary-50/50 group"
                >
                  <Icon name="ChartBarIcon" className="mr-2 h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-200" aria-hidden="true" />
                  Comparativa
                </a>
              </motion.div>

              <motion.div 
                whileHover={{ y: -2 }} 
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="relative group"
              >
                <a 
                  href="#testimonios"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('testimonios')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors duration-200 rounded-md hover:bg-primary-50/50 group"
                >
                  <Icon name="ChatBubbleLeftRightIcon" className="mr-2 h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-200" aria-hidden="true" />
                  Testimonios
                </a>
              </motion.div>
              
              {/* Authentication */}
              <motion.div 
                whileHover={{ y: -2 }} 
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors duration-200 rounded-md hover:bg-primary-50/50"
                >
                  <Icon name="ArrowRightOnRectangleIcon" className="mr-2 h-5 w-5 text-gray-400 group-hover:text-primary-500" aria-hidden="true" />
                  Iniciar sesión
                </button>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Link
                  to="/register"
                  className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/30 transition-all duration-200"
                >
                  <Icon name="UserPlusIcon" className="mr-2 h-5 w-5" aria-hidden="true" />
                  Registrarse
                </Link>
              </motion.div>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button className="bg-white p-2 rounded-md text-gray-400">
                <span className="sr-only">Open main menu</span>
                <Icon name="Bars3Icon" className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        {/* Hero section with animations */}
        <HeroSection setShowLoginModal={setShowLoginModal} />

        {/* Problem vs Solution section */}
        <ProblemSolutionSection />

        {/* Features section */}
        <FeaturesSection />

        {/* Comparison Table */}
        <ComparisonTable />

        {/* Benefits section */}
        <BenefitsSection />

        {/* Demo section */}
        <DemoSection />

        {/* Testimonials section */}
        <TestimonialsSection />

        {/* Footer CTA */}
        <FooterCTASection setShowLoginModal={setShowLoginModal} />

        {/* Footer with copyright and links */}
        <footer className="bg-white py-12 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center">
                  <Icon name="ReceiptRefundIcon" className="h-8 w-8 text-primary-600 mr-2" />
                  <span className="text-xl font-bold text-gray-900">
                    <span className="text-primary-600">Gas</span>tify
                  </span>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Automatiza completamente tus procesos de gastos empresariales con inteligencia artificial avanzada.
                </p>
                <div className="mt-6 flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-primary-600">
                    <span className="sr-only">LinkedIn</span>
                    <Icon name="LinkedInIcon" className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-primary-600">
                    <span className="sr-only">Twitter</span>
                    <Icon name="TwitterIcon" className="h-6 w-6" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-primary-600">
                    <span className="sr-only">GitHub</span>
                    <Icon name="GitHubIcon" className="h-6 w-6" />
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Producto</h3>
                <ul role="list" className="mt-4 space-y-2">
                  <li>
                    <a href="#caracteristicas" className="text-sm text-gray-500 hover:text-primary-600">
                      Características
                    </a>
                  </li>
                  <li>
                    <a href="#comparativa" className="text-sm text-gray-500 hover:text-primary-600">
                      Comparativa
                    </a>
                  </li>
                  <li>
                    <a href="#demo" className="text-sm text-gray-500 hover:text-primary-600">
                      Demo
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-500 hover:text-primary-600">
                      Precios
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Soporte</h3>
                <ul role="list" className="mt-4 space-y-2">
                  <li>
                    <a href="#" className="text-sm text-gray-500 hover:text-primary-600">
                      Centro de ayuda
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-500 hover:text-primary-600">
                      Documentación
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-500 hover:text-primary-600">
                      API
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-500 hover:text-primary-600">
                      Contacto
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Legal</h3>
                <ul role="list" className="mt-4 space-y-2">
                  <li>
                    <a href="#" className="text-sm text-gray-500 hover:text-primary-600">
                      Privacidad
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-500 hover:text-primary-600">
                      Términos de uso
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-500 hover:text-primary-600">
                      Compliance
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-400 text-center">
                &copy; {new Date().getFullYear()} Gastify. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={handleCloseModal}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div 
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={handleCloseModal}
                >
                  <span className="sr-only">Cerrar</span>
                  <Icon name="XMarkIcon" className="h-6 w-6" />
                </button>
              </div>
              
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Icon name="ArrowRightOnRectangleIcon" className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Iniciar sesión
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Ingresa tus credenciales para acceder a tu cuenta
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-4 sm:px-6 pb-5">
                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="EnvelopeIcon" className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError(false);
                        }}
                        autoComplete="email"
                        className={`block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                          emailError ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                    {emailError && (
                      <p className="mt-2 text-sm text-red-600">
                        Por favor ingresa un correo electrónico válido
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="LockClosedIcon" className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="focus:outline-none"
                        >
                          <span className="sr-only">{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</span>
                          <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 mb-6 text-right text-sm">
                    <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  {loginError && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Icon name="ExclamationCircleIcon" className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{loginError}</p>
                          {isVerificationError && (
                            <div className="mt-2">
                              <button
                                type="button"
                                className="text-sm font-medium text-red-700 hover:text-red-800"
                                onClick={handleResendVerification}
                                disabled={resendingEmail}
                              >
                                {resendingEmail ? 'Enviando correo...' : 'Reenviar correo de verificación'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row-reverse gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Iniciando...
                        </>
                      ) : (
                        'Iniciar sesión'
                      )}
                    </button>
                    <button
                      type="button"
                      className="w-full sm:w-auto flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      onClick={handleCloseModal}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
                
                <div className="mt-6 text-center text-sm">
                  <p className="text-gray-600">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                      Regístrate
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to top button */}
      <ScrollToTopButton />
    </div>
  );
};

export default GastifyLandingPage;
