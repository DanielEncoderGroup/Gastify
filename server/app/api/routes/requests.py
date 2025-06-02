# server/app/api/routes/requests.py

from typing import Any, List, Optional, Dict, Set
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query, Path
from bson import ObjectId

from app.models.user import UserPublic, UserRole
from app.models.request import (
    RequestCreate,
    RequestUpdate,
    StatusChange,
    RequestStatus,
    CreateRequestResponse,
    PaginatedRequestsResponse,
    RequestSummary,
    RequestDetail,
    RequestResponse,
    UpdateRequestResponse,
    DeleteRequestResponse,
    AddCommentResponse,
    CommentResponse,
    FileResponse,
    StatusHistoryEntry,
    RequestComment,
    RequestFile
)
from app.core.database import get_database
from app.api.deps import get_admin_user, get_client_user, get_any_user

router = APIRouter(tags=["Requests"])


# ────────────────────────────────────────────────────────────────────────────────
#  POST /api/requests/  → Crear nueva solicitud
# ────────────────────────────────────────────────────────────────────────────────
@router.post(
    "/",
    response_model=CreateRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva solicitud",
    description=(
        "Permite a un cliente autenticado (rol=client) crear una nueva solicitud de proyecto.\n\n"
        "Body (JSON):\n"
        "  - title (str, obligatoria)\n"
        "  - description (str, obligatoria)\n"
        "  - projectType (str, obligatoria)\n"
        "  - priority (str, opcional)\n"
        "  - budget (float, opcional)\n"
        "  - timeframe (str, opcional)\n"
        "  - businessGoals (str, opcional)\n"
        "  - targetAudience (str, opcional)\n"
        "  - additionalInfo (str, opcional)\n\n"
        "Al crearse, la solicitud se guarda con estado `draft` y se registra el primer cambio "
        "en el historial de estados."
    )
)
async def create_request(
    request_in: RequestCreate = Body(
        ...,
        description="Datos completos de la nueva solicitud de proyecto"
    ),
    current_user: UserPublic = Depends(get_client_user),
) -> Any:
    db = get_database()

    # 1) Volcar el body a un diccionario
    payload: Dict[str, Any] = request_in.model_dump()

    # 2) Insertar todos los metadatos que faltan
    payload.update({
        "clientId": ObjectId(current_user.id),
        "status": RequestStatus.DRAFT,
        "assignedTo": None,
        "comments": [],
        "files": [],
        "statusHistory": [
            {
                "fromStatus": None,
                "toStatus": RequestStatus.DRAFT,
                "changedBy": ObjectId(current_user.id),
                "changedAt": datetime.utcnow(),
                "reason": "Creación de la solicitud"
            }
        ],
        "createdAt": datetime.utcnow(),
        "updatedAt": None
    })

    # 3) Insertar en Mongo
    result = await db.requests.insert_one(payload)
    created = await db.requests.find_one({"_id": result.inserted_id})
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la solicitud"
        )

    return CreateRequestResponse(
        success=True,
        message="Solicitud creada correctamente",
        requestId=str(created["_id"])
    )


# ────────────────────────────────────────────────────────────────────────────────
#  GET /api/requests/  → Listar solicitudes con paginación y filtros
# ────────────────────────────────────────────────────────────────────────────────
@router.get(
    "/",
    response_model=PaginatedRequestsResponse,
    summary="Listar solicitudes",
    description=(
        "Obtiene un listado de solicitudes con paginación y filtros:\n"
        "- **status**: filtrar por estado.\n"
        "- **search**: buscar por término en título o descripción.\n"
        "- **skip**: offset.\n"
        "- **limit**: número máximo de resultados.\n\n"
        "Si el usuario es cliente, sólo retorna sus propias solicitudes. "
        "Si es admin, puede filtrar opcionalmente por **client_id**."
    )
)
async def get_requests(
    status: Optional[str] = Query(
        None,
        description="Filtrar por estado. Valores válidos: " + ", ".join(RequestStatus.all_statuses())
    ),
    client_id: Optional[str] = Query(
        None,
        description="(Solo admin) Filtrar por ID de cliente"
    ),
    search: Optional[str] = Query(
        None,
        description="Texto libre a buscar en título o descripción"
    ),
    skip: int = Query(
        0,
        ge=0,
        description="Número de elementos a omitir"
    ),
    limit: int = Query(
        10,
        ge=1,
        le=100,
        description="Número máximo de elementos a devolver"
    ),
    current_user: UserPublic = Depends(get_any_user),
) -> Any:
    db = get_database()
    query: Dict[str, Any] = {}

    # 1) Filtrar por estado
    if status and status in RequestStatus.all_statuses():
        query["status"] = status

    # 2) Filtrar por cliente según rol
    if current_user.role == UserRole.CLIENT:
        query["clientId"] = ObjectId(current_user.id)
    elif current_user.role == UserRole.ADMIN and client_id:
        query["clientId"] = ObjectId(client_id)

    # 3) Búsqueda en título/descripcion
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]

    # 4) Contar total y paginar
    total = await db.requests.count_documents(query)
    cursor = db.requests.find(query).sort("createdAt", -1).skip(skip).limit(limit)

    # 5) Reunir todos los IDs de usuarios en un solo batch
    user_ids: Set[ObjectId] = set()
    docs_raw: List[Dict[str, Any]] = []
    async for doc in cursor:
        docs_raw.append(doc)
        user_ids.add(doc["clientId"])
        if doc.get("assignedTo"):
            user_ids.add(doc["assignedTo"])
        # NOTA: no contamos comentarios aquí, sólo necesitamos length de arrays
        # porque RequestSummary incluye commentsCount y filesCount

    # 6) Buscar usuarios por lotes
    users_map: Dict[str, Dict[str, Any]] = {}
    if user_ids:
        users_list = await db.users.find({"_id": {"$in": list(user_ids)}}).to_list(length=None)
        users_map = {str(u["_id"]): u for u in users_list}

    # 7) Construir la lista de RequestSummary
    requests_list: List[RequestSummary] = []
    for doc in docs_raw:
        # Cliente
        client_doc = users_map.get(str(doc["clientId"]))
        client_data = None
        if client_doc:
            client_data = UserPublic(
                id=str(client_doc["_id"]),
                firstName=client_doc["firstName"],
                lastName=client_doc["lastName"],
                email=client_doc["email"],
                role=client_doc.get("role", UserRole.CLIENT),
                createdAt=client_doc["createdAt"]
            )

        # Admin asignado (opcional)
        admin_data = None
        if doc.get("assignedTo"):
            adm_doc = users_map.get(str(doc["assignedTo"]))
            if adm_doc:
                admin_data = UserPublic(
                    id=str(adm_doc["_id"]),
                    firstName=adm_doc["firstName"],
                    lastName=adm_doc["lastName"],
                    email=adm_doc["email"],
                    role=adm_doc.get("role", UserRole.ADMIN),
                    createdAt=adm_doc["createdAt"]
                )

        summary = RequestSummary(
            id=str(doc["_id"]),
            title=doc["title"],
            description=doc["description"],
            status=doc["status"],
            statusLabel=RequestStatus.status_labels().get(doc["status"], doc["status"]),
            projectType=doc.get("projectType"),
            projectTypeLabel=None,  # El frontend utilizará ProjectTypeLabels[projectType]
            priority=doc.get("priority"),
            priorityLabel=None,     # El frontend utilizará PriorityLabels[priority]
            clientId=str(doc["clientId"]),
            client=client_data,
            assignedTo=str(doc["assignedTo"]) if doc.get("assignedTo") else None,
            assignedAdmin=admin_data,
            budget=doc.get("budget"),
            timeframe=doc.get("timeframe"),
            businessGoals=doc.get("businessGoals"),
            targetAudience=doc.get("targetAudience"),
            additionalInfo=doc.get("additionalInfo"),
            commentsCount=len(doc.get("comments", [])),
            filesCount=len(doc.get("files", [])),
            createdAt=doc["createdAt"],
            updatedAt=doc.get("updatedAt"),
            progress=doc.get("progress", 0)
        )
        requests_list.append(summary)

    return {
        "success": True,
        "total": total,
        "skip": skip,
        "limit": limit,
        "requests": requests_list
    }


# ────────────────────────────────────────────────────────────────────────────────
#  GET /api/requests/{request_id}  → Obtener detalle de una solicitud
# ────────────────────────────────────────────────────────────────────────────────
@router.get(
    "/{request_id}",
    response_model=RequestResponse,
    summary="Obtener detalle de una solicitud",
    description=(
        "Devuelve toda la información (RequestDetail) de la solicitud con ID válido.\n"
        "- Solo el cliente dueño o un admin pueden verla.\n"
        "- Incluye comentarios, archivos e historial de estado."
    )
)
async def get_request(
    request_id: str = Path(..., description="ID de la solicitud"),
    current_user: UserPublic = Depends(get_any_user),
) -> Any:
    db = get_database()

    try:
        doc = await db.requests.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de solicitud inválido"
        )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitud no encontrada"
        )

    # Verificar permisos
    if current_user.role == UserRole.CLIENT and str(doc["clientId"]) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver esta solicitud"
        )

    # 1) Reunir todos los IDs de usuarios involucrados
    user_ids: Set[ObjectId] = {doc["clientId"]}
    if doc.get("assignedTo"):
        user_ids.add(doc["assignedTo"])
    for c in doc.get("comments", []):
        user_ids.add(c["userId"])
    for h in doc.get("statusHistory", []):
        user_ids.add(h["changedBy"])
    for f in doc.get("files", []):
        user_ids.add(f["userId"])

    users_map: Dict[str, Dict[str, Any]] = {}
    if user_ids:
        users_list = await db.users.find({"_id": {"$in": list(user_ids)}}).to_list(length=None)
        users_map = {str(u["_id"]): u for u in users_list}

    # 2) Cliente
    client_doc = users_map.get(str(doc["clientId"]))
    client_data = None
    if client_doc:
        client_data = UserPublic(
            id=str(client_doc["_id"]),
            firstName=client_doc["firstName"],
            lastName=client_doc["lastName"],
            email=client_doc["email"],
            role=client_doc.get("role", UserRole.CLIENT),
            createdAt=client_doc["createdAt"]
        )

    # 3) Admin asignado
    assigned_admin_data = None
    if doc.get("assignedTo"):
        adm_doc = users_map.get(str(doc["assignedTo"]))
        if adm_doc:
            assigned_admin_data = UserPublic(
                id=str(adm_doc["_id"]),
                firstName=adm_doc["firstName"],
                lastName=adm_doc["lastName"],
                email=adm_doc["email"],
                role=adm_doc.get("role", UserRole.ADMIN),
                createdAt=adm_doc["createdAt"]
            )

    # 4) Comentarios
    comments_resp: List[CommentResponse] = []
    for c in doc.get("comments", []):
        u_doc = users_map.get(str(c["userId"]))
        user_info = None
        if u_doc:
            user_info = UserPublic(
                id=str(u_doc["_id"]),
                firstName=u_doc["firstName"],
                lastName=u_doc["lastName"],
                email=u_doc["email"],
                role=u_doc.get("role", UserRole.CLIENT),
                createdAt=u_doc["createdAt"]
            )
        comments_resp.append(
            CommentResponse(
                id=str(c.get("_id", "")),
                content=c["content"],
                createdAt=c["createdAt"],
                user=user_info
            )
        )

    # 5) Historial de estados
    history_resp: List[StatusHistoryEntry] = []
    for h in doc.get("statusHistory", []):
        u_doc = users_map.get(str(h["changedBy"]))
        user_info = None
        if u_doc:
            user_info = UserPublic(
                id=str(u_doc["_id"]),
                firstName=u_doc["firstName"],
                lastName=u_doc["lastName"],
                email=u_doc["email"],
                role=u_doc.get("role", UserRole.CLIENT),
                createdAt=u_doc["createdAt"]
            )
        history_resp.append(
            StatusHistoryEntry(
                fromStatus=h.get("fromStatus"),
                fromStatusLabel=(
                    RequestStatus.status_labels().get(h["fromStatus"])
                    if h.get("fromStatus") else None
                ),
                toStatus=h["toStatus"],
                toStatusLabel=RequestStatus.status_labels().get(h["toStatus"], h["toStatus"]),
                changedAt=h["changedAt"],
                reason=h.get("reason"),
                changedBy=user_info
            )
        )

    # 6) Archivos adjuntos
    files_resp: List[FileResponse] = []
    for f in doc.get("files", []):
        u_doc = users_map.get(str(f["userId"]))
        user_info = None
        if u_doc:
            user_info = UserPublic(
                id=str(u_doc["_id"]),
                firstName=u_doc["firstName"],
                lastName=u_doc["lastName"],
                email=u_doc["email"],
                role=u_doc.get("role", UserRole.CLIENT),
                createdAt=u_doc["createdAt"]
            )
        files_resp.append(
            FileResponse(
                id=str(f.get("_id", "")),
                filename=f["filename"],
                fileSize=f["fileSize"],
                fileType=f["fileType"],
                uploadedAt=f["uploadedAt"],
                user=user_info
            )
        )

    # 7) Construir RequestDetail
    detail = RequestDetail(
        id=str(doc["_id"]),
        title=doc["title"],
        description=doc["description"],
        status=doc["status"],
        statusLabel=RequestStatus.status_labels().get(doc["status"], doc["status"]),
        projectType=doc.get("projectType"),
        projectTypeLabel=None,      # El frontend lo completa con ProjectTypeLabels
        priority=doc.get("priority"),
        priorityLabel=None,         # El frontend lo completa con PriorityLabels
        clientId=str(doc["clientId"]),
        client=client_data,
        assignedTo=str(doc["assignedTo"]) if doc.get("assignedTo") else None,
        assignedAdmin=assigned_admin_data,
        budget=doc.get("budget"),
        timeframe=doc.get("timeframe"),
        businessGoals=doc.get("businessGoals"),
        targetAudience=doc.get("targetAudience"),
        additionalInfo=doc.get("additionalInfo"),
        commentsCount=len(doc.get("comments", [])),
        filesCount=len(doc.get("files", [])),
        createdAt=doc["createdAt"],
        updatedAt=doc.get("updatedAt"),
        progress=doc.get("progress", 0),
        comments=comments_resp,
        files=files_resp,
        statusHistory=history_resp
    )

    return RequestResponse(success=True, request=detail)


# ────────────────────────────────────────────────────────────────────────────────
#  PUT /api/requests/{request_id}  → Actualizar una solicitud existente
# ────────────────────────────────────────────────────────────────────────────────
@router.put(
    "/{request_id}",
    response_model=UpdateRequestResponse,
    summary="Actualizar una solicitud existente",
    description=(
        "Permite actualizar cualquier campo (para admin) o solo ciertos campos "
        "(para cliente si está en estado `draft`).\n"
        "El body es de tipo RequestUpdate y puede incluir cualquiera de las propiedades definidas en el modelo.\n"
        "Ejemplo de JSON (RequestUpdate):\n"
        "{\n"
        "  \"title\": \"Portal Web v2\",\n"
        "  \"priority\": \"high\",\n"
        "  \"budget\": 300000.0,\n"
        "  \"businessGoals\": \"Agregar módulo de e-commerce\"\n"
        "}\n"
    )
)
async def update_request(
    request_id: str = Path(..., description="ID de la solicitud a actualizar"),
    request_update: RequestUpdate = Body(...),
    current_user: UserPublic = Depends(get_any_user),
) -> Any:
    db = get_database()

    try:
        doc = await db.requests.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de solicitud inválido"
        )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitud no encontrada"
        )

    # 1) Permisos para cliente
    if current_user.role == UserRole.CLIENT:
        if str(doc["clientId"]) != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para modificar esta solicitud"
            )
        if doc["status"] != RequestStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes modificar solicitudes en estado Borrador"
            )
        if request_update.status or request_update.assignedTo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes cambiar el estado ni asignar admin"
            )

    # 2) Construir objeto de UPDATE
    update_data: Dict[str, Any] = {}
    fields = request_update.model_dump(exclude_unset=True)

    for field_name, value in fields.items():
        if value is not None:
            if field_name == "assignedTo" and value:
                try:
                    admin_doc = await db.users.find_one({
                        "_id": ObjectId(value),
                        "role": UserRole.ADMIN
                    })
                    if not admin_doc:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="El usuario asignado debe ser un admin válido"
                        )
                    update_data["assignedTo"] = ObjectId(value)
                except:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="ID de admin inválido"
                    )
            elif field_name == "status":
                if value not in RequestStatus.all_statuses():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Estado no válido"
                    )
                # Insertar en historial
                status_entry = {
                    "fromStatus": doc["status"],
                    "toStatus": value,
                    "changedBy": ObjectId(current_user.id),
                    "changedAt": datetime.utcnow(),
                    "reason": "Cambio de estado vía PUT"
                }
                update_data["status"] = value
                existing_push = update_data.get("$push", {})
                existing_push["statusHistory"] = status_entry
                update_data["$push"] = existing_push
            else:
                update_data[field_name] = value

    update_data["updatedAt"] = datetime.utcnow()

    # 3) Ejecutar el update en Mongo
    if update_data:
        await db.requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update_data}
        )

    return UpdateRequestResponse(
        success=True,
        message="Solicitud actualizada correctamente"
    )


# ────────────────────────────────────────────────────────────────────────────────
#  DELETE /api/requests/{request_id}  → Eliminar una solicitud
# ────────────────────────────────────────────────────────────────────────────────
@router.delete(
    "/{request_id}",
    response_model=DeleteRequestResponse,
    summary="Eliminar una solicitud",
    description=(
        "Permite eliminar una solicitud existente.\n"
        "- Si el usuario es CLIENT, solo puede eliminar sus propias solicitudes en estado `draft`.\n"
        "- Si el usuario es ADMIN, puede eliminarla en cualquier estado."
    )
)
async def delete_request(
    request_id: str = Path(..., description="ID de la solicitud a eliminar"),
    current_user: UserPublic = Depends(get_any_user),
) -> Any:
    db = get_database()

    try:
        doc = await db.requests.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de solicitud inválido"
        )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitud no encontrada"
        )

    if current_user.role == UserRole.CLIENT:
        if str(doc["clientId"]) != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para eliminar esta solicitud"
            )
        if doc["status"] != RequestStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes eliminar solicitudes en estado Borrador"
            )

    await db.requests.delete_one({"_id": ObjectId(request_id)})

    return DeleteRequestResponse(
        success=True,
        message="Solicitud eliminada correctamente"
    )


# ────────────────────────────────────────────────────────────────────────────────
#  PATCH /api/requests/{request_id}/status  → Cambiar estado
# ────────────────────────────────────────────────────────────────────────────────
@router.patch(
    "/{request_id}/status",
    response_model=UpdateRequestResponse,
    summary="Cambiar estado de una solicitud",
    description=(
        "Solo ADMIN puede cambiar el estado de una solicitud.\n"
        "Body (StatusChange): {\n"
        '   "toStatus": "planning",\n'
        '   "reason": "Revisado y aprobado por director del proyecto"\n'
        "}"
    )
)
async def change_request_status(
    request_id: str = Path(..., description="ID de la solicitud"),
    status_change: StatusChange = Body(...),
    current_user: UserPublic = Depends(get_admin_user),
) -> Any:
    db = get_database()

    try:
        doc = await db.requests.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de solicitud inválido"
        )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitud no encontrada"
        )

    if status_change.toStatus not in RequestStatus.all_statuses():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado no válido"
        )

    if doc["status"] == status_change.toStatus:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La solicitud ya está en estado {status_change.toStatus}"
        )

    history_entry = {
        "fromStatus": doc["status"],
        "toStatus": status_change.toStatus,
        "changedBy": ObjectId(current_user.id),
        "changedAt": datetime.utcnow(),
        "reason": status_change.reason
    }

    await db.requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": status_change.toStatus,
                "updatedAt": datetime.utcnow()
            },
            "$push": {
                "statusHistory": history_entry
            }
        }
    )

    return UpdateRequestResponse(
        success=True,
        message=f"Estado actualizado a {status_change.toStatus}"
    )


# ────────────────────────────────────────────────────────────────────────────────
#  POST /api/requests/{request_id}/comments  → Agregar comentario
# ────────────────────────────────────────────────────────────────────────────────
@router.post(
    "/{request_id}/comments",
    response_model=AddCommentResponse,
    summary="Agregar comentario a una solicitud",
    description=(
        "Tanto CLIENT como ADMIN pueden agregar comentarios a la solicitud.\n"
        "Body: { \"content\": \"Texto del comentario\" }\n"
        "Se devuelve el comentario recién creado con sus datos de usuario."
    )
)
async def add_comment(
    request_id: str = Path(..., description="ID de la solicitud"),
    comment: RequestComment = Body(...),
    current_user: UserPublic = Depends(get_any_user),
) -> Any:
    db = get_database()

    try:
        doc = await db.requests.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de solicitud inválido"
        )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitud no encontrada"
        )

    if current_user.role == UserRole.CLIENT and str(doc["clientId"]) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para comentar esta solicitud"
        )

    new_comment = {
        "_id": ObjectId(),
        "userId": ObjectId(current_user.id),
        "content": comment.content,
        "createdAt": datetime.utcnow()
    }

    await db.requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$push": {"comments": new_comment},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )

    user_data = UserPublic(
        id=current_user.id,
        firstName=current_user.firstName,
        lastName=current_user.lastName,
        email=current_user.email,
        role=current_user.role,
        createdAt=current_user.createdAt
    )

    comment_resp = CommentResponse(
        id=str(new_comment["_id"]),
        content=new_comment["content"],
        createdAt=new_comment["createdAt"],
        user=user_data
    )

    return AddCommentResponse(
        success=True,
        message="Comentario añadido correctamente",
        comment=comment_resp
    )


# ────────────────────────────────────────────────────────────────────────────────
#  POST /api/requests/{request_id}/submit  → Enviar para revisión
# ────────────────────────────────────────────────────────────────────────────────
@router.post(
    "/{request_id}/submit",
    response_model=UpdateRequestResponse,
    summary="Enviar solicitud para revisión",
    description=(
        "Solo CLIENT puede enviar la solicitud. \n"
        "Cambia estado de `draft` a `in_process` y registra en historial."
    )
)
async def submit_request(
    request_id: str = Path(..., description="ID de la solicitud"),
    current_user: UserPublic = Depends(get_client_user),
) -> Any:
    db = get_database()

    try:
        req_doc = await db.requests.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de solicitud inválido"
        )

    if not req_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitud no encontrada"
        )

    if str(req_doc["clientId"]) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para enviar esta solicitud"
        )

    if req_doc["status"] != RequestStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo puedes enviar solicitudes en estado de borrador"
        )

    status_history_entry = {
        "fromStatus": RequestStatus.DRAFT,
        "toStatus": RequestStatus.IN_PROCESS,
        "changedBy": ObjectId(current_user.id),
        "changedAt": datetime.utcnow(),
        "reason": "Solicitud enviada para revisión"
    }

    await db.requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": RequestStatus.IN_PROCESS,
                "updatedAt": datetime.utcnow()
            },
            "$push": {
                "statusHistory": status_history_entry
            }
        }
    )

    return UpdateRequestResponse(
        success=True,
        message="Solicitud enviada correctamente para revisión"
    )
