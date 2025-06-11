# EncoderGroup - Plataforma de Gestión Empresarial

![EncoderGroup Logo](https://via.placeholder.com/800x200/0078D7/FFFFFF?text=EncoderGroup)

## 🚀 Acerca del Proyecto

EncoderGroup es una plataforma integral de gestión empresarial diseñada para optimizar los procesos internos de organizaciones modernas. Esta solución tecnológica permite administrar proyectos, coordinar reuniones, gestionar solicitudes, y mantener un sistema centralizado de información para toda la empresa.

## ✨ Características Principales

- **Gestión de Proyectos**: Seguimiento completo del ciclo de vida de proyectos con asignación de equipos, tareas y recursos.
- **Programación de Reuniones**: Coordinación eficiente de reuniones con notificaciones, agendas y seguimiento de acuerdos.
- **Sistema de Solicitudes**: Flujo automatizado para solicitudes internas (materiales, viáticos, permisos, soporte técnico).
- **Perfil de Usuario**: Gestión de información personal, preferencias y actividad de la cuenta.
- **Diseño Responsivo**: Experiencia de usuario consistente en todos los dispositivos.
- **Arquitectura Escalable**: Diseñada para crecer con las necesidades de la empresa.

## 🛠️ Tecnologías Utilizadas

### Frontend
- React.js con TypeScript
- TailwindCSS para estilos
- Formik y Yup para validación de formularios
- React Router para navegación
- Context API para gestión de estado

### Backend
- FastAPI con Python
- MongoDB como base de datos
- Autenticación JWT
- APIs RESTful

### Infraestructura
- Docker y Docker Compose
- Nginx para servir la aplicación
- CI/CD para despliegue automatizado

## 🏗️ Arquitectura

La aplicación sigue una arquitectura cliente-servidor moderna:

- **Cliente**: Una SPA (Single Page Application) desarrollada en React que ofrece una experiencia de usuario fluida y reactiva.
- **Servidor**: API RESTful que maneja la lógica de negocio y la comunicación con la base de datos.
- **Base de Datos**: MongoDB para almacenamiento flexible y escalable de datos.

## 📋 Requisitos

- Python 3.10+
- Docker y Docker Compose
- MongoDB

## 🚀 Instalación y Ejecución

### Usando Docker (Recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/DanielEncoderGroup/encodergroup-app.git
cd encodergroup-app

# Iniciar los servicios con Docker Compose
docker-compose up --build
```

La aplicación estará disponible en:
- Frontend: http://localhost
- Backend API: http://localhost:5000

### Instalación Manual

```bash
# Clonar el repositorio
git clone https://github.com/DanielEncoderGroup/encodergroup-app.git
cd encodergroup-app

# Instalar dependencias del servidor
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# En otra terminal, instalar dependencias del cliente
cd ../client-new
npm install
npm start
```

## 🤝 Contribución

EncoderGroup es un proyecto en constante evolución. Valoramos cualquier contribución que ayude a mejorar y expandir sus capacidades. Si deseas contribuir:

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Realiza tus cambios y haz commit (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📞 Contacto

EncoderGroup - [https://encodergroup.cl](https://encodergroup.cl)

Email: info@encodergroup.cl

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

---

⭐️ Desarrollado con pasión por [EncoderGroup](https://github.com/DanielEncoderGroup) - Soluciones tecnológicas escalables para empresas modernas.
