import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import HeroSection from '../../components/HeroSection';
import MethodologiesSection from '../../components/MethodologiesSection';
import TeamSection from '../../components/TeamSection';
import ServicesSection from '../../components/ServicesSection';

const LandingPage: React.FC = () => {
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
      navigate('/app/requests');
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
              <a 
                href="javascript:void(0)" 
                onClick={() => {
                  // Eliminar parámetros de URL y navegar a la sección
                  navigate('/', { replace: true });
                  document.getElementById('metodologias')?.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="text-base font-medium text-gray-300 hover:text-white"
              >
                Metodologías
              </a>
              <a 
                href="javascript:void(0)" 
                onClick={() => {
                  // Eliminar parámetros de URL y navegar a la sección
                  navigate('/', { replace: true });
                  document.getElementById('tecnologias')?.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="text-base font-medium text-gray-300 hover:text-white"
              >
                Tecnologías
              </a>
              <a 
                href="javascript:void(0)" 
                onClick={() => {
                  // Eliminar parámetros de URL y navegar a la sección
                  navigate('/', { replace: true });
                  document.getElementById('fundadores')?.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="text-base font-medium text-gray-300 hover:text-white"
              >
                Equipo
              </a>
              <button
                onClick={() => setShowLoginModal(true)}
                className="whitespace-nowrap text-base font-medium text-gray-300 hover:text-white"
              >
                Iniciar sesión
              </button>
              <Link
                to="/register"
                className="whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-gray-900 bg-blue-500 hover:bg-blue-600"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section with animations */}
      <HeroSection setShowLoginModal={setShowLoginModal} />

      {/* Metodologías section with animations */}
      <MethodologiesSection />

      {/* Stack Tecnológico section con tarjetas oscuras */}
      <div id="tecnologias" className="relative py-16 bg-[#0e1220] overflow-hidden lg:py-24">
        {/* Section Separator - Top decorative line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Fondo similar a servicios destacados pero con variación */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c101e] via-[#121c35] to-[#0e152a] mix-blend-normal" />
          
          {/* Círculos difuminados en posiciones diferentes */}
          <div className="absolute -top-60 left-1/3 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-3xl" />
          <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-indigo-600/5 blur-3xl" />
          <div className="absolute bottom-1/3 left-0 w-[350px] h-[350px] rounded-full bg-purple-600/5 blur-3xl" />
          
          {/* Patrón de fondo de hexágonos pero girado */}
          <div className="absolute inset-0 opacity-[0.03]" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 20V40L30 55L5 40V20L30 5Z' stroke='white' stroke-opacity='0.2' fill='none'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px',
              transform: 'rotate(30deg)'
            }}
          />
        </div>
        
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
          <div className="relative">
            <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Stack</span> Tecnológico
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-300">
              Utilizamos tecnologías modernas y escalables para desarrollar soluciones robustas y adaptables.
            </p>
          </div>

          <div className="mt-12 lg:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Frontend Card */}
            <div className="bg-[#111827] p-8 rounded-lg shadow-lg border border-[#1e293b] text-center">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Icon name="CodeBracketIcon" className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <h3 className="text-gray-400 font-medium mb-2">
                Frontend
              </h3>
              <h2 className="text-white text-2xl font-bold mb-3">
                React & TypeScript
              </h2>
              <div className="text-blue-400 text-sm space-y-1">
                <p>TailwindCSS</p>
                <p>Redux / Context API</p>
                <p>Formik & Yup</p>
              </div>
            </div>

            {/* Backend Card */}
            <div className="bg-[#111827] p-8 rounded-lg shadow-lg border border-[#1e293b] text-center">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Icon name="ServerIcon" className="h-8 w-8 text-purple-400" />
                </div>
              </div>
              <h3 className="text-gray-400 font-medium mb-2">
                Backend
              </h3>
              <h2 className="text-white text-2xl font-bold mb-3">
                Node.js & Express
              </h2>
              <div className="text-purple-400 text-sm space-y-1">
                <p>MongoDB</p>
                <p>RESTful APIs</p>
                <p>JWT Authentication</p>
              </div>
            </div>

            {/* DevOps Card */}
            <div className="bg-[#111827] p-8 rounded-lg shadow-lg border border-[#1e293b] text-center">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Icon name="CubeIcon" className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <h3 className="text-gray-400 font-medium mb-2">
                DevOps
              </h3>
              <h2 className="text-white text-2xl font-bold mb-3">
                Docker & Kubernetes
              </h2>
              <div className="text-green-400 text-sm space-y-1">
                <p>CI/CD Pipelines</p>
                <p>AWS / Azure</p>
                <p>Monitoring & Logging</p>
              </div>
            </div>

            {/* Herramientas Card */}
            <div className="bg-[#111827] p-8 rounded-lg shadow-lg border border-[#1e293b] text-center">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <Icon name="WrenchScrewdriverIcon" className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
              <h3 className="text-gray-400 font-medium mb-2">
                Herramientas
              </h3>
              <h2 className="text-white text-2xl font-bold mb-3">
                Git & GitHub
              </h2>
              <div className="text-yellow-400 text-sm space-y-1">
                <p>Jira / Trello</p>
                <p>Figma / Adobe XD</p>
                <p>Jest / Cypress</p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Fundadores section */}
      <TeamSection />

      {/* Servicios destacados section */}
      <ServicesSection />

      {/* FAQ section */}
      <div id="faq" className="bg-gray-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Respuestas a las preguntas más comunes sobre nuestros servicios
            </p>
          </div>
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="space-y-6">
              {/* Pregunta 1 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Icon name="QuestionMarkCircleIcon" className="h-6 w-6 text-blue-500 mr-2" />
                  ¿Cuánto tiempo toma desarrollar un proyecto?
                </h3>
                <p className="mt-2 text-gray-600">
                  Cada proyecto es único, pero generalmente nuestros desarrollos toman entre 2-6 meses dependiendo de la complejidad. Trabajamos con metodologías ágiles que permiten entregas incrementales y visibilidad temprana de resultados.
                </p>
              </div>
              
              {/* Pregunta 2 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Icon name="QuestionMarkCircleIcon" className="h-6 w-6 text-blue-500 mr-2" />
                  ¿Qué metodologías de trabajo utilizan?
                </h3>
                <p className="mt-2 text-gray-600">
                  Implementamos principalmente Scrum y Kanban, adaptadas a las necesidades específicas de cada proyecto y cliente. Estas metodologías ágiles nos permiten ser flexibles, transparentes y entregar valor de forma constante.
                </p>
              </div>
              
              {/* Pregunta 3 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Icon name="QuestionMarkCircleIcon" className="h-6 w-6 text-blue-500 mr-2" />
                  ¿Ofrecen soporte después del lanzamiento?
                </h3>
                <p className="mt-2 text-gray-600">
                  Sí, ofrecemos planes de soporte y mantenimiento para todos nuestros proyectos. Además, proporcionamos capacitación al equipo del cliente para asegurar una transición suave y el máximo aprovechamiento de la solución.
                </p>
              </div>
              
              {/* Pregunta 4 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Icon name="QuestionMarkCircleIcon" className="h-6 w-6 text-blue-500 mr-2" />
                  ¿Cómo garantizan la calidad del software?
                </h3>
                <p className="mt-2 text-gray-600">
                  Implementamos prácticas de ingeniería de software como desarrollo basado en pruebas (TDD), integración continua, revisiones de código y pruebas automatizadas. Cada proyecto pasa por rigurosas fases de QA antes de su entrega.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contacto section */}
      <div id="contacto" className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Conversemos sobre tu proyecto</h2>
              <p className="mt-4 text-lg text-gray-500">
                Estamos listos para ayudarte a transformar tus ideas en soluciones digitales escalables.
              </p>
              <div className="mt-8 space-y-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon name="EnvelopeIcon" className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-3 text-base text-gray-500">
                    <p>info@encodergroup.cl</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-6 w-6 fill-current text-blue-500">
                      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
                    </svg>
                  </div>
                  <div className="ml-3 text-base text-gray-500">
                    <p>@encodegroup.cl</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon name="MapPinIcon" className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-3 text-base text-gray-500">
                    <p>Puerto Montt, Chile</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg shadow-md">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">Empresa</label>
                  <input
                    type="text"
                    name="company"
                    id="company"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mensaje</label>
                  <textarea
                    name="message"
                    id="message"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Enviar mensaje
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">¿Listo para transformar tu negocio?</span>
            <span className="block">Comienza tu proyecto con EncoderGroup.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-100">
            Únete a las empresas que están impulsando su crecimiento con nuestras soluciones tecnológicas escalables y personalizadas.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 sm:w-auto"
            >
              Comenzar proyecto
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-700 sm:w-auto"
            >
              Acceder a mi cuenta
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-white text-xl font-bold flex items-center mb-4">
                <Icon name="CommandLineIcon" className="h-6 w-6 text-blue-500 mr-2" />
                <span className="text-blue-500">Encoder</span>Group
              </span>
              <p className="text-gray-400 text-sm max-w-xs text-center md:text-left">
                Soluciones tecnológicas escalables para empresas que buscan transformar sus procesos y crecer en la era digital.
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-white text-lg font-semibold mb-4">Navegación</h3>
              <div className="flex flex-col space-y-2">
                <a href="#metodologias" className="text-gray-400 hover:text-white">Metodologías</a>
                <a href="#tecnologias" className="text-gray-400 hover:text-white">Tecnologías</a>

                <a href="#fundadores" className="text-gray-400 hover:text-white">Equipo</a>
                <Link to="/login" className="text-gray-400 hover:text-white">Iniciar sesión</Link>
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-white text-lg font-semibold mb-4">Contacto</h3>
              <div className="flex flex-col space-y-2 text-gray-400">
                <div className="flex items-center">
                  <Icon name="EnvelopeIcon" className="h-5 w-5 mr-2 text-blue-500" />
                  <span>info@encodergroup.cl</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-5 w-5 fill-current text-blue-500 mr-2">
                    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
                  </svg>
                  <span>@encodegroup.cl</span>
                </div>
                <div className="flex items-center">
                  <Icon name="MapPinIcon" className="h-5 w-5 mr-2 text-blue-500" />
                  <span>Puerto Montt, Chile</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} EncoderGroup. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal de inicio de sesión */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              <Icon name="XMarkIcon" className="h-6 w-6" />
            </button>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <Icon name="LockClosedIcon" className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Iniciar sesión</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Ingresa tus credenciales para acceder a tu cuenta de EncoderGroup
                </p>
              </div>
              
              {loginError && (
                <div 
                  className={`mb-6 rounded-xl shadow-lg transform transition-all duration-300 animate-fadeIn ${
                    isVerificationError 
                      ? 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200' 
                      : 'bg-gradient-to-br from-red-50 via-red-100 to-white border-2 border-red-300'
                  }`}
                  style={{
                    animation: 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
                  }}
                >
                  <div className={`px-5 py-3 flex items-center justify-between ${
                    isVerificationError ? 'bg-amber-500' : 'bg-gradient-to-r from-red-600 to-red-500'
                  }`}>
                    <h3 className="text-base font-medium text-white flex items-center">
                      {isVerificationError 
                        ? <>
                            <Icon name="ExclamationTriangleIcon" className="h-5 w-5 mr-2" />
                            Verificación pendiente
                          </>
                        : <>
                            <Icon name="ShieldExclamationIcon" className="h-5 w-5 mr-2" />
                            Error de acceso
                          </>
                      }
                    </h3>
                    <button 
                      onClick={() => setLoginError('')} 
                      className="text-white hover:text-gray-200 transition-colors"
                      aria-label="Cerrar notificación"
                    >
                      <Icon name="XMarkIcon" className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 p-1 bg-white rounded-full shadow-sm">
                        {isVerificationError ? (
                          <Icon name="ExclamationTriangleIcon" className="h-6 w-6 text-amber-500" />
                        ) : (
                          <Icon name="ExclamationCircleIcon" className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className={`text-sm font-medium ${
                          isVerificationError ? 'text-amber-800' : 'text-red-800'
                        }`}>
                          <p className="leading-relaxed">{loginError}</p>
                        </div>
                        
                        {isVerificationError && (
                          <div className="mt-4 bg-yellow-100 p-3 rounded-md border border-yellow-300">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 pt-0.5">
                                <Icon name="InformationCircleIcon" className="h-5 w-5 text-yellow-500" />
                              </div>
                              <div className="ml-3 text-sm text-yellow-800">
                                <p>
                                  Se requiere verificar tu correo electrónico para continuar. 
                                  Por favor revisa tu bandeja de entrada y spam para encontrar el correo de verificación.
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={resendingEmail}
                                className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                              >
                                {resendingEmail ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enviando correo...
                                  </>
                                ) : (
                                  <>
                                    <Icon name="EnvelopeIcon" className="mr-2 h-4 w-4" />
                                    Reenviar correo de verificación
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(false);
                      }}
                      placeholder="Ingresa tu correo electrónico"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        emailError 
                          ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                      required
                    />
                    {emailError && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Icon name="ExclamationCircleIcon" className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {emailError && (
                    <p className="mt-2 text-sm text-red-600">Por favor, ingresa un correo electrónico válido.</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      <Icon name={showPassword ? "EyeSlashIcon" : "EyeIcon"} className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Recordar sesión
                    </label>
                  </div>
                  <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cargando...
                      </span>
                    ) : 'Iniciar sesión'}
                  </button>
                </div>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  ¿No tienes una cuenta?{' '}
                  <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                    Regístrate ahora
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;