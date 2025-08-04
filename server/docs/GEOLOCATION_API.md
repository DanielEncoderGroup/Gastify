# 📍 API de Geolocalización - Gastify

## Descripción General

El sistema de geolocalización de Gastify permite extraer, analizar y visualizar información de ubicación de los recibos de gastos. Proporciona funcionalidades avanzadas como detección automática de ubicaciones, análisis geográfico de gastos, generación de mapas de calor y detección de viajes de negocios.

## 🔧 Integración con Pipeline Existente

### Modificaciones en `/api/receipts/`

#### `POST /api/receipts/` - Crear Recibo (Modificado)

**Nuevas funcionalidades agregadas:**
- Extracción automática de ubicación del texto OCR
- Geocodificación de direcciones detectadas
- Asociación con marcas conocidas y sus ubicaciones
- Cálculo de confianza de la extracción

**Respuesta actualizada:**
```json
{
  "id": "string",
  "message": "Receipt created successfully",
  "category": "string",
  "location": {
    "extracted": true,
    "confidence": 0.85,
    "method": "brand_matched",
    "address": "Av. Providencia 1550, Providencia, Santiago"
  }
}
```

#### `GET /api/receipts/location-analytics` - Análisis de Geolocalización (Nuevo)

Obtiene análisis geográfico completo de los gastos del usuario.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "total_locations": 15,
  "top_locations": [
    {
      "place_name": "Jumbo Providencia",
      "address": "Av. Providencia 1550",
      "visit_count": 8,
      "total_spent": 125000.0,
      "avg_amount": 15625.0,
      "coordinates": {
        "latitude": -33.4489,
        "longitude": -70.6693
      }
    }
  ],
  "total_spent": 450000.0,
  "avg_distance_from_home": 5.2,
  "most_frequent_category": "Supermercado",
  "business_trip_percentage": 15.5,
  "business_trips": [
    {
      "start_date": "2024-01-15",
      "end_date": "2024-01-17",
      "location": "Valparaíso",
      "total_spent": 85000.0,
      "receipt_count": 6
    }
  ]
}
```

## 🌍 Endpoints de Geolocalización

### Base URL: `/api/geolocation/`

#### `POST /geocode` - Geocodificación

Convierte una dirección en coordenadas geográficas.

**Request:**
```json
{
  "address": "Av. Providencia 1550, Santiago"
}
```

**Response:**
```json
{
  "success": true,
  "location": {
    "coordinates": {
      "latitude": -33.4489,
      "longitude": -70.6693,
      "accuracy": 10.0
    },
    "address": {
      "formatted_address": "Av. Providencia 1550, Providencia, Santiago",
      "street": "Av. Providencia 1550",
      "city": "Santiago",
      "state": "Región Metropolitana",
      "country": "Chile"
    },
    "metadata": {
      "place_name": "Jumbo Providencia",
      "place_id": "ChIJ...",
      "confidence": 0.95
    }
  }
}
```

#### `POST /reverse-geocode` - Geocodificación Inversa

Convierte coordenadas en información de dirección.

**Request:**
```json
{
  "latitude": -33.4489,
  "longitude": -70.6693
}
```

**Response:**
```json
{
  "success": true,
  "location": {
    "address": {
      "formatted_address": "Av. Providencia 1550, Providencia, Santiago",
      "street": "Av. Providencia 1550",
      "city": "Santiago",
      "state": "Región Metropolitana",
      "country": "Chile"
    },
    "metadata": {
      "place_name": "Jumbo Providencia"
    }
  }
}
```

#### `GET /analytics/{user_id}` - Análisis Geográfico

Obtiene estadísticas geográficas detalladas para un usuario.

**Response:**
```json
{
  "user_id": "string",
  "total_locations": 25,
  "unique_locations": 18,
  "most_visited_location": {
    "name": "Jumbo Providencia",
    "visit_count": 12,
    "total_spent": 180000.0
  },
  "spending_by_region": {
    "Santiago": 350000.0,
    "Valparaíso": 85000.0,
    "Concepción": 65000.0
  },
  "avg_distance_from_home": 8.5,
  "total_distance_traveled": 450.2
}
```

#### `GET /heatmap/{user_id}` - Datos para Mapa de Calor

Genera datos optimizados para visualización en mapas de calor.

**Query Parameters:**
- `category` (opcional): Filtrar por categoría
- `date_from` (opcional): Fecha inicio (YYYY-MM-DD)
- `date_to` (opcional): Fecha fin (YYYY-MM-DD)
- `min_amount` (opcional): Monto mínimo
- `max_amount` (opcional): Monto máximo

**Response:**
```json
{
  "heatmap_points": [
    {
      "latitude": -33.4489,
      "longitude": -70.6693,
      "intensity": 0.8,
      "receipt_count": 8,
      "total_amount": 125000.0,
      "place_name": "Jumbo Providencia"
    }
  ],
  "bounds": {
    "north": -33.3500,
    "south": -33.5500,
    "east": -70.5000,
    "west": -70.8000
  },
  "center": {
    "latitude": -33.4489,
    "longitude": -70.6693
  },
  "total_points": 15
}
```

#### `GET /business-trips/{user_id}` - Detección de Viajes de Negocios

Detecta automáticamente viajes de negocios basados en patrones de gasto.

**Query Parameters:**
- `min_distance` (opcional): Distancia mínima en km (default: 50)
- `min_days` (opcional): Días mínimos (default: 1)

**Response:**
```json
{
  "business_trips": [
    {
      "id": "trip_001",
      "start_date": "2024-01-15",
      "end_date": "2024-01-17",
      "destination": {
        "city": "Valparaíso",
        "region": "Región de Valparaíso",
        "coordinates": {
          "latitude": -33.0472,
          "longitude": -71.6127
        }
      },
      "distance_from_home": 120.5,
      "total_spent": 85000.0,
      "receipt_count": 6,
      "categories": ["Alojamiento", "Alimentación", "Transporte"],
      "receipts": ["receipt_id_1", "receipt_id_2", "..."],
      "confidence": 0.92,
      "status": "detected"
    }
  ],
  "summary": {
    "total_trips": 3,
    "total_days": 8,
    "total_spent": 245000.0,
    "avg_trip_duration": 2.7,
    "most_visited_destination": "Valparaíso"
  }
}
```

#### `POST /business-trips/{trip_id}/confirm` - Confirmar Viaje de Negocios

Confirma un viaje detectado automáticamente.

**Request:**
```json
{
  "confirmed": true,
  "notes": "Viaje de trabajo a reunión con cliente"
}
```

**Response:**
```json
{
  "success": true,
  "trip_id": "trip_001",
  "status": "confirmed",
  "message": "Business trip confirmed successfully"
}
```

#### `POST /process-receipt-location` - Procesar Ubicación de Recibo

Extrae y procesa información de ubicación de un texto de recibo.

**Request:**
```json
{
  "receipt_text": "JUMBO BILBAO\nAv. Providencia 1550, Providencia\nSantiago, Chile\n\nVERDURAS FRESCAS $3.450\nTOTAL $3.450"
}
```

**Response:**
```json
{
  "success": true,
  "location_data": {
    "coordinates": {
      "latitude": -33.4489,
      "longitude": -70.6693
    },
    "address": {
      "formatted_address": "Av. Providencia 1550, Providencia, Santiago"
    },
    "metadata": {
      "place_name": "Jumbo Providencia",
      "brand": "Jumbo",
      "category": "Supermercado"
    },
    "extraction_method": "brand_matched",
    "confidence": 0.95
  }
}
```

#### `GET /cache/stats` - Estadísticas de Caché

Obtiene estadísticas del caché de geocodificación.

**Response:**
```json
{
  "total_entries": 1250,
  "hit_rate": 0.78,
  "miss_rate": 0.22,
  "cache_size_mb": 2.5,
  "oldest_entry": "2024-01-01T10:00:00Z",
  "newest_entry": "2024-01-20T15:30:00Z"
}
```

#### `DELETE /cache/clear` - Limpiar Caché

Limpia el caché de geocodificación.

**Response:**
```json
{
  "success": true,
  "message": "Geocoding cache cleared successfully",
  "entries_removed": 1250
}
```

#### `GET /nearby` - Ubicaciones Cercanas

Busca ubicaciones cercanas a unas coordenadas específicas.

**Query Parameters:**
- `latitude`: Latitud (requerido)
- `longitude`: Longitud (requerido)
- `radius`: Radio en metros (default: 1000)
- `category`: Categoría a filtrar (opcional)

**Response:**
```json
{
  "locations": [
    {
      "name": "Jumbo Providencia",
      "category": "Supermercado",
      "distance": 250.5,
      "coordinates": {
        "latitude": -33.4489,
        "longitude": -70.6693
      },
      "address": "Av. Providencia 1550",
      "rating": 4.2
    }
  ],
  "total_found": 15,
  "search_radius": 1000,
  "center": {
    "latitude": -33.4500,
    "longitude": -70.6700
  }
}
```

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante Bearer Token:

```
Authorization: Bearer <jwt_token>
```

## 📊 Códigos de Estado

- `200`: Operación exitosa
- `201`: Recurso creado exitosamente
- `400`: Solicitud inválida
- `401`: No autorizado
- `404`: Recurso no encontrado
- `500`: Error interno del servidor

## 🚨 Manejo de Errores

Formato estándar de respuesta de error:

```json
{
  "success": false,
  "error": {
    "code": "GEOCODING_FAILED",
    "message": "No se pudo geocodificar la dirección proporcionada",
    "details": "Invalid address format"
  }
}
```

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# API Key de Google Maps para geocodificación
GOOGLE_MAPS_API_KEY=your_api_key_here

# Configuración de caché
GEOCODING_CACHE_SIZE=1000
GEOCODING_CACHE_TTL_HOURS=24
```

## 📈 Límites y Consideraciones

### Límites de Rate
- Geocodificación: 100 requests/minuto por usuario
- Análisis: 10 requests/minuto por usuario
- Caché: Sin límite (datos locales)

### Precisión de Datos
- Geocodificación: ±10 metros en áreas urbanas
- Detección de marcas: >90% de precisión para marcas conocidas
- Extracción de direcciones: >85% de precisión

### Soporte Geográfico
- **Completo**: Chile (todas las regiones)
- **Parcial**: Colombia, Perú, Argentina, México
- **Básico**: Otros países (solo geocodificación)

## 🧪 Ejemplos de Uso

### Flujo Completo de Procesamiento

1. **Crear recibo con imagen:**
```bash
curl -X POST "http://localhost:8000/api/receipts/" \
  -H "Authorization: Bearer <token>" \
  -F "companyName=Jumbo" \
  -F "folioNumber=B001-123" \
  -F "date=2024-01-15T10:00:00Z" \
  -F "description=Compra supermercado" \
  -F "totalAmount=25000" \
  -F "image=@receipt.jpg"
```

2. **Obtener análisis geográfico:**
```bash
curl -X GET "http://localhost:8000/api/receipts/location-analytics" \
  -H "Authorization: Bearer <token>"
```

3. **Generar mapa de calor:**
```bash
curl -X GET "http://localhost:8000/api/geolocation/heatmap/user123?category=Supermercado" \
  -H "Authorization: Bearer <token>"
```

## 🔄 Integración Frontend

### Componentes Recomendados

1. **Mapa Interactivo**: Leaflet o Google Maps
2. **Gráficos**: Chart.js o D3.js para análisis
3. **Filtros**: Componentes de fecha y categoría
4. **Notificaciones**: Para viajes detectados

### Estados de Carga

```javascript
// Estados recomendados para UI
const locationStates = {
  EXTRACTING: 'Extrayendo ubicación...',
  GEOCODING: 'Geocodificando dirección...',
  ANALYZING: 'Analizando patrones...',
  COMPLETE: 'Análisis completo',
  ERROR: 'Error en procesamiento'
}
```

---

## 📞 Soporte

Para soporte técnico o reportar problemas:
- Email: dev@gastify.com
- Documentación: https://docs.gastify.com/geolocation
- Issues: https://github.com/gastify/backend/issues
