import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import ProjectRequestForm from '../../components/projects/ProjectRequestForm';

/**
 * Página para crear una nueva solicitud de proyecto informático
 * Utiliza el formulario avanzado con campos específicos para proyectos tecnológicos
 */
const NewProjectRequest: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Verificar que el usuario es un cliente o usuario normal
  useEffect(() => {
    if (user && user.role !== 'user' && user.role !== 'client') {
      toast.error('No tienes permiso para acceder a esta página');
      navigate('/app/requests');
    }
  }, [user, navigate]);

  // Manejar cancelación
  const handleCancel = () => {
    navigate('/app/requests');
  };

  // Manejar guardado exitoso
  const handleSaved = (id: string) => {
    navigate(`/app/requests/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Nueva Solicitud de Proyecto</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete el formulario con los detalles de su proyecto para que nuestro equipo pueda evaluarlo y crear una propuesta adaptada a sus necesidades.
        </p>
      </div>

      <ProjectRequestForm 
        onCancel={handleCancel}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default NewProjectRequest;