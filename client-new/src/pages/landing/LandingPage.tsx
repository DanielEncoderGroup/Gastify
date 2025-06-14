import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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
                  document.getElementById('valores')?.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="text-base font-medium text-gray-300 hover:text-white"
              >
                Valores
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

      {/* Hero section */}
      <div className="relative bg-gray-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-gray-900 mix-blend-multiply" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-500 opacity-20" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Soluciones Tecnológicas <span className="text-blue-400">Escalables</span> para Empresas Modernas
          </h1>
          <p className="mt-6 text-xl text-gray-300 max-w-3xl">
            EncoderGroup transforma el modo en que las empresas gestionan sus recursos, proyectos y equipos mediante soluciones digitales a medida que crecen con tu negocio.
          </p>
          <div className="mt-10 flex items-center space-x-6">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Comenzar ahora
            </Link>
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-base font-medium text-white hover:text-blue-300"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Metodologías section */}
      <div id="metodologias" className="py-16 bg-white overflow-hidden lg:py-24">
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
          <div className="relative">
            <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Metodologías de Trabajo
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
              Implementamos metodologías ágiles que garantizan la entrega de valor constante y la adaptación a los cambios.
            </p>
          </div>

          <div className="mt-12 lg:mt-16 lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="relative p-8 bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-xl">
              <div className="h-14 w-14 rounded-md bg-blue-500 flex items-center justify-center mb-5">
                <Icon name="ArrowPathIcon" className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Scrum</h3>
              <p className="text-gray-500 mb-3">
                Iteraciones cortas (sprints) que permiten entregar valor de forma incremental y obtener retroalimentación constante.
              </p>
              <ul className="text-gray-500 list-disc pl-5 space-y-1">
                <li>Sprints de 1-2 semanas</li>
                <li>Ceremonias ágiles</li>
                <li>Mejora continua</li>
              </ul>
            </div>

            <div className="relative mt-10 lg:mt-0 p-8 bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-xl">
              <div className="h-14 w-14 rounded-md bg-blue-500 flex items-center justify-center mb-5">
                <Icon name="Squares2X2Icon" className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Kanban</h3>
              <p className="text-gray-500 mb-3">
                Visualización del flujo de trabajo que permite identificar cuellos de botella y optimizar procesos.
              </p>
              <ul className="text-gray-500 list-disc pl-5 space-y-1">
                <li>Flujo continuo</li>
                <li>Limitación de trabajo en progreso</li>
                <li>Optimización de ciclos</li>
              </ul>
            </div>

            <div className="relative mt-10 lg:mt-0 p-8 bg-white rounded-lg shadow-md transition-all duration-300 hover:shadow-xl">
              <div className="h-14 w-14 rounded-md bg-blue-500 flex items-center justify-center mb-5">
                <Icon name="CpuChipIcon" className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">DevOps</h3>
              <p className="text-gray-500 mb-3">
                Integración entre desarrollo y operaciones para automatizar procesos y acelerar entregas.
              </p>
              <ul className="text-gray-500 list-disc pl-5 space-y-1">
                <li>CI/CD automatizado</li>
                <li>Infraestructura como código</li>
                <li>Monitoreo continuo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tecnologías section */}
      <div id="tecnologias" className="py-16 bg-gray-50 overflow-hidden lg:py-24">
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
          <div className="relative">
            <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Stack Tecnológico
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
              Utilizamos tecnologías modernas y escalables para desarrollar soluciones robustas y adaptables.
            </p>
          </div>

          <div className="mt-12 lg:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="h-10 w-10 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mr-3">
                  <Icon name="CodeBracketIcon" className="h-6 w-6" />
                </span>
                Frontend
              </h3>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> React & TypeScript
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> TailwindCSS
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> Redux / Context API
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> Formik & Yup
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="h-10 w-10 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mr-3">
                  <Icon name="ServerIcon" className="h-6 w-6" />
                </span>
                Backend
              </h3>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> Node.js & Express
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> MongoDB
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> RESTful APIs
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> JWT Authentication
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="h-10 w-10 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mr-3">
                  <Icon name="CubeIcon" className="h-6 w-6" />
                </span>
                DevOps
              </h3>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> Docker & Kubernetes
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> CI/CD Pipelines
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> AWS / Azure
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> Monitoring & Logging
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="h-10 w-10 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mr-3">
                  <Icon name="WrenchScrewdriverIcon" className="h-6 w-6" />
                </span>
                Herramientas
              </h3>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> Git & GitHub
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> Jira / Trello
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> Figma / Adobe XD
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-blue-500">•</span> Jest / Cypress
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Valores section */}
      <div id="valores" className="py-16 bg-white overflow-hidden lg:py-24">
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
          <div className="relative">
            <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Nuestros Valores
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
              Estos valores definen nuestra cultura y guían cada decisión que tomamos en EncoderGroup.
            </p>
          </div>

          <div className="mt-12 lg:mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative p-8 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <Icon name="ShieldCheckIcon" className="h-6 w-6 mr-2 text-blue-500" />
                Compromiso
              </h3>
              <p className="text-gray-700">
                Nos comprometemos a entregar soluciones de alta calidad que superen las expectativas de nuestros clientes.
                Asumimos la responsabilidad de nuestro trabajo y cumplimos con los plazos establecidos.
              </p>
            </div>

            <div className="relative p-8 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <Icon name="LightBulbIcon" className="h-6 w-6 mr-2 text-blue-500" />
                Innovación
              </h3>
              <p className="text-gray-700">
                Buscamos constantemente nuevas formas de resolver problemas y mejorar nuestros procesos.
                Fomentamos la creatividad y el pensamiento disruptivo en todos los niveles de la organización.
              </p>
            </div>

            <div className="relative p-8 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <Icon name="UserGroupIcon" className="h-6 w-6 mr-2 text-blue-500" />
                Colaboración
              </h3>
              <p className="text-gray-700">
                Creemos en el poder del trabajo en equipo. Colaboramos estrechamente con nuestros clientes y
                entre nosotros para lograr resultados excepcionales. Valoramos la diversidad de pensamiento y experiencia.
              </p>
            </div>

            <div className="relative p-8 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <Icon name="DocumentTextIcon" className="h-6 w-6 mr-2 text-blue-500" />
                Transparencia
              </h3>
              <p className="text-gray-700">
                Mantenemos una comunicación clara y honesta en todas nuestras interacciones. Compartimos abiertamente
                nuestros procesos, decisiones y resultados, construyendo confianza con nuestros clientes y colaboradores.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Proceso section */}
      <div id="proceso" className="py-16 bg-gray-50 overflow-hidden lg:py-24">
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
          <div className="relative">
            <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Un proceso claro y orientado a resultados
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
              Implementamos un enfoque estructurado que asegura la calidad, transparencia y comunicación constante en cada fase del proyecto.
            </p>
          </div>

          <div className="mt-16 relative">
            {/* Línea vertical de proceso */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-200"></div>

            {/* Paso 1 */}
            <div className="relative mb-24">
              <div className="flex items-center justify-center">
                <div className="absolute z-10 flex items-center justify-center h-12 w-12 rounded-full bg-blue-500 text-white shadow-lg left-1/2 transform -translate-x-1/2">
                  <span className="font-bold">1</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:text-right md:pr-12 flex flex-col items-center md:items-end">
                  <h3 className="text-xl font-bold text-gray-900">Descubrimiento y Análisis</h3>
                  <p className="mt-2 text-gray-600 max-w-md">
                    Comprendemos tus necesidades, objetivos de negocio y visión del proyecto. Identificamos usuarios y requerimientos clave para definir el alcance.
                  </p>
                </div>
                <div className="hidden md:block">
                  <Icon name="MagnifyingGlassIcon" className="h-16 w-16 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="relative mb-24">
              <div className="flex items-center justify-center">
                <div className="absolute z-10 flex items-center justify-center h-12 w-12 rounded-full bg-blue-500 text-white shadow-lg left-1/2 transform -translate-x-1/2">
                  <span className="font-bold">2</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="hidden md:block md:text-right md:pr-12">
                  <Icon name="ChartBarIcon" className="h-16 w-16 text-blue-500 ml-auto" />
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <h3 className="text-xl font-bold text-gray-900">Planificación Estratégica</h3>
                  <p className="mt-2 text-gray-600 max-w-md">
                    Elaboramos una estrategia detallada, definimos arquitectura, seleccionamos tecnologías y creamos un plan de acción con cronograma claro.
                  </p>
                </div>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="relative mb-24">
              <div className="flex items-center justify-center">
                <div className="absolute z-10 flex items-center justify-center h-12 w-12 rounded-full bg-blue-500 text-white shadow-lg left-1/2 transform -translate-x-1/2">
                  <span className="font-bold">3</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:text-right md:pr-12 flex flex-col items-center md:items-end">
                  <h3 className="text-xl font-bold text-gray-900">Diseño y Prototipado</h3>
                  <p className="mt-2 text-gray-600 max-w-md">
                    Creamos interfaces intuitivas y experiencias de usuario atractivas, con prototipos interactivos para validar antes del desarrollo.
                  </p>
                </div>
                <div className="hidden md:block">
                  <Icon name="PaintBrushIcon" className="h-16 w-16 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="relative mb-24">
              <div className="flex items-center justify-center">
                <div className="absolute z-10 flex items-center justify-center h-12 w-12 rounded-full bg-blue-500 text-white shadow-lg left-1/2 transform -translate-x-1/2">
                  <span className="font-bold">4</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="hidden md:block md:text-right md:pr-12">
                  <Icon name="CodeBracketIcon" className="h-16 w-16 text-blue-500 ml-auto" />
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <h3 className="text-xl font-bold text-gray-900">Desarrollo Ágil</h3>
                  <p className="mt-2 text-gray-600 max-w-md">
                    Implementamos mediante sprints con metodologías ágiles (Scrum), entregas incrementales y feedback continuo para asegurar calidad.
                  </p>
                </div>
              </div>
            </div>

            {/* Paso 5 */}
            <div className="relative mb-24">
              <div className="flex items-center justify-center">
                <div className="absolute z-10 flex items-center justify-center h-12 w-12 rounded-full bg-blue-500 text-white shadow-lg left-1/2 transform -translate-x-1/2">
                  <span className="font-bold">5</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:text-right md:pr-12 flex flex-col items-center md:items-end">
                  <h3 className="text-xl font-bold text-gray-900">Testing y Aseguramiento</h3>
                  <p className="mt-2 text-gray-600 max-w-md">
                    Realizamos pruebas exhaustivas funcionales, de seguridad y rendimiento para garantizar una aplicación robusta y libre de errores.
                  </p>
                </div>
                <div className="hidden md:block">
                  <Icon name="BugAntIcon" className="h-16 w-16 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Paso 6 */}
            <div className="relative mb-24">
              <div className="flex items-center justify-center">
                <div className="absolute z-10 flex items-center justify-center h-12 w-12 rounded-full bg-blue-500 text-white shadow-lg left-1/2 transform -translate-x-1/2">
                  <span className="font-bold">6</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="hidden md:block md:text-right md:pr-12">
                  <Icon name="RocketLaunchIcon" className="h-16 w-16 text-blue-500 ml-auto" />
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <h3 className="text-xl font-bold text-gray-900">Despliegue e Implementación</h3>
                  <p className="mt-2 text-gray-600 max-w-md">
                    Desplegamos en producción con CI/CD, garantizando una transición suave, monitoreo y escalabilidad desde el primer día.
                  </p>
                </div>
              </div>
            </div>

            {/* Paso 7 */}
            <div className="relative">
              <div className="flex items-center justify-center">
                <div className="absolute z-10 flex items-center justify-center h-12 w-12 rounded-full bg-blue-500 text-white shadow-lg left-1/2 transform -translate-x-1/2">
                  <span className="font-bold">7</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:text-right md:pr-12 flex flex-col items-center md:items-end">
                  <h3 className="text-xl font-bold text-gray-900">Soporte y Evolución</h3>
                  <p className="mt-2 text-gray-600 max-w-md">
                    Proporcionamos acompañamiento continuo, capacitación, soporte técnico y evolución del producto para adaptarse a nuevas necesidades.
                  </p>
                </div>
                <div className="hidden md:block">
                  <Icon name="AcademicCapIcon" className="h-16 w-16 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="mt-16 flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="#contacto" 
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Iniciar proyecto
            </a>
            <a 
              href="#metodologias" 
              className="inline-flex items-center justify-center px-5 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
            >
              Conocer más sobre nuestras metodologías
            </a>
          </div>
        </div>
      </div>

      {/* Testimonios section - ACTUALIZADO */}
      <div id="testimonios" className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Lo que nuestros clientes dicen</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Quality Metrics ha transformado sus procesos con nuestras soluciones centralizadas
            </p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
            {/* Testimonio 1 - Amílcar Arriagada */}
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm border border-gray-200 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500 rounded-full p-2">
                  <Icon name="ChatBubbleLeftIcon" className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-gray-700 mb-6 pt-4">
                <p className="italic">"El sistema centralizado de datos que desarrolló EncoderGroup revolucionó nuestra capacidad de tomar decisiones estratégicas. Ahora tenemos acceso inmediato a métricas críticas y una visión unificada de toda nuestra operación."</p>
              </div>
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">AA</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900">Amílcar Arriagada</h4>
                  <p className="text-gray-500">CEO, Quality Metrics</p>
                </div>
              </div>
            </div>
            
            {/* Testimonio 2 - Rodrigo Vilches */}
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm border border-gray-200 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500 rounded-full p-2">
                  <Icon name="ChatBubbleLeftIcon" className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-gray-700 mb-6 pt-4">
                <p className="italic">"El dashboard interactivo que construyeron nos permite monitorear KPIs en tiempo real y identificar oportunidades de mejora inmediatamente. La visualización de datos nunca había sido tan clara y accionable para nuestro equipo."</p>
              </div>
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">RV</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900">Rodrigo Vilches</h4>
                  <p className="text-gray-500">Jefe de Producto, Quality Metrics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fundadores section - NUEVO */}
      <div id="fundadores" className="bg-gray-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Nuestro Equipo Fundador
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Ingenieros informáticos con la experiencia y pasión necesarias para transformar ideas en soluciones digitales exitosas
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Daniel Iturra */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="h-64 bg-gradient-to-br from-blue-600 to-indigo-700 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-blue-600">DI</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Daniel Iturra</h3>
                <p className="text-blue-600 font-medium mb-4 text-center">Ingeniero Informático</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Especialista en arquitectura de software y desarrollo backend. Con amplia experiencia en el diseño de sistemas escalables y la implementación de soluciones tecnológicas robustas que impulsan el crecimiento empresarial.
                </p>
                <div className="mt-4 flex justify-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Backend
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Arquitectura
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    DevOps
                  </span>
                </div>
              </div>
            </div>
            
            {/* Mario Bronchuer */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="h-64 bg-gradient-to-br from-indigo-600 to-purple-700 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-indigo-600">MB</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Mario Bronchuer</h3>
                <p className="text-indigo-600 font-medium mb-4 text-center">Ingeniero Informático</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Experto en desarrollo frontend y experiencia de usuario. Se enfoca en crear interfaces intuitivas y funcionales que conectan de manera efectiva la tecnología con las necesidades del usuario final.
                </p>
                <div className="mt-4 flex justify-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Frontend
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    UX/UI
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    React
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Servicios destacados section - NUEVO (reemplaza recursos) */}
      <div id="servicios" className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Servicios destacados
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Soluciones especializadas que impulsan la transformación digital de tu empresa
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Servicio 1 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon name="ChartBarIcon" className="h-24 w-24 text-white opacity-90" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboards Interactivos</h3>
                <p className="text-gray-500 mb-4">
                  Visualización de datos en tiempo real con métricas personalizadas que facilitan la toma de decisiones estratégicas.
                </p>
                <div className="flex items-center text-blue-600 font-medium hover:text-blue-800">
                  <span className="mr-2">Conocer más</span>
                  <Icon name="ArrowRightIcon" className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            {/* Servicio 2 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100">
              <div className="h-48 bg-gradient-to-br from-green-500 to-green-600 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon name="CircleStackIcon" className="h-24 w-24 text-white opacity-90" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sistemas Centralizados</h3>
                <p className="text-gray-500 mb-4">
                  Unificación de datos y procesos empresariales en una plataforma central para mayor eficiencia operacional.
                </p>
                <div className="flex items-center text-blue-600 font-medium hover:text-blue-800">
                  <span className="mr-2">Conocer más</span>
                  <Icon name="ArrowRightIcon" className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            {/* Servicio 3 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-purple-600 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon name="CogIcon" className="h-24 w-24 text-white opacity-90" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Automatización de Procesos</h3>
                <p className="text-gray-500 mb-4">
                  Optimización y automatización de flujos de trabajo para reducir tareas manuales y aumentar la productividad.
                </p>
                <div className="flex items-center text-blue-600 font-medium hover:text-blue-800">
                  <span className="mr-2">Conocer más</span>
                  <Icon name="ArrowRightIcon" className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                <a href="#valores" className="text-gray-400 hover:text-white">Valores</a>
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