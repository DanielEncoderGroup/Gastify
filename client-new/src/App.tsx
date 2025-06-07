import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

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
import ProjectsList from './pages/projects/ProjectsList';
import ProjectForm from './pages/projects/ProjectForm';
import RequestDetailPage from './pages/requests/RequestDetailPage';
import ProjectDetail from './pages/projects/ProjectDetail';
import MeetingsScheduler from './pages/meetings/MeetingsScheduler';
import ProjectRequestsAdmin from './pages/projects/ProjectRequestsAdmin';
import NewProjectRequest from './pages/projects/NewProjectRequest';
import RequestsList from './pages/requests/RequestsList';
import NotificationsPage from './components/notifications/NotificationsPage';
import Profile from './pages/profile/Profile';
import NotFound from './pages/NotFound';

// Componente de inicialización para garantizar que se revisa la autenticación
// antes de renderizar las rutas
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, logout } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Verificar la autenticación al cargar la aplicación
  useEffect(() => {
    console.log('AppInitializer: Inicializando la aplicación...');
    console.log('Estado actual: isAuthenticated =', isAuthenticated, 'loading =', loading);
    console.log('Ruta actual:', location.pathname);
    
    // Esta lógica se ejecuta después de que AuthContext haya terminado su inicialización
    if (!loading) {
      console.log('AppInitializer: Inicialización completada');
      setIsInitialized(true);
      
      // Si hay un token en localStorage pero no se ha autenticado correctamente
      // (posiblemente porque el usuario no está verificado o el token es inválido)
      const token = localStorage.getItem('token');
      if (token && !isAuthenticated) {
        console.log('AppInitializer: Se encontró token pero no está autenticado, verificando validez');
        
        // Verificar si el token parece válido antes de limpiar
        try {
          // Decodificar el token JWT
          const base64Url = token.split('.')[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            // Verificar si el token ha expirado
            if (payload.exp && payload.exp * 1000 > Date.now()) {
              console.log('AppInitializer: Token parece válido pero isAuthenticated es falso, manteniendo sesión');
              
              // Este puede ser un caso donde la página se recargó y el estado no se actualizó aún
              // No hacemos nada más y dejamos que la aplicación continúe intentando inicializar
              
              // Si estamos en el perfil o en una ruta protegida y el token parece válido, no redirigimos
              return;
            }
          }
        } catch (e) {
          console.error('Error al verificar token:', e);
        }
        
        // Si llegamos aquí es porque el token no es válido
        console.log('AppInitializer: Token no válido, limpiando datos de sesión');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Si el usuario está intentando acceder a una ruta protegida, redirigir al login
        if (location.pathname.startsWith('/app')) {
          navigate('/?showLogin=true');
        }
      }
    }
  }, [isAuthenticated, loading, navigate, location, logout]);
  
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

// Componente wrapper para las rutas protegidas que necesitan notificaciones
const ProtectedLayoutWithNotifications: React.FC = () => {
  return (
    <NotificationProvider>
      <Layout />
    </NotificationProvider>
  );
};

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AppInitializer>
        <Routes>
          {/* Rutas públicas SIN NotificationProvider */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          {/* Rutas protegidas CON NotificationProvider */}
          <Route path="/app" element={<PrivateRoute element={<ProtectedLayoutWithNotifications />} />}>
            <Route index element={<ProjectsList />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/new" element={<ProjectForm />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="projects/:id/edit" element={<ProjectForm />} />
            <Route path="meetings" element={<MeetingsScheduler />} />
            <Route path="requests" element={<RequestsList />} />
            <Route path="requests/:id" element={<RequestDetailPage />} />
            <Route path="requests/:id/edit" element={<NewProjectRequest />} />
            <Route path="projects/request/new" element={<NewProjectRequest />} />
            <Route path="notifications" element={<NotificationsPage />} />
            
            {/* Rutas protegidas para administradores */}
            <Route element={<AdminRoute />}>
              <Route path="projects/admin" element={<ProjectRequestsAdmin />} />
            </Route>
            
            {/* Rutas protegidas para clientes */}
            <Route element={<ClientRoute />}>
              {/* No hay rutas específicas de cliente por el momento */}
            </Route>
            
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