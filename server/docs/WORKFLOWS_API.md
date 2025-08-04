# API de Workflows de Aprobación - Gastify

## Descripción General

El sistema de workflows de aprobación de Gastify permite a las empresas configurar reglas automáticas para la aprobación de gastos basadas en montos, categorías, roles de usuario y jerarquías organizacionales.

## Características Principales

- **Reglas Configurables**: Definir condiciones complejas para aprobación automática
- **Jerarquías Organizacionales**: Soporte para múltiples niveles de aprobación
- **Escalación Automática**: Escalación basada en reglas y tiempos
- **Notificaciones en Tiempo Real**: Alertas automáticas para aprobadores
- **Analytics Avanzados**: Métricas y reportes de eficiencia
- **Plantillas Predefinidas**: Templates optimizados para empresas chilenas

## Endpoints de la API

### Gestión de Workflows

#### Crear Workflow
```http
POST /api/workflows/
```

**Request Body:**
```json
{
  "name": "Workflow Empresarial",
  "description": "Workflow para gastos empresariales con múltiples niveles",
  "rules": [
    {
      "name": "Auto-aprobación gastos pequeños",
      "description": "Aprobación automática para gastos menores a 50.000 CLP",
      "conditions": [
        {
          "field": "amount",
          "operator": "less_equal",
          "value": 50000,
          "description": "Monto menor o igual a 50.000 CLP"
        }
      ],
      "condition_logic": "AND",
      "action": "approve",
      "priority": 100
    },
    {
      "name": "Aprobación requerida gastos medianos",
      "description": "Requiere aprobación para gastos entre 50.001 y 500.000 CLP",
      "conditions": [
        {
          "field": "amount",
          "operator": "greater_than",
          "value": 50000
        },
        {
          "field": "amount",
          "operator": "less_equal",
          "value": 500000
        }
      ],
      "condition_logic": "AND",
      "action": "require_approval",
      "priority": 90,
      "escalation_role": "manager"
    }
  ],
  "default_action": "require_approval",
  "is_default": true
}
```

**Response:**
```json
{
  "id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "name": "Workflow Empresarial",
  "description": "Workflow para gastos empresariales con múltiples niveles",
  "status": "draft",
  "company_id": "empresa_123",
  "created_by": "user_456",
  "created_at": "2023-08-28T10:30:00Z",
  "is_default": true,
  "rules": [...],
  "default_action": "require_approval"
}
```

#### Listar Workflows
```http
GET /api/workflows/
```

**Query Parameters:**
- `status` (opcional): Filtrar por estado (`active`, `inactive`, `draft`)

**Response:**
```json
[
  {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Workflow Empresarial",
    "description": "Workflow para gastos empresariales",
    "status": "active",
    "company_id": "empresa_123",
    "created_at": "2023-08-28T10:30:00Z",
    "is_default": true,
    "rules_count": 5
  }
]
```

#### Obtener Workflow
```http
GET /api/workflows/{workflow_id}
```

**Response:**
```json
{
  "id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "name": "Workflow Empresarial",
  "description": "Workflow detallado",
  "status": "active",
  "rules": [
    {
      "id": "rule_001",
      "name": "Auto-aprobación gastos pequeños",
      "conditions": [...],
      "action": "approve",
      "priority": 100
    }
  ],
  "default_action": "require_approval",
  "created_at": "2023-08-28T10:30:00Z",
  "updated_at": "2023-08-28T15:45:00Z"
}
```

#### Actualizar Workflow
```http
PUT /api/workflows/{workflow_id}
```

**Request Body:**
```json
{
  "name": "Workflow Actualizado",
  "status": "active",
  "rules": [...]
}
```

#### Eliminar Workflow
```http
DELETE /api/workflows/{workflow_id}
```

**Response:**
```json
{
  "message": "Workflow eliminado exitosamente"
}
```

#### Obtener Workflow por Defecto
```http
GET /api/workflows/default/current
```

### Gestión de Aprobaciones

#### Listar Aprobaciones Pendientes
```http
GET /api/workflows/approvals/pending
```

**Query Parameters:**
- `approver_role` (opcional): Filtrar por rol de aprobador

**Response:**
```json
[
  {
    "id": "approval_001",
    "receipt_id": "receipt_123",
    "workflow_id": "workflow_456",
    "status": "pending",
    "current_approver_id": "user_789",
    "applied_rule_id": "rule_001",
    "created_at": "2023-08-28T09:15:00Z",
    "due_date": "2023-08-31T09:15:00Z",
    "receipt_details": {
      "amount": 150000,
      "merchant": "Supermercado Chile",
      "category": "Oficina"
    }
  }
]
```

#### Obtener Instancia de Aprobación
```http
GET /api/workflows/approvals/{instance_id}
```

**Response:**
```json
{
  "id": "approval_001",
  "receipt_id": "receipt_123",
  "workflow_id": "workflow_456",
  "status": "pending",
  "current_approver_id": "user_789",
  "approval_chain": [
    {
      "approver_id": "user_456",
      "action": "escalate",
      "comment": "Requiere revisión adicional",
      "timestamp": "2023-08-28T10:30:00Z"
    }
  ],
  "escalation_count": 1,
  "due_date": "2023-08-31T09:15:00Z",
  "comments": []
}
```

#### Procesar Decisión de Aprobación
```http
POST /api/workflows/approvals/{instance_id}/decision
```

**Request Body:**
```json
{
  "action": "approve",
  "comment": "Gasto aprobado, documentación correcta",
  "escalate_to_user_id": null,
  "escalate_to_role": null
}
```

**Acciones disponibles:**
- `approve`: Aprobar el gasto
- `reject`: Rechazar el gasto
- `escalate`: Escalar a otro aprobador

**Response:**
```json
{
  "id": "approval_001",
  "status": "approved",
  "approval_chain": [
    {
      "approver_id": "user_789",
      "action": "approve",
      "comment": "Gasto aprobado, documentación correcta",
      "timestamp": "2023-08-28T14:20:00Z"
    }
  ],
  "updated_at": "2023-08-28T14:20:00Z"
}
```

### Roles Organizacionales

#### Crear Rol Organizacional
```http
POST /api/workflows/roles
```

**Request Body:**
```json
{
  "name": "Gerente de Área",
  "level": 2,
  "approval_limit": 1000000,
  "can_approve_categories": ["Oficina", "Viajes", "Entretenimiento"],
  "parent_role_id": "role_001"
}
```

**Response:**
```json
{
  "id": "role_002",
  "company_id": "empresa_123",
  "name": "Gerente de Área",
  "level": 2,
  "approval_limit": 1000000,
  "can_approve_categories": ["Oficina", "Viajes", "Entretenimiento"],
  "parent_role_id": "role_001",
  "created_at": "2023-08-28T11:00:00Z"
}
```

#### Asignar Rol a Usuario
```http
POST /api/workflows/roles/assign
```

**Request Body:**
```json
{
  "user_id": "user_123",
  "role_id": "role_002"
}
```

**Response:**
```json
{
  "id": "assignment_001",
  "user_id": "user_123",
  "role_id": "role_002",
  "assigned_by": "admin_456",
  "assigned_at": "2023-08-28T11:15:00Z",
  "is_active": true
}
```

### Analytics y Reportes

#### Obtener Analytics de Workflows
```http
GET /api/workflows/analytics/summary
```

**Query Parameters:**
- `workflow_id` (opcional): ID del workflow específico
- `start_date` (opcional): Fecha de inicio (ISO 8601)
- `end_date` (opcional): Fecha de fin (ISO 8601)

**Response:**
```json
{
  "total_approvals": 150,
  "auto_approved": 85,
  "manual_approved": 45,
  "rejected": 15,
  "pending": 5,
  "average_approval_time": 2.5,
  "escalation_rate": 0.12,
  "approval_rate_by_category": {
    "Oficina": 0.95,
    "Viajes": 0.88,
    "Entretenimiento": 0.75
  },
  "approval_rate_by_amount_range": {
    "0-50000": 1.0,
    "50001-200000": 0.92,
    "200001-500000": 0.85,
    "500001+": 0.70
  },
  "top_approvers": [
    {
      "user_id": "user_123",
      "name": "Juan Pérez",
      "approvals_count": 25,
      "average_time": 1.8
    }
  ]
}
```

### Plantillas Predefinidas

#### Obtener Plantilla Básica
```http
GET /api/workflows/templates/basic
```

**Response:**
```json
{
  "name": "Workflow Básico Chile",
  "description": "Plantilla básica de aprobación para empresas chilenas",
  "rules": [
    {
      "name": "Auto-aprobación montos pequeños",
      "conditions": [
        {
          "field": "amount",
          "operator": "less_equal",
          "value": 50000,
          "description": "Monto menor a 50.000 CLP"
        }
      ],
      "action": "approve",
      "priority": 100
    }
  ]
}
```

#### Obtener Plantilla Empresarial
```http
GET /api/workflows/templates/enterprise
```

**Response:**
```json
{
  "name": "Workflow Empresarial Chile",
  "description": "Plantilla empresarial con múltiples niveles para Chile",
  "rules": [
    {
      "name": "Auto-aprobación gastos oficina",
      "conditions": [
        {
          "field": "category",
          "operator": "in",
          "value": ["Oficina", "Materiales", "Suministros"]
        },
        {
          "field": "amount",
          "operator": "less_equal",
          "value": 100000
        }
      ],
      "condition_logic": "AND",
      "action": "approve",
      "priority": 100
    }
  ]
}
```

### Endpoint de Prueba

#### Evaluar Recibo contra Workflow
```http
POST /api/workflows/test-evaluation
```

**Request Body:**
```json
{
  "user": "user_123",
  "merchant": "Supermercado Chile",
  "total": 75000,
  "date": "2023-08-28T10:00:00Z",
  "description": "Compra de suministros",
  "category": "Oficina"
}
```

**Query Parameters:**
- `workflow_id` (opcional): ID del workflow a usar para evaluación

**Response:**
```json
{
  "evaluation": {
    "workflow_id": "workflow_456",
    "applied_rule_id": "rule_001",
    "action": "approve",
    "reason": "Regla aplicada: Auto-aprobación gastos oficina",
    "confidence": 0.95,
    "auto_approved": true,
    "next_approver_id": null
  },
  "workflow_used": {
    "id": "workflow_456",
    "name": "Workflow Empresarial"
  }
}
```

## Operadores de Condiciones

Los siguientes operadores están disponibles para las condiciones de workflow:

| Operador | Descripción | Ejemplo |
|----------|-------------|---------|
| `equals` | Igual a | `category equals "Oficina"` |
| `not_equals` | No igual a | `category not_equals "Personal"` |
| `greater_than` | Mayor que | `amount greater_than 100000` |
| `less_than` | Menor que | `amount less_than 50000` |
| `greater_equal` | Mayor o igual que | `amount greater_equal 100000` |
| `less_equal` | Menor o igual que | `amount less_equal 500000` |
| `contains` | Contiene | `description contains "viaje"` |
| `not_contains` | No contiene | `description not_contains "personal"` |
| `in` | Está en lista | `category in ["Oficina", "Viajes"]` |
| `not_in` | No está en lista | `category not_in ["Personal"]` |

## Campos Disponibles para Condiciones

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `amount` | number | Monto del gasto en CLP |
| `category` | string | Categoría del gasto |
| `merchant` | string | Nombre del comercio |
| `user_role` | string | Rol del usuario que envía |
| `user_roles` | array | Lista de roles del usuario |
| `day_of_week` | number | Día de la semana (0=Lunes) |
| `month` | number | Mes del año (1-12) |
| `is_weekend` | boolean | Si es fin de semana |
| `has_location` | boolean | Si tiene datos de ubicación |
| `location_city` | string | Ciudad de la ubicación |
| `location_country` | string | País de la ubicación |

## Acciones de Workflow

| Acción | Descripción |
|--------|-------------|
| `approve` | Aprobar automáticamente |
| `reject` | Rechazar automáticamente |
| `require_approval` | Requerir aprobación manual |
| `escalate` | Escalar a otro aprobador |

## Estados de Aprobación

| Estado | Descripción |
|--------|-------------|
| `pending` | Pendiente de aprobación |
| `approved` | Aprobado |
| `rejected` | Rechazado |
| `escalated` | Escalado |
| `auto_approved` | Auto-aprobado |

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `400` | Datos de entrada inválidos |
| `401` | No autenticado |
| `403` | Sin permisos suficientes |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej: workflow con aprobaciones pendientes) |
| `500` | Error interno del servidor |

## Ejemplos de Uso

### Crear Workflow Básico para Empresa Pequeña

```bash
curl -X POST "https://api.gastify.cl/api/workflows/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Workflow Empresa Pequeña",
    "description": "Workflow simple para empresa con pocos empleados",
    "rules": [
      {
        "name": "Auto-aprobación gastos menores",
        "conditions": [
          {
            "field": "amount",
            "operator": "less_equal",
            "value": 30000
          }
        ],
        "action": "approve",
        "priority": 100
      },
      {
        "name": "Aprobación manual gastos mayores",
        "conditions": [
          {
            "field": "amount",
            "operator": "greater_than",
            "value": 30000
          }
        ],
        "action": "require_approval",
        "priority": 90
      }
    ],
    "is_default": true
  }'
```

### Aprobar un Gasto

```bash
curl -X POST "https://api.gastify.cl/api/workflows/approvals/approval_123/decision" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "comment": "Documentación completa y gasto justificado"
  }'
```

### Obtener Analytics del Mes

```bash
curl -X GET "https://api.gastify.cl/api/workflows/analytics/summary?start_date=2023-08-01T00:00:00Z&end_date=2023-08-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
