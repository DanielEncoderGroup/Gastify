import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  PencilIcon,
  PlusIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

// Importar componentes específicos del Kanban
import KanbanBoard from '../../components/projects/KanbanBoard';
import TaskForm from '../../components/projects/TaskForm';
import TaskDetail from '../../components/projects/TaskDetail';

// Importar tipos
import { Project, Task, Board, TaskFormData, TaskStatus } from '../../types/project';
import projectService from '../../services/projectService';

// Tipos locales
type TabType = 'tasks' | 'meetings' | 'requests' | 'documents';
type TaskViewType = 'list' | 'kanban';

interface ProjectData {
  project: Project | null;
  board: Board | null;
  tasks: { [key: string]: Task };
  assignableUsers: { id: string; name: string }[];
}

const ProjectDetail: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  
  // Registrar información del usuario para depuración
  useEffect(() => {
    console.log('ProjectDetail - Usuario actual:', user);
    console.log('ProjectDetail - Rol del usuario:', user?.role);
    console.log('ProjectDetail - ¿Es admin?', user?.role?.toLowerCase() === 'admin');
  }, [user]);

  // Estados principales
  const [projectData, setProjectData] = useState<ProjectData>({
    project: null,
    board: null,
    tasks: {},
    assignableUsers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de UI
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [taskView, setTaskView] = useState<TaskViewType>(() => {
    // Recuperar preferencia de vista desde localStorage
    const savedView = localStorage.getItem(`project-${id}-task-view`);
    return (savedView as TaskViewType) || 'list';
  });

  // Estados de modales y formularios
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);

  // Persistir preferencia de vista en localStorage
  useEffect(() => {
    if (id) {
      localStorage.setItem(`project-${id}-task-view`, taskView);
    }
  }, [taskView, id]);

  // Cargar datos del proyecto
  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Obtener detalles del proyecto
      const projectResponse = await projectService.getById(id);
      if (!projectResponse.success || !projectResponse.project) {
        throw new Error('No se pudo obtener la información del proyecto');
      }

      // Preparar datos iniciales
      let boardData: Board | null = null;
      let tasksData: { [key: string]: Task } = {};
      
      // Solo cargar datos del tablero si la vista Kanban está seleccionada (optimización)
      if (taskView === 'kanban' || activeTab === 'tasks') {
        try {
          const boardResponse = await projectService.getBoard(id);
          if (boardResponse.success) {
            boardData = boardResponse.board;
            tasksData = boardResponse.tasks || {};
          }
        } catch (boardError) {
          console.warn('Error al cargar el tablero Kanban:', boardError);
          // Si no hay tablero, crear estructura básica
          boardData = {
            columns: {
              todo: { id: 'todo', title: 'Por hacer', taskIds: [] },
              in_progress: { id: 'in_progress', title: 'En progreso', taskIds: [] },
              in_review: { id: 'in_review', title: 'En revisión', taskIds: [] },
              done: { id: 'done', title: 'Completado', taskIds: [] }
            },
            columnOrder: ['todo', 'in_progress', 'in_review', 'done']
          };
        }
      }

      // Obtener usuarios asignables (simulado por ahora)
      // TODO: Implementar llamada real al API para obtener equipo del proyecto
      const assignableUsers = [
        { id: '1', name: 'Ana Gómez' },
        { id: '2', name: 'Miguel Sánchez' },
        { id: '3', name: 'Laura Torres' },
        { id: '4', name: 'Roberto Díaz' }
      ];

      setProjectData({
        project: projectResponse.project,
        board: boardData,
        tasks: tasksData,
        assignableUsers
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error al cargar los datos del proyecto:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setIsLoading(false);
    }
  }, [id, taskView, activeTab]);

  // Efecto para cargar datos
  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Cargar datos del tablero cuando se cambie a vista Kanban
  const loadKanbanData = useCallback(async () => {
    if (!id || taskView !== 'kanban' || projectData.board) return;
    
    try {
      const boardResponse = await projectService.getBoard(id);
      if (boardResponse.success) {
        setProjectData(prev => ({
          ...prev,
          board: boardResponse.board,
          tasks: boardResponse.tasks || {}
        }));
      }
    } catch (error) {
      console.error('Error al cargar datos del tablero:', error);
      toast.error('Error al cargar el tablero Kanban');
    }
  }, [id, taskView, projectData.board]);

  useEffect(() => {
    loadKanbanData();
  }, [loadKanbanData]);

  // Manejar cambios en el tablero (drag & drop)
  const handleBoardChange = useCallback(async (newBoard: Board) => {
    if (!id) return;
    
    try {
      // Actualizar estado local inmediatamente para mejor UX
      setProjectData(prev => ({ ...prev, board: newBoard }));
      
      // Actualizar en el backend
      await projectService.updateBoard(id, newBoard);
      toast.success('Tablero actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el tablero:', error);
      toast.error('Error al actualizar el tablero');
      // Revertir cambios en caso de error
      fetchProjectData();
    }
  }, [id, fetchProjectData]);

  // Manejar clic en una tarea
  const handleTaskClick = useCallback((taskId: string) => {
    const task = projectData.tasks[taskId];
    if (task) {
      setSelectedTask(task);
      setIsEditingTask(false);
    }
  }, [projectData.tasks]);

  // Cerrar detalle de tarea
  const handleCloseTaskDetail = useCallback(() => {
    setSelectedTask(null);
    setIsEditingTask(false);
  }, []);

  // Abrir formulario para editar tarea
  const handleEditTask = useCallback(() => {
    setIsEditingTask(true);
  }, []);

  // Eliminar tarea
  const handleDeleteTask = useCallback(async () => {
    if (!id || !selectedTask) return;
    
    try {
      await projectService.deleteTask(id, selectedTask._id);
      
      // Actualizar estado local
      const taskId = selectedTask._id;
      setProjectData(prev => {
        const newTasks = { ...prev.tasks };
        delete newTasks[taskId];
        
        // Crear una copia del board solo si existe
        const newBoard = prev.board ? {
          ...prev.board,
          columns: { ...prev.board.columns }
        } : null;
        
        // Actualizar las columnas para eliminar la tarea solo si el board existe
        if (newBoard) {
          // TypeScript ahora sabe con certeza que newBoard no es null dentro de este bloque
          for (const columnId of Object.keys(newBoard.columns)) {
            const column = newBoard.columns[columnId];
            newBoard.columns[columnId] = {
              ...column,
              taskIds: column.taskIds.filter(id => id !== taskId)
            };
          }
        }
        
        return {
          ...prev,
          tasks: newTasks,
          board: newBoard
        };
      });
      
      setSelectedTask(null);
      toast.success('Tarea eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar la tarea:', error);
      toast.error('Error al eliminar la tarea');
    }
  }, [id, selectedTask]);

  // Guardar tarea (crear o actualizar)
  const handleSaveTask = useCallback(async (taskData: TaskFormData) => {
    if (!id || !projectData.project) return;
    
    try {
      
      if (isEditingTask && selectedTask) {
        // Actualizar tarea existente
        const response = await projectService.updateTask(id, selectedTask._id, taskData);
        if (response.success && response.task) {
          setProjectData(prev => ({
            ...prev,
            tasks: {
              ...prev.tasks,
              [selectedTask._id]: response.task
            }
          }));
          toast.success('Tarea actualizada correctamente');
        }
      } else {
        // Crear nueva tarea
        const response = await projectService.createTask(id, taskData);
        if (response.success && response.task) {
          setProjectData(prev => {
            const newTasks = {
              ...prev.tasks,
              [response.task._id]: response.task
            };
            
            // Añadir a la columna "Por hacer" en el tablero
            let newBoard = prev.board;
            if (newBoard) {
              newBoard = { ...newBoard };
              newBoard.columns.todo = {
                ...newBoard.columns.todo,
                taskIds: [...newBoard.columns.todo.taskIds, response.task._id]
              };
            }
            
            return {
              ...prev,
              tasks: newTasks,
              board: newBoard
            };
          });
          
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
  }, [id, projectData.project, isEditingTask, selectedTask]);

  // Obtener nombre de usuario asignado
  const getAssignedUserName = useCallback((userId?: string) => {
    if (!userId) return undefined;
    const user = projectData.assignableUsers.find(u => u.id === userId);
    return user?.name;
  }, [projectData.assignableUsers]);

  // Memoizar lista de tareas para renderizado de lista
  const taskList = useMemo(() => {
    return Object.values(projectData.tasks).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [projectData.tasks]);

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !projectData.project) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {error || 'Proyecto no encontrado'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {error || 'El proyecto que buscas no existe o ha sido eliminado.'}
          </p>
          <div className="mt-6">
            <Link
              to="/app/projects"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver a la lista de proyectos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { project } = projectData;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Header con acciones */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Detalles del proyecto y actividades relacionadas.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/app/projects"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver
          </Link>
          {user?.role?.toLowerCase() === 'admin' && (
            <>
              <Link
                to={`/app/projects/${id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowTaskForm(true);
                  setSelectedTask(null);
                  setIsEditingTask(false);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Agregar tarea
              </button>
            </>
          )}
        </div>
      </div>

      {/* Información del proyecto */}
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
             project.status === 'pending' ? 'Pendiente' : 'Completado'}
          </span>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Descripción
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {project.description}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
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

      {/* Pestañas para secciones */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              className={`${
                activeTab === 'tasks'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              onClick={() => setActiveTab('tasks')}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Tareas
            </button>
            <button
              className={`${
                activeTab === 'meetings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              onClick={() => setActiveTab('meetings')}
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Reuniones
            </button>
            <button
              className={`${
                activeTab === 'requests'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              onClick={() => setActiveTab('requests')}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              Solicitudes
            </button>
            <button
              className={`${
                activeTab === 'documents'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              onClick={() => setActiveTab('documents')}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Documentos
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div className="px-4 py-5 sm:px-6">
          {activeTab === 'tasks' && (
            <>
              {/* Selector de vista para tareas */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Gestión de tareas</h3>
                <div className="flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setTaskView('list')}
                    className={`relative inline-flex items-center px-3 py-2 rounded-l-md border text-sm font-medium transition-colors ${
                      taskView === 'list'
                        ? 'z-10 border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ListBulletIcon className="h-4 w-4 mr-2" />
                    Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskView('kanban')}
                    className={`relative inline-flex items-center px-3 py-2 rounded-r-md border text-sm font-medium transition-colors ${
                      taskView === 'kanban'
                        ? 'z-10 border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Squares2X2Icon className="h-4 w-4 mr-2" />
                    Tablero
                  </button>
                </div>
              </div>

              {/* Contenido de tareas según la vista seleccionada */}
              {taskView === 'kanban' ? (
                <>
                  {projectData.board && Object.keys(projectData.tasks).length > 0 ? (
                    <KanbanBoard
                      board={projectData.board}
                      tasks={projectData.tasks}
                      onBoardChange={handleBoardChange}
                      onTaskClick={handleTaskClick}
                    />
                  ) : (
                    <div className="text-center py-10">
                      <div className="mx-auto h-12 w-12 text-gray-400">
                        <Squares2X2Icon className="h-12 w-12" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {user?.role?.toLowerCase() === 'admin' 
                          ? 'Comienza creando una nueva tarea para este proyecto.'
                          : 'No hay tareas disponibles en este proyecto.'}
                      </p>
                      {user?.role?.toLowerCase() === 'admin' && (
                        <div className="mt-6">
                          <button
                            type="button"
                            onClick={() => setShowTaskForm(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            Nueva tarea
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Vista de lista de tareas */}
                  {taskList.length > 0 ? (
                    <div className="space-y-4">
                      {taskList.map((task) => (
                        <div
                          key={task._id}
                          onClick={() => handleTaskClick(task._id)}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              task.status === TaskStatus.TODO ? 'bg-gray-100 text-gray-800' :
                              task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                              task.status === TaskStatus.IN_REVIEW ? 'bg-amber-100 text-amber-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.status === TaskStatus.TODO ? 'Por hacer' :
                               task.status === TaskStatus.IN_PROGRESS ? 'En progreso' :
                               task.status === TaskStatus.IN_REVIEW ? 'En revisión' :
                               'Completado'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {task.assignee ? getAssignedUserName(task.assignee) : 'No asignado'}
                            </span>
                            {task.dueDate && (
                              <span>Vence: {new Date(task.dueDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="mx-auto h-12 w-12 text-gray-400">
                        <ListBulletIcon className="h-12 w-12" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {user?.role?.toLowerCase() === 'admin' 
                          ? 'Comienza creando una nueva tarea para este proyecto.'
                          : 'No hay tareas disponibles en este proyecto.'}
                      </p>
                      {user?.role?.toLowerCase() === 'admin' && (
                        <div className="mt-6">
                          <button
                            type="button"
                            onClick={() => setShowTaskForm(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
            </>
          )}

          {/* Otras pestañas - Placeholders */}
          {activeTab === 'meetings' && (
            <div className="text-center py-10">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Reuniones</h3>
              <p className="mt-1 text-sm text-gray-500">
                Esta sección está en desarrollo.
              </p>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="text-center py-10">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Solicitudes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Esta sección está en desarrollo.
              </p>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="text-center py-10">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Documentos</h3>
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
              projectId={id!}
              task={isEditingTask ? selectedTask || undefined : undefined}
              onSubmit={handleSaveTask}
              onCancel={() => {
                setShowTaskForm(false);
                if (isEditingTask) {
                  setIsEditingTask(false);
                }
              }}
              assignableUsers={projectData.assignableUsers}
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

      {/* Modal para editar tarea */}
      {isEditingTask && selectedTask && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <TaskForm
              projectId={id!}
              task={selectedTask}
              onSubmit={handleSaveTask}
              onCancel={() => {
                setIsEditingTask(false);
                setSelectedTask(null);
              }}
              assignableUsers={projectData.assignableUsers}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;