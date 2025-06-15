# server/app/api/routes/projects.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime
from pymongo import ReturnDocument

from app.api.deps import get_current_user
from app.models.user import UserPublic  # Make sure this is the correct import
from app.models.project import (
    Project, 
    ProjectCreate, 
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    Task,
    TaskCreate,
    TaskUpdate,
    TaskStatus,
    Board,
    BoardUpdate
)
from app.core.database import get_database
from app.core.config import Settings

router = APIRouter(tags=["Projects"])

# Helper function to convert ObjectId to string in response
def convert_object_ids(project: dict) -> dict:
    project["_id"] = str(project["_id"])
    if "requestId" in project:
        project["requestId"] = str(project["requestId"])
    if "clientId" in project:
        project["clientId"] = str(project["clientId"])
    if "assignedTeam" in project and project["assignedTeam"]:
        project["assignedTeam"] = [str(team_id) for team_id in project["assignedTeam"]]
    if "tasks" in project and project["tasks"]:
        for task in project["tasks"]:
            task["_id"] = str(task["_id"])
            if "assignee" in task and task["assignee"]:
                task["assignee"] = str(task["assignee"])
    return project

# Projects CRUD
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    current_user: UserPublic = Depends(get_current_user)  # Changed User to UserPublic
):
    """
    Create a new project
    """
    db = get_database()
    project_data = project.dict()
    project_data["createdAt"] = datetime.utcnow()
    project_data["updatedAt"] = datetime.utcnow()
    project_data["status"] = "active"
    
    # Convert string IDs to ObjectId
    project_data["clientId"] = ObjectId(project_data["clientId"])
    if "assignedTeam" in project_data and project_data["assignedTeam"]:
        project_data["assignedTeam"] = [ObjectId(team_id) for team_id in project_data["assignedTeam"]]
    
    # Insert project
    result = await db.projects.insert_one(project_data)
    created_project = await db.projects.find_one({"_id": result.inserted_id})
    
    return {"success": True, "project": convert_object_ids(created_project)}

@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    status: Optional[str] = Query(None, description="Filter by project status"),
    client_id: Optional[str] = Query(None, description="Filter by client ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: UserPublic = Depends(get_current_user)  # Changed User to UserPublic
):
    """
    List all projects with optional filtering
    """
    db = get_database()
    skip = (page - 1) * limit
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    if client_id:
        query["clientId"] = ObjectId(client_id)
    
    # Filtrado de proyectos basado en rol
    if current_user.role == "admin":
        # Los administradores pueden ver todos los proyectos
        pass
    elif current_user.role == "client":
        # Los clientes solo deben ver sus propios proyectos
        query["clientId"] = ObjectId(current_user.id)
    else:
        # Miembros del equipo solo ven proyectos donde están asignados
        query["$or"] = [
            {"clientId": ObjectId(current_user.id)},
            {"assignedTeam": ObjectId(current_user.id)}
        ]
    
    # Get total count
    total = await db.projects.count_documents(query)
    
    # Get paginated projects
    cursor = db.projects.find(query).skip(skip).limit(limit)
    projects = []
    async for project in cursor:
        projects.append(convert_object_ids(project))
    
    return {
        "success": True,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "projects": projects
    }

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str = Path(..., description="The project ID"),
    current_user: UserPublic = Depends(get_current_user)  # Changed User to UserPublic
):
    """
    Get project by ID
    """
    db = get_database()
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check permissions
    if (current_user.role != "admin" and   # Changed from is_admin to role check
        str(project["clientId"]) != current_user.id and 
        (not project.get("assignedTeam") or 
         ObjectId(current_user.id) not in project["assignedTeam"])):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )
    
    return {"success": True, "project": convert_object_ids(project)}

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: UserPublic = Depends(get_current_user)  # Changed User to UserPublic
):
    """
    Update project
    """
    db = get_database()
    
    # Check if project exists and user has permission
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if current_user.role != "admin" and str(project["clientId"]) != current_user.id:  # Changed from is_admin
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this project"
        )
    
    # Prepare update data
    update_data = project_update.dict(exclude_unset=True)
    update_data["updatedAt"] = datetime.utcnow()
    
    # Convert string IDs to ObjectId
    if "clientId" in update_data:
        update_data["clientId"] = ObjectId(update_data["clientId"])
    if "assignedTeam" in update_data and update_data["assignedTeam"]:
        update_data["assignedTeam"] = [ObjectId(team_id) for team_id in update_data["assignedTeam"]]
    
    # Update project
    updated_project = await db.projects.find_one_and_update(
        {"_id": ObjectId(project_id)},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    
    return {"success": True, "project": convert_object_ids(updated_project)}

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: UserPublic = Depends(get_current_user)  # Changed User to UserPublic
):
    """
    Delete project
    """
    if current_user.role != "admin":  # Changed from is_admin
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete projects"
        )
    
    db = get_database()
    result = await db.projects.delete_one({"_id": ObjectId(project_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return None

# Tasks endpoints
@router.post("/{project_id}/tasks", response_model=dict)
async def create_task(
    project_id: str,
    task: TaskCreate,
    current_user: UserPublic = Depends(get_current_user)  # Changed User to UserPublic
):
    """
    Create a new task in a project
    """
    db = get_database()
    
    # Check if project exists and user has permission
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Solo administradores pueden crear tareas
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden crear tareas en los proyectos"
        )
    
    # Create task
    task_data = task.dict()
    task_data["_id"] = ObjectId()
    task_data["createdAt"] = datetime.utcnow()
    task_data["updatedAt"] = datetime.utcnow()
    task_data["status"] = TaskStatus.TODO
    
    # Convert assignee to ObjectId if provided
    if "assignee" in task_data and task_data["assignee"]:
        task_data["assignee"] = ObjectId(task_data["assignee"])
    
    # Add task to project
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$push": {"tasks": task_data}}
    )
    
    task_data["_id"] = str(task_data["_id"])
    if "assignee" in task_data and task_data["assignee"]:
        task_data["assignee"] = str(task_data["assignee"])
    
    return {"success": True, "task": task_data}

@router.put("/{project_id}/tasks/{task_id}", response_model=dict)
async def update_task(
    project_id: str,
    task_id: str,
    task_update: TaskUpdate,
    current_user: UserPublic = Depends(get_current_user)  # Changed User to UserPublic
):
    """
    Update a task in a project
    """
    db = get_database()
    
    # Prepare update data
    update_data = task_update.dict(exclude_unset=True)
    update_data["updatedAt"] = datetime.utcnow()
    
    # Convert assignee to ObjectId if provided
    if "assignee" in update_data and update_data["assignee"]:
        update_data["assignee"] = ObjectId(update_data["assignee"])
    
    # Build update query
    update_query = {}
    for key, value in update_data.items():
        update_query[f"tasks.$.{key}"] = value
    
    # Update task
    result = await db.projects.update_one(
        {
            "_id": ObjectId(project_id),
            "tasks._id": ObjectId(task_id)
        },
        {"$set": update_query}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or you don't have permission"
        )
    
    # Get updated task
    project = await db.projects.find_one(
        {"_id": ObjectId(project_id)},
        {"tasks": {"$elemMatch": {"_id": ObjectId(task_id)}}}
    )
    
    if not project or "tasks" not in project or not project["tasks"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    task = project["tasks"][0]
    task["_id"] = str(task["_id"])
    if "assignee" in task and task["assignee"]:
        task["assignee"] = str(task["assignee"])
    
    return {"success": True, "task": task}

@router.delete("/{project_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    project_id: str,
    task_id: str,
    current_user: UserPublic = Depends(get_current_user)  # Changed User to UserPublic
):
    """
    Delete a task from a project
    """
    db = get_database()
    
    # Check if project exists and user has permission
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if current_user.role != "admin" and str(project["clientId"]) != current_user.id:  # Changed from is_admin
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete tasks from this project"
        )
    
    # Remove task
    result = await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$pull": {"tasks": {"_id": ObjectId(task_id)}}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return None

# Board endpoints
@router.get("/{project_id}/board", response_model=dict)
async def get_project_board(
    project_id: str,
    current_user: UserPublic = Depends(get_current_user)  # Changed User to UserPublic
):
    """
    Get project board with tasks organized by status
    """
    db = get_database()
    
    # Get project with tasks
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check permissions
    if (current_user.role != "admin" and   # Changed from is_admin
        str(project["clientId"]) != current_user.id and 
        (not project.get("assignedTeam") or 
         ObjectId(current_user.id) not in project["assignedTeam"])):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this project board"
        )
    
    # Initialize board if not exists
    if "board" not in project:
        board = {
            "columns": {
                "todo": {"id": "todo", "title": "Por Hacer", "taskIds": []},
                "in_progress": {"id": "in_progress", "title": "En Progreso", "taskIds": []},
                "in_review": {"id": "in_review", "title": "En Revisión", "taskIds": []},
                "done": {"id": "done", "title": "Terminado", "taskIds": []}
            },
            "columnOrder": ["todo", "in_progress", "in_review", "done"]
        }
        
        # Update project with default board
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"board": board}}
        )
    else:
        board = project["board"]
    
    # Get all tasks for the project
    tasks = project.get("tasks", [])
    
    # Convert ObjectId to string for JSON serialization
    for task in tasks:
        task["_id"] = str(task["_id"])
        if "assignee" in task and task["assignee"]:
            task["assignee"] = str(task["assignee"])
    
    # Organize tasks by status
    tasks_by_status = {status: [] for status in TaskStatus.all_statuses()}
    for task in tasks:
        tasks_by_status[task["status"]].append(task)
    
    # Update column taskIds
    for column_id in board["columnOrder"]:
        if column_id in board["columns"]:
            board["columns"][column_id]["taskIds"] = [str(task["_id"]) for task in tasks 
                                                     if task["status"] == column_id]
    
    return {
        "success": True,
        "board": board,
        "tasks": {str(task["_id"]): task for task in tasks}
    }

@router.put("/{project_id}/board", response_model=dict)
async def update_project_board(
    project_id: str,
    board_update: BoardUpdate,
    current_user: UserPublic = Depends(get_current_user)  # Changed User to UserPublic
):
    """
    Update project board (for drag and drop)
    """
    db = get_database()
    
    # Check if project exists and user has permission
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if (current_user.role != "admin" and   # Changed from is_admin
        str(project["clientId"]) != current_user.id and 
        (not project.get("assignedTeam") or 
         ObjectId(current_user.id) not in project["assignedTeam"])):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this project board"
        )
    
    # Update board
    result = await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {"board": board_update.dict()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update task statuses based on board columns
    board = board_update.dict()
    for column_id, column in board["columns"].items():
        if column["taskIds"]:
            task_ids = [ObjectId(task_id) for task_id in column["taskIds"]]
            await db.projects.update_many(
                {
                    "_id": ObjectId(project_id),
                    "tasks._id": {"$in": task_ids}
                },
                {"$set": {"tasks.$.status": column_id, "tasks.$.updatedAt": datetime.utcnow()}}
            )
    
    return {"success": True}