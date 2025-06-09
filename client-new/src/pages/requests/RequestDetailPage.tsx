// src/pages/requests/RequestDetailPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { RequestDetail as RequestDetailType } from '../../types/request';
import { requestService } from '../../services/requestService';
import { useAuth } from '../../contexts/AuthContext';
import ProjectRequestDetail from '../../components/projects/ProjectRequestDetail';

const RequestDetailPage: React.FC = () => {
  // 1) Extraer ID de la ruta
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 2) Estado local para cargar la data
  const [request, setRequest] = useState<RequestDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  // 3) Función para recargar el detalle (por ejemplo, después de añadir comentario, cambiar estado, etc.)
  const fetchRequest = useCallback(async () => {
    if (!id) {
      navigate('/app/requests');
      return;
    }
    setLoading(true);
    try {
      const resp = await requestService.getById(id);
      setRequest(resp.request);
    } catch (err) {
      console.error('Error al cargar detalle de solicitud:', err);
      toast.error('No se pudo cargar la solicitud');
      navigate('/app/requests');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  // Mientras cargamos, podemos mostrar un spinner simple
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no hay request (quizá falló la llamada), redirigimos:
  if (!request) {
    return null;
  }

  // Determinamos si el usuario actual es ADMIN (para pasarle esa prop):
  const isAdmin = user?.role === 'admin';

  return (
    <div className="mx-auto">
      <ProjectRequestDetail
        request={request}
        onRefresh={fetchRequest}
        isAdmin={!!isAdmin}
      />
    </div>
  );
};

export default RequestDetailPage;
