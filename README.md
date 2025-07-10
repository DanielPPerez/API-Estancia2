# API Estancia II - PostgreSQL Version

Esta es la versión migrada a PostgreSQL para desplegar correctamente en Render.

## Cambios Principales

### 1. Migración a PostgreSQL
- Todos los controladores ahora usan Sequelize ORM en lugar de consultas SQL directas
- Configuración específica para PostgreSQL
- Manejo correcto de secuencias de IDs
- Soporte para SSL en producción

### 2. Modelos Actualizados
- Todos los modelos tienen `autoIncrement: true` para PostgreSQL
- Timestamps automáticos (`createdAt`, `updatedAt`)
- Asociaciones correctas entre modelos
- Validaciones mejoradas

### 3. Controladores Migrados
- `auth.controller.js` - Usa Sequelize para autenticación
- `user.controller.js` - CRUD de usuarios con Sequelize
- `role.controller.js` - Gestión de roles con Sequelize
- `project.controller.js` - Gestión de proyectos con Sequelize
- `calificaciones.controller.js` - Sistema de calificaciones con Sequelize

## Configuración para Render

### Variables de Entorno Requeridas

En Render, configura estas variables de entorno:

```
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/nombre_db
JWT_SECRET=tu_secreto_jwt_muy_seguro
JWT_REFRESH_SECRET=tu_secreto_refresh_jwt_muy_seguro
NODE_ENV=production
```

### Configuración de Base de Datos

1. Crea una base de datos PostgreSQL en Render
2. Copia la URL de conexión que te proporciona Render
3. Configura la variable `DATABASE_URL` con esa URL

### Configuración del Servidor

1. **Build Command**: `npm install`
2. **Start Command**: `node server.js`
3. **Environment**: Node.js

## Instalación Local

### Prerrequisitos
- Node.js (versión 14 o superior)
- PostgreSQL local o remoto

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd apiJWTestancia1
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crea un archivo `.env` en la raíz del proyecto:
```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=api_estancia_dev
JWT_SECRET=tu_secreto_jwt
JWT_REFRESH_SECRET=tu_secreto_refresh_jwt
NODE_ENV=development
```

4. **Crear la base de datos**
```sql
CREATE DATABASE api_estancia_dev;
```

5. **Ejecutar el servidor**
```bash
npm start
```

El servidor automáticamente:
- Sincronizará la base de datos
- Creará las tablas necesarias
- Insertará los roles básicos
- Creará los usuarios iniciales

## Estructura de la Base de Datos

### Tablas Principales
- `users` - Usuarios del sistema
- `roles` - Roles disponibles (user, admin, evaluador, moderator)
- `user_roles` - Relación muchos a muchos entre usuarios y roles
- `projects` - Proyectos de los estudiantes
- `calificaciones` - Calificaciones de los proyectos
- `refresh_tokens` - Tokens de refresco para JWT

### Relaciones
- Un usuario puede tener múltiples roles
- Un usuario puede tener múltiples proyectos
- Un proyecto puede tener múltiples calificaciones
- Cada calificación tiene un evaluador y un alumno

## API Endpoints

### Autenticación
- `POST /api/auth/signup` - Registro de usuarios
- `POST /api/auth/signin` - Inicio de sesión
- `POST /api/auth/refreshtoken` - Refrescar token

### Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Roles
- `GET /api/roles` - Obtener todos los roles
- `POST /api/roles` - Crear rol
- `PUT /api/roles/:id` - Actualizar rol
- `DELETE /api/roles/:id` - Eliminar rol

### Proyectos
- `GET /api/projects` - Obtener todos los proyectos
- `GET /api/projects/:id` - Obtener proyecto por ID
- `POST /api/projects` - Crear proyecto
- `PUT /api/projects/:id` - Actualizar proyecto
- `DELETE /api/projects/:id` - Eliminar proyecto

### Calificaciones
- `GET /api/calificaciones` - Obtener todas las calificaciones
- `POST /api/calificaciones` - Crear calificación
- `PUT /api/calificaciones/:id` - Actualizar calificación
- `DELETE /api/calificaciones/:id` - Eliminar calificación

## Solución de Problemas

### Error: "null value in column 'id' violates not-null constraint"
Este error se solucionó agregando `autoIncrement: true` a todos los modelos.

### Error: "relation does not exist"
La base de datos se sincroniza automáticamente al iniciar el servidor.

### Error de SSL en producción
La configuración incluye `rejectUnauthorized: false` para evitar errores de certificados.

## Notas Importantes

1. **Migración Automática**: El servidor sincroniza automáticamente la base de datos al iniciar
2. **Datos Iniciales**: Se crean automáticamente roles y usuarios iniciales
3. **SSL**: Configurado para funcionar con Render y otros servicios en la nube
4. **Pool de Conexiones**: Optimizado para PostgreSQL

## Soporte

Si encuentras problemas:
1. Verifica que las variables de entorno estén configuradas correctamente
2. Asegúrate de que la base de datos PostgreSQL esté accesible
3. Revisa los logs del servidor para errores específicos
