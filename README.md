# Gastify - Plataforma de Gestión de Gastos

![Gastify Logo](https://via.placeholder.com/800x200/4CAF50/FFFFFF?text=Gastify)

## 🚀 Acerca del Proyecto

Gastify es una plataforma especializada para la gestión y rendición de gastos empresariales diseñada para optimizar los procesos financieros de organizaciones modernas. Esta solución tecnológica permite registrar, categorizar, aprobar y hacer seguimiento de gastos corporativos, simplificando la rendición de cuentas y mejorando la transparencia financiera.

## ✨ Características Principales

- **Registro de Gastos**: Captura detallada de gastos con soporte para comprobantes digitales.
- **Categorización Inteligente**: Organización automática de gastos por categorías y centros de costo.
- **Flujo de Aprobación**: Sistema configurable de aprobaciones para diferentes niveles y montos.
- **Reportes y Análisis**: Informes detallados y visualizaciones para análisis de gastos.
- **Gestión de Comprobantes**: Almacenamiento y validación de recibos y facturas digitales.
- **Perfil de Usuario**: Gestión de información personal, historial de gastos y preferencias.
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
