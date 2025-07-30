# Guía de Configuración del Proyecto EncoderGroup

Esta guía te ayudará a configurar correctamente el proyecto para desarrollo y evitar problemas de build.

## Requisitos Previos

- Node.js v16.x o superior
- npm v7.x o superior (o yarn v1.22.x)
- Python 3.8 o superior
- MongoDB (local o remoto)

## Estructura del Proyecto

El proyecto está dividido en dos partes principales:

```
encodergroup-app/
├── client-new/     # Frontend en React
└── server/         # Backend en FastAPI
```

## Configuración del Frontend

1. **Instalar dependencias:**

```bash
cd client-new
npm install
```

2. **Crear archivo .env.local:**

```
REACT_APP_API_URL=http://localhost:8000
```

3. **Ejecutar en desarrollo:**

```bash
npm start
```

4. **Crear build de producción:**

```bash
npm run build
```

## Configuración del Backend

1. **Crear entorno virtual:**

```bash
cd server
python -m venv venv
```

2. **Activar entorno virtual:**

En Windows:
```
venv\Scripts\activate
```

En macOS/Linux:
```
source venv/bin/activate
```

3. **Instalar dependencias:**

```bash
pip install -r requirements.txt
```

4. **Crear archivo .env:**

```
DB_URL=mongodb://localhost:27017
DB_NAME=encodergroup
JWT_SECRET=tu_clave_secreta_aqui
JWT_ALGORITHM=HS256
```

5. **Ejecutar servidor:**

```bash
uvicorn app.main:app --reload
```

## Solución de Problemas Comunes

### Error en TypeScript relacionado con el tipo `Board`

Si encuentras errores relacionados con la definición del tipo `Board` durante el build, asegúrate de:

1. Verificar que la estructura en `client-new/src/types/project.ts` coincida con el uso real en el código
2. Comprobar que el componente `KanbanBoard` esté manejando correctamente el caso donde `columnOrder` puede ser undefined

### Errores de incompatibilidad de versiones

Si tienes problemas con las versiones de las dependencias:

```bash
# Reinstalar node_modules
rm -rf node_modules
npm install

# Si persisten los problemas, intenta limpiar el cache de npm
npm cache clean --force
npm install
```

### Problemas con MongoDB

Asegúrate de que MongoDB esté ejecutándose y accesible en la URL configurada en el archivo .env del servidor.

## Convenciones de Código

- Utilizamos ESLint y Prettier para mantener la consistencia del código
- El código TypeScript se escribe con tipos explícitos
- Los componentes React siguen una estructura funcional con hooks

## Contacto

Si encuentras algún problema que no puedas resolver, contacta al equipo de desarrollo en [correo@ejemplo.com].
