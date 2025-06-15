import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Task, Board, TaskStatus } from '../../types/project';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface KanbanBoardProps {
  board: Board;
  tasks: {
    [key: string]: Task;
  };
  onBoardChange: (newBoard: Board) => void;
  onTaskClick: (taskId: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ board, tasks, onBoardChange, onTaskClick }) => {
  const [isDragging, setIsDragging] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case TaskStatus.TODO:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
      case TaskStatus.IN_PROGRESS:
        return <ArrowPathIcon className="w-5 h-5 text-blue-500" />;
      case TaskStatus.IN_REVIEW:
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
      case TaskStatus.DONE:
        return <CheckCircleIcon className="w-5 h-5 text-emerald-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 font-medium">
            Baja
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
            Media
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 font-medium">
            Alta
          </span>
        );
      case 'urgent':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-medium">
            Urgente
          </span>
        );
      default:
        return null;
    }
  };

  const handleDragEnd = (result: any) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;

    // Si no hay destino o el destino es igual al origen, no hacer nada
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Crear copia de las columnas para actualizar
    const newBoard = { ...board };
    
    // Eliminar de la columna origen
    const sourceColumn = newBoard.columns[source.droppableId];
    const sourceTaskIds = [...sourceColumn.taskIds];
    sourceTaskIds.splice(source.index, 1);
    
    // Añadir a la columna destino
    const destinationColumn = newBoard.columns[destination.droppableId];
    const destinationTaskIds = [...destinationColumn.taskIds];
    destinationTaskIds.splice(destination.index, 0, draggableId);
    
    // Actualizar columnas
    newBoard.columns = {
      ...newBoard.columns,
      [source.droppableId]: {
        ...sourceColumn,
        taskIds: sourceTaskIds
      },
      [destination.droppableId]: {
        ...destinationColumn,
        taskIds: destinationTaskIds
      }
    };
    
    // Notificar cambio
    onBoardChange(newBoard);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  return (
    <div className="mt-6">
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(board.columnOrder || ['todo', 'in_progress', 'in_review', 'done']).map((columnId) => {
            const column = board.columns[columnId];
            const columnTasks = column.taskIds.map(taskId => tasks[taskId]);
            
            return (
              <div 
                key={column.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(column.id)}
                    <h3 className="ml-2 font-medium text-gray-800">{column.title}</h3>
                  </div>
                  <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                      style={{ height: 'calc(100% - 57px)' }}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onTaskClick(task._id)}
                              className={`bg-white p-4 mb-3 rounded-lg border shadow-sm cursor-pointer transition-all ${
                                snapshot.isDragging
                                  ? 'border-blue-400 shadow-md shadow-blue-100'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {task.description}
                              </p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {task.labels?.map((label, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800"
                                  >
                                    <TagIcon className="w-3 h-3 mr-1" />
                                    {label}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>{getPriorityBadge(task.priority)}</div>
                                <div className="flex items-center space-x-2">
                                  {task.dueDate && (
                                    <div className="flex items-center text-xs text-gray-500">
                                      <CalendarIcon className="w-3 h-3 mr-1" />
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                  )}
                                  {task.assignee && (
                                    <div className="flex items-center text-xs text-gray-500">
                                      <UserIcon className="w-3 h-3 mr-1" />
                                      Asignado
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {columnTasks.length === 0 && !isDragging && (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
                          <p>No hay tareas</p>
                          <p>Arrastra tareas aquí</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
