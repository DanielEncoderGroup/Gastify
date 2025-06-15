import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import KanbanBoard from '../../components/projects/KanbanBoard';
import TaskForm from '../../components/projects/TaskForm';
import TaskDetail from '../../components/projects/TaskDetail';
import { Project, Task, Board, TaskFormData } from '../../types/project';
import projectService from '../../services/projectService';

// Tipo para las pestañas
type TabType = 'board' | 'details' | 'files' | 'comments';

const ProjectDetailKanban: React.FC = () => {
  const { user } = useAuth();
  
  // Registrar información del usuario para depuración
  useEffect(() => {
    console.log('Usuario actual:', user);
    console.log('Rol del usuario:', user?.role);
    console.log('¿Es admin?', user?.role?.toLowerCase() === 'admin');
  }, [user]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<{ [key: string]: Task }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<{ id: string; name: string }[]>([]);

  // Cargar datos del proyecto y tablero
  useEffect(() => {
    if (!id) return;
    
    const fetchProjectData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener detalles del proyecto
        const projectResponse = await projectService.getById(id);
        if (projectResponse.success && projectResponse.project) {
          setProject(projectResponse.project);
        }
        
        // Obtener tablero Kanban
        const boardResponse = await projectService.getBoard(id);
        if (boardResponse.success) {
          setBoard(boardResponse.board);
          setTasks(boardResponse.tasks || {});
        }
        
        // TODO: Obtener usuarios asignables (equipo del proyecto + cliente)
        // Por ahora usamos datos de ejemplo
        setAssignableUsers([
          { id: '1', name: 'Ana Gómez' },
          { id: '2', name: 'Miguel Sánchez' },
          { id: '3', name: 'Laura Torres' }
        ]);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar los datos del proyecto:', error);
        toast.error('Error al cargar los datos del proyecto');
        setIsLoading(false);
      }
    };
    
    fetchProjectData();
  }, [id]);

  // Manejar cambios en el tablero (drag & drop)
  const handleBoardChange = async (newBoard: Board) => {
    if (!id || !project) return;
    
    try {
      setBoard(newBoard);
      
      // Actualizar en el backend
      await projectService.updateBoard(id, newBoard);
      toast.success('Tablero actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el tablero:', error);
      toast.error('Error al actualizar el tablero');
    }
  };

  // Manejar clic en una tarea
  const handleTaskClick = (taskId: string) => {
    const task = tasks[taskId];
    if (task) {
      if (user?.role === 'admin') {
        setSelectedTask(task);
        setIsEditingTask(true);
        setShowTaskForm(true);
      } else {
        // Si no es admin, solo mostrar detalles sin opción de editar
        setSelectedTask(task);
      }
    }
  };

  // Cerrar detalle de tarea
  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
  };

  // Abrir formulario para editar tarea
  const handleEditTask = () => {
    setIsEditingTask(true);
  };

  // Eliminar tarea
  const handleDeleteTask = async () => {
    if (!id || !selectedTask) return;
    
    try {
      await projectService.deleteTask(id, selectedTask._id);
      
      // Actualizar estado local
      const taskId = selectedTask._id;
      const newTasks = { ...tasks };
      delete newTasks[taskId];
      
      // Actualizar board para eliminar la tarea de las columnas
      if (board) {
        // Crear una copia segura del board con sus columnas
        const newBoard = {
          ...board,
          columns: { ...board.columns }
        };
        
        // Actualizar cada columna para eliminar la tarea
        for (const columnId of Object.keys(newBoard.columns)) {
          const column = newBoard.columns[columnId];
          newBoard.columns[columnId] = {
            ...column,
            taskIds: column.taskIds.filter(id => id !== taskId)
          };
        }
        
        setBoard(newBoard);
      }
      
      setTasks(newTasks);
      setSelectedTask(null);
      toast.success('Tarea eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar la tarea:', error);
      toast.error('Error al eliminar la tarea');
    }
  };

  // Guardar tarea (crear o actualizar)
  const handleSaveTask = async (taskData: TaskFormData) => {
    if (!id || !project) return;
    
    try {
      if (isEditingTask && selectedTask) {
        // Actualizar tarea existente
        const response = await projectService.updateTask(id, selectedTask._id, taskData);
        if (response.success && response.task) {
          // Actualizar en el estado local
          setTasks(prev => ({
            ...prev,
            [selectedTask._id]: response.task
          }));
          toast.success('Tarea actualizada correctamente');
        }
      } else {
        // Crear nueva tarea
        const response = await projectService.createTask(id, taskData);
        if (response.success && response.task) {
          // Añadir a la lista de tareas
          setTasks(prev => ({
            ...prev,
            [response.task._id]: response.task
          }));
          
          // Añadir a la columna "Por hacer" en el tablero
          if (board) {
            const newBoard = { ...board };
            newBoard.columns.todo = {
              ...newBoard.columns.todo,
              taskIds: [...newBoard.columns.todo.taskIds, response.task._id]
            };
            setBoard(newBoard);
          }
          
          toast.success('Tarea creada correctamente');
        }
      }
      
      // Cerrar formulario y detalles
      setShowTaskForm(false);
      setSelectedTask(null);
      setIsEditingTask(false);
    } catch (error) {
      console.error('Error al guardar la tarea:', error);
      toast.error('Error al guardar la tarea');
    }
  };

  // Obtener nombre de usuario asignado
  const getAssignedUserName = (userId?: string) => {
    if (!userId) return undefined;
    const user = assignableUsers.find(u => u.id === userId);
    return user?.name;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project || !board) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Tablero del Proyecto</h2>
          {user?.role?.toLowerCase() === 'admin' && (
            <button
              onClick={() => {
                setIsEditingTask(false);
                setShowTaskForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Nueva Tarea
            </button>
          )}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Proyecto no encontrado</h2>
          <p className="mt-1 text-sm text-gray-500">
            El proyecto que buscas no existe o ha sido eliminado.
          </p>
          <div className="mt-6">
            <Link
              to="/app/projects"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver a la lista de proyectos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Encabezado con acciones */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{project?.title || 'Detalles del proyecto'}</h2>
          <p className="mt-1 text-sm text-gray-500">{project?.description || ''}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/app/projects')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver
          </button>
          {user?.role?.toLowerCase() === 'admin' && (
            <button
              onClick={() => navigate(`/app/projects/${id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Editar
            </button>
          )}
          {user?.role?.toLowerCase() === 'admin' && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva tarea
            </button>
          )}
        </div>
      </div>

      {/* Información general del proyecto */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Información del proyecto
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Detalles y estado actual del proyecto.
            </p>
          </div>
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
            ${project.status === 'active' ? 'bg-green-100 text-green-800' : 
              project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {project.status === 'active' ? 'Activo' : 
             project.status === 'pending' ? 'Pendiente' : 
             project.status === 'completed' ? 'Completado' : 
             project.status}
          </span>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Descripción
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {project.description}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Fechas
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex items-center space-x-2">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  <span>
                    Inicio: {new Date(project.startDate).toLocaleDateString()}
                  </span>
                </div>
                {project.deadline && (
                  <div className="flex items-center space-x-2 mt-2">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <span>
                      Fecha límite: {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Pestañas */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              className={`${
                activeTab === 'board'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              onClick={() => setActiveTab('board')}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Tablero
            </button>
            <button
              className={`${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              onClick={() => setActiveTab('details')}
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Equipo
            </button>
            <button
              className={`${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              onClick={() => setActiveTab('files')}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Archivos
            </button>
            <button
              className={`${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              onClick={() => setActiveTab('comments')}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              Comentarios
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div className="px-4 py-5 sm:p-6">
          {activeTab === 'board' && (
            <>
              {Object.keys(tasks).length > 0 ? (
                <KanbanBoard
                  board={board}
                  tasks={tasks}
                  onBoardChange={handleBoardChange}
                  onTaskClick={handleTaskClick}
                />
              ) : (
                <div className="text-center py-10">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <DocumentTextIcon className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {user?.role === 'admin' ? 'Comienza creando una nueva tarea para este proyecto.' : 'No hay tareas disponibles en este proyecto.'}
                  </p>
                  {user?.role?.toLowerCase() === 'admin' && (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setShowTaskForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        Nueva tarea
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'details' && (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-gray-900">Información del equipo</h3>
              <p className="mt-1 text-sm text-gray-500">
                Esta sección está en desarrollo.
              </p>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-gray-900">Archivos del proyecto</h3>
              <p className="mt-1 text-sm text-gray-500">
                Esta sección está en desarrollo.
              </p>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-gray-900">Comentarios</h3>
              <p className="mt-1 text-sm text-gray-500">
                Esta sección está en desarrollo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para formulario de tarea */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <TaskForm
              projectId={id || ''}
              task={selectedTask || undefined}
              onSubmit={handleSaveTask}
              onCancel={() => {
                setShowTaskForm(false);
                setSelectedTask(null);
                setIsEditingTask(false);
              }}
              assignableUsers={assignableUsers}
              readOnly={user?.role !== 'admin'}
            />
          </div>
        </div>
      )}

      {/* Modal para detalle de tarea */}
      {selectedTask && !isEditingTask && !showTaskForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <TaskDetail
              task={selectedTask}
              onClose={handleCloseTaskDetail}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              assignedUserName={getAssignedUserName(selectedTask.assignee)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailKanban;
