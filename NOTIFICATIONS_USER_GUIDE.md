# 🔔 Sistema de Notificaciones Inteligentes - Guía de Usuario

## 🎯 **Introducción**

El Sistema de Notificaciones Inteligentes de Gastify mantiene a empleados y empleadores informados en tiempo real sobre actividades críticas, límites de gasto, patrones anómalos y oportunidades de ahorro.

## 📱 **Centro de Notificaciones**

### **Acceso Rápido**
- 🔔 **Campana de notificaciones**: Esquina superior derecha
- 📊 **Contador en tiempo real**: Muestra notificaciones no leídas
- 🎨 **Indicadores visuales**: Colores por prioridad (verde/amarillo/rojo)

### **Vista Completa**
```
Gastify → Centro de Notificaciones
├── 📋 Todas (45 no leídas)
├── 🤖 Alertas Inteligentes (12)
├── 📊 Estadísticas (3)
└── ⚙️ Configuración
```

## 🤖 **Alertas Inteligentes**

### **Detección de Patrones Anómalos**

#### **Gasto Inusualmente Alto**
```
🚨 ALERTA: Gasto Inusual Detectado
┌─────────────────────────────────────┐
│ Tu gasto promedio reciente: $456.000 │
│ Tu patrón histórico: $234.000       │
│ Incremento detectado: +95%          │
└─────────────────────────────────────┘

💡 Recomendaciones:
• Revisa tus compras de los últimos 7 días
• Identifica gastos grandes no planificados  
• Considera establecer límites semanales
```

#### **Concentración Excesiva por Categoría**
```
⚠️ PATRÓN: Alto Gasto en Restaurantes
┌─────────────────────────────────────┐
│ Gastado este mes: $567.000         │
│ % del total: 73%                   │
│ Transacciones: 28                  │
└─────────────────────────────────────┘

💡 Sugerencias:
• Diversifica gastos en otras categorías
• Planifica comidas caseras 3 días/semana
• Límite sugerido: $400.000/mes restaurantes
```

#### **Proximidad a Límites**
```
🔶 ADVERTENCIA: Cerca del Límite
┌─────────────────────────────────────┐
│ Límite mensual: $800.000           │
│ Uso actual: $720.000 (90%)         │
│ Días restantes: 8                  │
└─────────────────────────────────────┘

🎯 Plan de Acción:
• Presupuesto restante: $80.000 para 8 días
• Gasto diario recomendado: $10.000
• Evita gastos no esenciales
```

### **Alertas de Aprobación**

#### **Para Empleadores**
```
📋 PENDIENTE: Recibos por Aprobar
┌─────────────────────────────────────┐
│ Empleado: María González            │
│ Monto: $156.000                     │
│ Categoría: Combustible              │
│ Tiempo transcurrido: 2 horas        │
└─────────────────────────────────────┘

⚡ Acciones Rápidas:
[✅ Aprobar] [❌ Rechazar] [💬 Solicitar Info]
```

#### **Para Empleados**
```
✅ APROBADO: Tu Recibo #4521
┌─────────────────────────────────────┐
│ Monto: $89.000                      │
│ Comercio: Copec Santa Rosa          │
│ Aprobado por: Carlos Mendoza        │
│ Tiempo procesamiento: 23 minutos    │
└─────────────────────────────────────┘
```

## 📊 **Tipos de Notificaciones**

### **Por Prioridad**

| Prioridad | Color | Ejemplo | Tiempo Respuesta |
|-----------|-------|---------|------------------|
| 🔴 **Alta** | Rojo | Límite excedido, fraude detectado | Inmediato |
| 🟡 **Media** | Amarillo | Cerca del límite, patrón unusual | < 1 hora |
| 🟢 **Baja** | Verde | Resumen semanal, tips de ahorro | < 24 horas |

### **Por Categoría**

#### **💰 Límites de Gasto**
- Uso 80%, 90%, 100% del límite
- Límites por categoría excedidos
- Proyecciones de fin de período
- Recomendaciones de ajuste

#### **📋 Workflow de Aprobación**
- Nuevos recibos pendientes
- Solicitudes de información adicional
- Aprobaciones/rechazos recibidos
- Vencimientos de plazos

#### **🤖 Inteligencia Artificial**
- Patrones de gasto detectados  
- Oportunidades de ahorro identificadas
- Anomalías en comportamiento
- Predicciones personalizadas

#### **🔒 Seguridad**
- Intentos de login sospechosos
- Cambios en configuración crítica
- Excepciones de política detectadas
- Actividad fuera de horario

#### **📈 Reportes y Estadísticas**
- Resúmenes semanales/mensuales
- Comparativas vs período anterior
- Benchmarks vs otros empleados
- Alertas de presupuesto

## ⚙️ **Configuración de Preferencias**

### **Canales de Notificación**

```javascript
// Acceso: Configuración → Notificaciones
{
  email_notifications: true,      // 📧 Email
  push_notifications: true,       // 📱 Browser/Mobile Push  
  in_app_notifications: true,     // 🔔 Centro de notificaciones
  sms_notifications: false        // 📱 SMS (premium)
}
```

### **Frecuencia por Tipo**

```javascript
{
  spending_alerts: "real_time",     // Inmediato
  limit_warnings: "real_time",     // Inmediato  
  approval_updates: "real_time",   // Inmediato
  weekly_summary: "weekly",        // Domingos 9:00
  monthly_report: "monthly",       // Día 1 del mes
  ai_insights: "weekly"            // Viernes 17:00
}
```

### **Umbrales Personalizables**

```javascript
{
  limit_warning_threshold: 80,      // % para primera advertencia
  critical_threshold: 90,           // % para alerta crítica
  unusual_spending_factor: 1.5,     // Factor sobre promedio histórico
  approval_reminder_hours: 4,       // Horas para recordar aprobación
  ai_insight_minimum_impact: 50000  // Monto mínimo CLP para insight
}
```

## 🎨 **Interfaz de Usuario**

### **NotificationBell - Componente Principal**

```typescript
// Vista Compacta en Header
<NotificationBell>
  📊 Badge: "12" (no leídas)
  🎨 Colores: Verde (normal) / Rojo (urgente)
  
  // Dropdown Preview (5 más recientes)
  ┌─ 🔴 Límite excedido - Hace 5min
  ├─ 🟡 Patrón detectado - Hace 2h  
  ├─ ✅ Recibo aprobado - Hace 4h
  ├─ 📊 Resumen semanal - Ayer
  └─ [Ver todas las 12 →]
</NotificationBell>
```

### **NotificationCenter - Vista Completa**

```typescript
// Tabs organizadas
📋 Todas (45)
├─ Filtros: [Tipo] [Prioridad] [Leído/No leído]
├─ Búsqueda: "límite combustible"
├─ Acciones: [Marcar todas leídas] [Archivar]

🤖 Alertas IA (12) 
├─ Patrones de gasto
├─ Oportunidades ahorro  
├─ Predicciones personalizadas

📊 Estadísticas (3)
├─ Resúmenes semanales
├─ Comparativas período
├─ Benchmarks empleados
```

## 📧 **Plantillas de Notificación**

### **Email - Límite Excedido**
```html
Asunto: 🚨 [Gastify] Límite de Gasto Excedido

Hola María,

Tu límite mensual de $800.000 ha sido excedido.

📊 Resumen:
• Límite: $800.000
• Gastado: $856.000  
• Exceso: $56.000 (7%)
• Días restantes: 8

🔗 Acciones:
• Ver detalles: gastify.cl/limits
• Contactar empleador: carlos.mendoza@empresa.cl
• Solicitar extensión: gastify.cl/request-extension

Saludos,
Equipo Gastify
```

### **Push - Patrón Detectado**
```json
{
  "title": "🤖 Patrón Inusual Detectado",
  "body": "Gastos 95% más altos que tu promedio. Tap para detalles.",
  "icon": "/icons/alert-pattern.png",
  "actions": [
    {"action": "view", "title": "Ver Detalles"},
    {"action": "dismiss", "title": "Descartar"}
  ],
  "data": {
    "url": "/notifications/intelligent-alerts",
    "type": "spending_pattern",
    "priority": "high"
  }
}
```

## 📈 **Analytics de Notificaciones**

### **Dashboard de Efectividad**

```
📊 Métricas de Notificaciones (Último Mes)
┌─────────────────────────────────────────┐
│ Enviadas: 234 | Leídas: 198 (85%)      │
│ Tiempo promedio respuesta: 23 minutos   │  
│ Acciones tomadas: 156 (67%)            │
└─────────────────────────────────────────┘

📈 Por Tipo:
├─ Límites: 89% efectividad (acción tomada)
├─ Aprobaciones: 95% efectividad  
├─ IA Insights: 45% efectividad
└─ Reportes: 23% efectividad

🎯 Optimizaciones Sugeridas:
• Reducir frecuencia reportes semanales
• Mejorar personalización IA insights
• Incrementar urgencia visual límites
```

### **Patrones de Comportamiento**

```
👤 Perfil Usuario: María González
┌─────────────────────────────────────────┐
│ Responde mejor: Mañana (9-11am)         │
│ Canal preferido: Push notifications      │
│ Tipos que ignora: Reportes estadísticos │
│ Tiempo respuesta: 15min (promedio)     │
└─────────────────────────────────────────┘

🔧 Configuración Automática Sugerida:
• Enviar alertas críticas inmediatamente
• Agrupar reportes en digest semanal
• Usar push para límites, email para resúmenes
• Horario óptimo: 10:00 AM días laborales
```

## 🔄 **Flujos de Trabajo Automatizados**

### **Escalamiento Automático**

```
🔄 Flujo: Límite Excedido
┌─ Empleado excede límite
├─ ⏱️ Notificación inmediata → Empleado
├─ ⏱️ 30 min: Sin respuesta → Notificar empleador
├─ ⏱️ 2 horas: Sin acción → Escalamiento gerencia
└─ ⏱️ 24 horas: Bloqueo automático nuevos gastos
```

### **Agrupación Inteligente**

```
📦 Agrupación: Múltiples Alertas Similar Tipo
┌─ 5 alertas "Cerca del límite" en 2 horas
├─ Agrupa en: "Múltiples límites en riesgo"  
├─ Reduce spam: 5 notificaciones → 1 digest
└─ Incluye: Resumen + acciones prioritarias
```

## 🎯 **Mejores Prácticas**

### **Para Empleadores**
1. **Configurar umbrales realistas** (80%, 90% advertencias)
2. **Responder rápido** a solicitudes empleados (< 4 horas)
3. **Revisar patrones IA** semanalmente para insights
4. **Personalizar por rol** (vendedores vs administrativos)
5. **Usar resúmenes ejecutivos** para visión general

### **Para Empleados**  
1. **Mantener notificaciones activas** para límites críticos
2. **Revisar alertas IA** para optimizar gastos
3. **Configurar horarios preferidos** para no críticas
4. **Usar acciones rápidas** desde notificaciones
5. **Actualizar contactos** para escalamiento

### **Para Administradores**
1. **Monitorear métricas efectividad** mensualmente
2. **Ajustar umbrales** basado en comportamiento
3. **Optimizar plantillas** según feedback usuarios
4. **Implementar A/B testing** en mensajes críticos
5. **Mantener logs** para auditoría y compliance

## 🚨 **Resolución de Problemas**

### **"No recibo notificaciones"**
```
🔍 Diagnóstico:
1. ✅ Revisar preferencias → Configuración
2. ✅ Verificar email/teléfono actualizados  
3. ✅ Comprobar carpeta spam/promociones
4. ✅ Probar notificación test → Configuración
5. ✅ Contactar soporte si persiste
```

### **"Demasiadas notificaciones"**
```
⚙️ Optimización:
1. 📊 Configurar umbrales más altos
2. 🔇 Desactivar tipos no críticos
3. 📦 Activar agrupación inteligente
4. ⏰ Configurar horarios específicos
5. 🤖 Usar solo alertas IA importantes
```

### **"Notificaciones incorrectas"**
```
🔧 Corrección:
1. 🎯 Reportar tipo específico → Soporte
2. 📊 Revisar configuración límites
3. 🔄 Limpiar caché navegador
4. 📱 Reinstalar app móvil
5. 🛠️ Verificar sincronización datos
```

## 📞 **Soporte y Contacto**

```
📧 Email: notificaciones@gastify.cl
📱 Chat: gastify.cl/soporte-notificaciones  
📞 Teléfono: +56 2 2890 1234
⏰ Horario: Lun-Vie 8:00-20:00, Sáb 9:00-14:00
🚨 Urgencias: soporte-urgente@gastify.cl (24/7)
```

---

*Última actualización: Enero 2024*  
*Versión del sistema: 2.0.0*
