// Tipos para el sistema de proyectos y tareas

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  IN_REVIEW = "in_review",
  DONE = "done"
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  labels?: string[];
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Board {
  columns: {
    [key: string]: Column;
    todo: { id: string; title: string; taskIds: string[] };
    in_progress: { id: string; title: string; taskIds: string[] };
    in_review: { id: string; title: string; taskIds: string[] };
    done: { id: string; title: string; taskIds: string[] };
  };
  columnOrder?: string[];
}

export interface Project {
  _id: string;
  requestId: string;
  title: string;
  description: string;
  clientId: string;
  assignedTeam: string[];
  startDate: string;
  deadline?: string;
  status: string;
  board?: Board;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  success: boolean;
  project: Project;
}

export interface ProjectListResponse {
  success: boolean;
  projects: Project[];
  total: number;
  page: number;
  pages: number;
}

export interface BoardResponse {
  success: boolean;
  board: Board;
  tasks: {
    [key: string]: Task;
  };
}

export interface ProjectFormData {
  title: string;
  description: string;
  clientId: string;
  assignedTeam: string[];
  deadline?: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  assignee?: string;
  dueDate?: string;
}
