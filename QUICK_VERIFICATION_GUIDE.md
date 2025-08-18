# 🚀 Guía de Verificación Rápida - Gastify

## 📋 **CHECKLIST ANTES DE TESTING**

### 1. ⚙️ **Iniciar el Servidor**

```bash
cd server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Verificar que aparezca:**
- ✅ "Application startup complete"
- ✅ "Gastify API is running..."
- ✅ Sin errores de importación

### 2. 🌐 **Verificar Documentación API**

Abrir en navegador: `http://localhost:8000/docs`

**Endpoints que DEBEN aparecer:**

#### **🔧 Spending Limits (`/api/spending-limits`)**
- `POST /api/spending-limits/` - Create spending limit
- `GET /api/spending-limits/` - Get spending limits
- `PUT /api/spending-limits/{limit_id}` - Update spending limit
- `DELETE /api/spending-limits/{limit_id}` - Delete spending limit
- `GET /api/spending-limits/usage` - Get spending usage
- `POST /api/spending-limits/validate-transaction` - Validate transaction
- `POST /api/spending-limits/bulk` - Create bulk limits

#### **🔔 Advanced Notifications (`/api/advanced-notifications`)**
- `GET /api/advanced-notifications/` - Get notifications
- `POST /api/advanced-notifications/` - Create notification
- `PUT /api/advanced-notifications/{notification_id}/read` - Mark as read
- `POST /api/advanced-notifications/bulk-read` - Mark bulk as read
- `GET /api/advanced-notifications/stats` - Get notification stats
- `GET /api/advanced-notifications/intelligent-alerts` - Get intelligent alerts
- `GET /api/advanced-notifications/preferences` - Get notification preferences
- `POST /api/advanced-notifications/preferences` - Update notification preferences

#### **👥 Employees (`/api/employees`)**
- `GET /api/employees/my-employees` - Get my employees
- `GET /api/employees/my-employer` - Get my employer
- `GET /api/employees/employee-receipts/{employee_id}` - Get employee receipts
- `GET /api/employees/all-employee-receipts` - Get all employee receipts

### 3. 🔍 **Verificación Básica de Health Check**

```bash
curl http://localhost:8000/
```

**Respuesta esperada:**
```json
{"message": "Gastify API is running..."}
```

### 4. 🔐 **Verificar Autenticación Base**

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test"}'
```

**Debe devolver respuesta (aunque sea error de credenciales, no error 500)**

## 🎯 **CRITERIOS DE ÉXITO**

### ✅ **SERVIDOR FUNCIONANDO SI:**
1. Servidor arranca sin errores de importación
2. `/docs` muestra todos los endpoints listados arriba
3. Health check responde correctamente
4. No hay errores 500 en endpoints básicos

### ❌ **PROBLEMAS COMUNES:**

#### **Error de Importación**
```
ImportError: cannot import name 'router' from 'app.api.routes.spending_limits'
```
**Solución:** Verificar que el archivo `spending_limits.py` tenga `router = APIRouter()`

#### **Error de Base de Datos**
```
pymongo.errors.ServerSelectionTimeoutError
```
**Solución:** Verificar que MongoDB esté ejecutándose

#### **Error de Pydantic**
```
TypeError: BaseModel.dict() missing 1 required positional argument
```
**Solución:** Verificar compatibilidad de versiones en `requirements.txt`

## 🔧 **VERIFICACIÓN EXPRESS (2 MINUTOS)**

### Comando único para verificar servidor:
```bash
cd server && uvicorn app.main:app --reload & sleep 5 && curl http://localhost:8000/ && curl http://localhost:8000/docs
```

Si ambos comandos responden sin error 500, **el servidor está listo**.

## 📊 **PRÓXIMOS PASOS DESPUÉS DE VERIFICACIÓN**

1. ✅ **Si servidor funciona:** Continuar con testing endpoints
2. ❌ **Si hay errores:** Revisar imports y dependencias
3. 🚀 **Si todo está bien:** Preparar deployment

---

**💡 TIP:** Mantener esta guía abierta durante development para verificaciones rápidas.
