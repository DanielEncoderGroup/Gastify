# 💰 Sistema de Límites de Gasto - Guía de Usuario

## 🎯 **Introducción**

El Sistema de Límites de Gasto de Gastify permite a los empleadores establecer controles automáticos sobre los gastos de sus empleados, asegurando el cumplimiento de presupuestos y políticas empresariales.

## 👥 **Roles y Permisos**

### **Empleadores** 🏢
- ✅ Crear límites de gasto para empleados
- ✅ Ver uso actual vs límites establecidos
- ✅ Recibir alertas cuando se excedan límites
- ✅ Modificar y eliminar límites existentes
- ✅ Configurar límites masivos para múltiples empleados

### **Empleados** 👤
- ✅ Ver sus propios límites asignados
- ✅ Consultar uso actual de sus límites
- ✅ Recibir notificaciones de advertencia (80%, 90%, 100%)
- ✅ Validar transacciones antes de realizar gastos

## 🔧 **Configuración de Límites**

### **Tipos de Límites Disponibles**

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `daily` | Límite diario | $50.000 por día |
| `weekly` | Límite semanal | $300.000 por semana |
| `monthly` | Límite mensual | $1.200.000 por mes |
| `yearly` | Límite anual | $15.000.000 por año |
| `per_transaction` | Por transacción | $200.000 máximo por boleta |

### **Restricciones por Categoría**

Los límites pueden aplicarse a categorías específicas:

- 🛒 **Supermercado**: Alimentos y productos básicos
- ⛽ **Combustible**: Gasolina y servicios vehiculares
- 💊 **Farmacia**: Medicamentos y productos de salud
- 🍽️ **Restaurantes**: Comidas y entretenimiento
- 📚 **Oficina**: Materiales y suministros
- 🚗 **Transporte**: Uber, taxis, transporte público
- 🏨 **Hospedaje**: Hoteles y alojamiento
- 👕 **Retail**: Ropa y productos generales
- 🔧 **Servicios**: Reparaciones y servicios profesionales
- 📱 **Tecnología**: Equipos y software
- 🏥 **Salud**: Consultas médicas y tratamientos
- 📊 **Otros**: Gastos no categorizados

## 🚀 **Uso Paso a Paso**

### **Para Empleadores: Crear Límite**

1. **Acceder al Dashboard**
   ```
   Gastify → Dashboard Empleador → Gestión de Empleados
   ```

2. **Seleccionar Empleado**
   - Buscar empleado en la lista
   - Click en "Configurar Límites"

3. **Definir Límite**
   ```
   Tipo: monthly
   Monto: $800.000
   Moneda: CLP
   Categorías: ["Supermercado", "Combustible", "Restaurantes"]
   Estado: Activo
   ```

4. **Confirmar Creación**
   - Revisar configuración
   - Click "Crear Límite"
   - El empleado recibe notificación automática

### **Para Empleadores: Límites Masivos**

1. **Seleccionar Múltiples Empleados**
   - Usar checkboxes para selección múltiple
   - Click "Configuración Masiva"

2. **Definir Plantilla**
   ```
   Límite Base: $1.000.000/mes
   Aplicar a: Todos los departamentos
   Categorías: Todas excepto "Tecnología"
   ```

3. **Aplicar Masivamente**
   - Revisar lista de empleados afectados
   - Confirmar aplicación
   - Sistema crea límites individuales

### **Para Empleados: Consultar Límites**

1. **Ver Panel de Límites**
   ```
   Gastify → Mi Dashboard → Límites Asignados
   ```

2. **Información Mostrada**
   - 📊 Límite mensual: $800.000
   - 💰 Uso actual: $456.000 (57%)
   - ⏰ Días hasta reset: 12
   - 🎯 Estado: ✅ Dentro del límite

3. **Validar Nueva Compra**
   ```
   Antes de comprar → "Validar Transacción"
   Monto: $50.000
   Categoría: Supermercado
   Resultado: ✅ Autorizado (uso llegará a 63%)
   ```

## 📊 **Monitoreo y Alertas**

### **Niveles de Alerta**

| % Uso | Estado | Color | Acción |
|-------|--------|-------|---------|
| 0-79% | 🟢 Normal | Verde | Ninguna |
| 80-89% | 🟡 Advertencia | Amarillo | Notificación al empleado |
| 90-99% | 🟠 Crítico | Naranja | Notificación a empleado + empleador |
| 100%+ | 🔴 Excedido | Rojo | Bloqueo + notificaciones urgentes |

### **Tipos de Notificaciones**

#### **Para Empleados**
- 📱 **Notificación 80%**: "Has usado 80% de tu límite mensual"
- 📱 **Notificación 90%**: "Límite crítico alcanzado - Revisa gastos pendientes"
- 📱 **Notificación 100%**: "Límite excedido - Contacta a tu empleador"

#### **Para Empleadores**
- 📧 **Alerta 90%**: "Empleado Juan Pérez cerca del límite mensual"
- 📧 **Alerta 100%**: "URGENTE: Empleado María López excedió límite"
- 📧 **Resumen Semanal**: "3 empleados cerca del límite esta semana"

## 🔍 **Reportes y Analytics**

### **Dashboard Empleador**

```
📈 Resumen General
├── Empleados con límites activos: 25
├── Uso promedio del período: 67%
├── Empleados en zona crítica (>90%): 3
└── Total presupuestado vs gastado: $20M vs $13.4M

📊 Por Departamento
├── Ventas: 78% uso promedio
├── Marketing: 45% uso promedio
├── Operaciones: 89% uso promedio (⚠️)
└── Administración: 23% uso promedio

📋 Top Empleados por Uso
├── 1. Ana García (Ventas): 95% - $475K de $500K
├── 2. Carlos Ruiz (Ops): 92% - $920K de $1M
└── 3. Sofia Luna (Marketing): 88% - $440K de $500K
```

### **Dashboard Empleado**

```
💰 Mi Límite Mensual: $800.000
📊 Uso Actual: $567.000 (71%)
📅 Días Restantes: 8 días
🎯 Proyección Fin de Mes: $789.000 (99%)

📈 Desglose por Categoría
├── Supermercado: $234K (29%)
├── Combustible: $156K (20%)
├── Restaurantes: $123K (15%)
└── Transporte: $54K (7%)

⚠️ Recomendaciones
├── Reduce gastos en restaurantes ($20K/semana)
├── Gastos de combustible normales
└── Presupuesto restante: $233K para 8 días
```

## ⚙️ **Configuración Avanzada**

### **Plantillas Predefinidas**

#### **Ejecutivo Senior**
```json
{
  "limit_type": "monthly",
  "limit_amount": 2000000,
  "currency": "CLP",
  "category_restrictions": [],
  "auto_approval_threshold": 500000
}
```

#### **Empleado Administrativo**
```json
{
  "limit_type": "monthly", 
  "limit_amount": 500000,
  "currency": "CLP",
  "category_restrictions": ["Supermercado", "Transporte", "Oficina"],
  "auto_approval_threshold": 50000
}
```

#### **Vendedor de Terreno**
```json
{
  "limit_type": "monthly",
  "limit_amount": 1200000, 
  "currency": "CLP",
  "category_restrictions": ["Combustible", "Restaurantes", "Transporte", "Hospedaje"],
  "auto_approval_threshold": 200000
}
```

### **Excepciones y Casos Especiales**

#### **Gastos de Emergencia**
- Los empleados pueden solicitar excepciones temporales
- Proceso de aprobación expresó (< 2 horas)
- Documentación adicional requerida

#### **Límites Temporales**
```
Evento: Viaje de negocios
Período: 5 días
Límite adicional: $300.000
Categorías: Hospedaje + Restaurantes + Transporte
Auto-reset: Al finalizar el período
```

## 🔒 **Seguridad y Compliance**

### **Controles de Acceso**
- 🔐 Solo empleadores pueden modificar límites
- 📋 Logs detallados de todos los cambios
- 🔍 Auditoría completa de excepciones
- 📊 Reportes de compliance trimestral

### **Validaciones Automáticas**
- ✅ Verificación de fondos disponibles
- ✅ Validación de categoría permitida
- ✅ Control de límites por transacción
- ✅ Detección de patrones anómalos

## 📱 **Integración Mobile**

### **Notificaciones Push**
```
🔔 "Límite alcanzado 85%"
   Usado: $680K de $800K
   Restante: $120K para 6 días
   [Ver Detalles] [Validar Compra]
```

### **Widget de Estado**
```
💰 Gastify Límites
   📊 71% usado este mes
   🎯 $233K disponibles
   📅 Reset en 8 días
```

## 🆘 **Resolución de Problemas**

### **Problemas Comunes**

#### **"No puedo crear límite para empleado"**
- ✅ Verificar que eres empleador del usuario
- ✅ Confirmar que el empleado tiene rol EMPLOYEE
- ✅ Revisar permisos en empresa

#### **"Empleado no ve sus límites"**
- ✅ Confirmar que límite está activo
- ✅ Verificar relación empleador-empleado
- ✅ Revisar caché del navegador

#### **"Alertas no llegan"**
- ✅ Revisar preferencias de notificación
- ✅ Confirmar email válido
- ✅ Verificar configuración de spam

### **Contacto Soporte**
```
📧 Email: soporte@gastify.cl
📱 WhatsApp: +56 9 8765 4321
🌐 Chat: gastify.cl/soporte
⏰ Horario: Lun-Vie 9:00-18:00 CLT
```

## 📈 **Mejores Prácticas**

### **Para Empleadores**
1. **Establecer límites realistas** basados en datos históricos
2. **Comunicar políticas claramente** al equipo
3. **Revisar mensualmente** y ajustar según necesidades
4. **Usar categorías específicas** para mejor control
5. **Configurar alertas tempranas** (80%) para prevención

### **Para Empleados**
1. **Revisar límites regularmente** en el dashboard
2. **Planificar gastos grandes** con anticipación
3. **Usar validación previa** para compras importantes
4. **Comunicar necesidades especiales** al empleador
5. **Mantener receipts organizados** por categoría

---

*Última actualización: Enero 2024*
*Versión: 2.0.0*
