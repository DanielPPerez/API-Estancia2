# Resumen de Migración a PostgreSQL

## Problema Original
Después de implementar los cambios para migrar de MySQL a PostgreSQL, el usuario no podía acceder a las rutas de administrador debido a que los middlewares no estaban actualizados para usar Sequelize en lugar de consultas SQL directas.

## Cambios Realizados

### 1. Middleware de Autenticación (`app/middleware/authJwt.js`)
- **Problema**: Usaba consultas SQL directas con `pool.query()`
- **Solución**: Actualizado para usar Sequelize con `db.user.findByPk()` y includes
- **Cambios**:
  - Reemplazado `const pool = require("../config/db.config")` por `const db = require("../models")`
  - Función `getUserRoles()` ahora usa Sequelize en lugar de SQL directo
  - Agregado middleware `isEvaluadorOrAdmin` para permitir acceso a evaluadores y admins

### 2. Middleware de Verificación de Signup (`app/middleware/verifySignUp.js`)
- **Problema**: Usaba array estático `ROLES` en lugar de consultar la base de datos
- **Solución**: Actualizado para consultar roles dinámicamente con Sequelize
- **Cambios**:
  - Función `checkRolesExisted()` ahora es async y consulta la base de datos
  - Usa `db.role.findAll()` para obtener roles disponibles

### 3. Controlador de Autenticación (`app/controllers/auth.controller.js`)
- **Problema**: Devuelve roles con prefijo "ROLE_" que no es compatible con el frontend
- **Solución**: Devuelve nombres de roles sin prefijo
- **Cambios**:
  - Cambiado `authorities` por `roleNames` en la respuesta de login
  - Eliminado el prefijo "ROLE_" de los nombres de roles

### 4. Rutas de Usuarios (`app/routes/user.routes.js`)
- **Problema**: Faltaban rutas para manejo de roles
- **Solución**: Agregadas rutas para asignar/remover roles y obtener roles de usuario
- **Cambios**:
  - Agregadas rutas `/api/users/assign-role`, `/api/users/:userId/roles/:roleId`, `/api/users/:userId/roles`

### 5. Rutas de Calificaciones (`app/routes/calificaciones.routes.js`)
- **Problema**: Usaba middleware `isModeratorOrAdmin` en lugar de `isEvaluadorOrAdmin`
- **Solución**: Actualizado para usar el middleware correcto
- **Cambios**:
  - Cambiado `isModeratorOrAdmin` por `isEvaluadorOrAdmin` en todas las rutas relevantes

### 6. Controlador de Usuarios (`app/controllers/user.controller.js`)
- **Problema**: Faltaban funciones para manejo de roles
- **Solución**: Agregadas funciones para asignar, remover y obtener roles
- **Cambios**:
  - Agregadas funciones `assignRoleToUser()`, `removeRoleFromUser()`, `getUserRoles()`

### 7. AuthProvider del Frontend (`FrontEstancia-II/src/AuthProvider.jsx`)
- **Problema**: Hacía llamada adicional a `getUserRoles()` después del login
- **Solución**: Simplificado para usar directamente los roles del backend
- **Cambios**:
  - Eliminada llamada adicional a `apiService.getUserRoles()`
  - Usa directamente `authResult.roles` del backend

### 8. Configuración de Base de Datos (`app/config/db.config.js`)
- **Problema**: No manejaba correctamente las URLs de conexión de PostgreSQL
- **Solución**: Agregada función para parsear URLs de conexión
- **Cambios**:
  - Función `parseDatabaseUrl()` para manejar URLs de conexión
  - Configuración local y de producción separadas

### 9. Archivo de Modelos (`app/models/index.js`)
- **Problema**: Configuración hardcodeada para producción
- **Solución**: Configuración dinámica basada en entorno
- **Cambios**:
  - Carga automática de modelos
  - Configuración separada para desarrollo y producción

## Nuevos Middlewares Agregados

### `isEvaluadorOrAdmin`
- Permite acceso a usuarios con rol 'evaluador' o 'admin'
- Usado en rutas de calificaciones para permitir acceso a ambos tipos de usuario

## Funciones de Controlador Agregadas

### En `user.controller.js`:
- `assignRoleToUser()`: Asigna un rol a un usuario
- `removeRoleFromUser()`: Remueve un rol de un usuario
- `getUserRoles()`: Obtiene los roles de un usuario

## Configuración de Desarrollo

### Archivo `config-local.js`
- Configuración local para desarrollo
- SSL deshabilitado para desarrollo local
- Credenciales configurables

## Resultado

Después de estos cambios:
1. ✅ Los middlewares usan Sequelize en lugar de SQL directo
2. ✅ Los roles se devuelven sin prefijo "ROLE_"
3. ✅ Los administradores pueden acceder a todas las rutas
4. ✅ Los evaluadores pueden acceder a las rutas de calificaciones
5. ✅ La configuración funciona tanto en desarrollo como en producción

## Próximos Pasos

1. Configurar la base de datos local PostgreSQL
2. Ejecutar `npm start` para probar la aplicación
3. Verificar que el login funcione correctamente
4. Probar acceso a rutas de administrador y evaluador 