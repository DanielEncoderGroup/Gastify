import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';

// Layout components
import Layout from './components/layout/Layout';
import PrivateRoute from './components/routes/PrivateRoute';
import AdminRoute from './components/routes/AdminRoute';
import ClientRoute from './components/routes/ClientRoute';

// Landing page
import LandingPage from './pages/landing/LandingPage';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Dashboard and app pages
// Dashboard eliminado
import ProjectsList from './pages/projects/ProjectsList';
import ProjectForm from './pages/projects/ProjectForm';
import ProjectDetail from './pages/projects/ProjectDetail';
import MeetingsScheduler from './pages/meetings/MeetingsScheduler';
import RequestsList from './pages/requests/RequestsList';
import RequestDetail from './pages/requests/RequestDetail';
import RequestForm from './pages/requests/RequestForm';
// import NewProjectRequest eliminado
import ProjectRequestsAdmin from './pages/projects/ProjectRequestsAdmin';
// Statistics eliminado
import Profile from './pages/profile/Profile';
import NotFound from './pages/NotFound';

// Componente de inicialización para garantizar que se revisa la autenticación
// antes de renderizar las rutas
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Verificar la autenticación al cargar la aplicación
  useEffect(() => {
    console.log('AppInitializer: Inicializando la aplicación...');
    console.log('Estado actual: isAuthenticated =', isAuthenticated, 'loading =', loading);
    
    // Esta lógica se ejecuta después de que AuthContext haya terminado su inicialización
    if (!loading) {
      console.log('AppInitializer: Inicialización completada');
      setIsInitialized(true);
      
      // Si hay un token en localStorage pero no se ha autenticado correctamente, forzar recarga
      const token = localStorage.getItem('token');
      if (token && !isAuthenticated && !location.pathname.includes('/login')) {
        console.log('AppInitializer: Se encontró token pero no está autenticado, intentando recargar datos');
        // Opción 1: Forzar recarga de la página para reinicializar correctamente
        // window.location.reload();
        
        // Opción 2: Redirigir a la página de inicio para que se inicialice correctamente
        navigate('/app/projects');
      }
    }
  }, [isAuthenticated, loading, navigate, location]);
  
  // Mostrar un spinner mientras se inicializa
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Una vez inicializado, renderizar la aplicación
  return <>{children}</>;
};

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AppInitializer>
        <Routes>
          {/* Public landing page as the main route */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          {/* Protected routes - all under /app prefix */}
          <Route path="/app" element={<PrivateRoute element={<Layout />} />}>
            <Route index element={<RequestsList />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/new" element={<ProjectForm />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="projects/:id/edit" element={<ProjectForm />} />
            <Route path="meetings" element={<MeetingsScheduler />} />
            <Route path="requests" element={<RequestsList />} />
            <Route path="requests/:id" element={<RequestDetail />} />
            
            {/* Rutas protegidas para administradores */}
            <Route element={<AdminRoute />}>
              <Route path="projects/admin" element={<ProjectRequestsAdmin />} />
            </Route>
            
            {/* Rutas protegidas para clientes */}
            <Route element={<ClientRoute />}>
              <Route path="requests/new" element={<RequestForm />} />
              <Route path="requests/edit/:id" element={<RequestForm />} />
              {/* Ruta para solicitudes de proyectos eliminada */}
            </Route>
            {/* Ruta de Estadísticas eliminada */}
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppInitializer>
    </>
  );
}

export default App;