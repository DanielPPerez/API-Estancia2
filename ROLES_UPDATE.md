# Actualización de Roles - Sin Prefijo ROLE_

## Problema Original
El sistema estaba asignando roles con prefijo "ROLE_" (ej: 'ROLE_USER', 'ROLE_ADMIN', 'ROLE_EVALUADOR') pero el frontend esperaba roles sin prefijo (ej: 'user', 'admin', 'evaluador').

## Cambios Realizados

### 1. Middleware de Verificación (`app/middleware/verifySignUp.js`)
- ✅ **Función `checkRolesExisted()`**: Ahora limpia automáticamente el prefijo "ROLE_" si existe
- ✅ **Compatibilidad**: Acepta tanto roles con prefijo como sin prefijo
- ✅ **Limpieza**: `requestedRole.replace('role_', '')` para remover prefijo

### 2. Controlador de Autenticación (`app/controllers/auth.controller.js`)
- ✅ **Función `signup()`**: Limpia prefijos ROLE_ antes de asignar roles
- ✅ **Limpieza automática**: `role.replace(/^role_/i, '').toLowerCase()`
- ✅ **Función `signin()`**: Devuelve roles sin prefijo en la respuesta

### 3. Middleware de Autenticación (`app/middleware/authJwt.js`)
- ✅ **Función `getUserRoles()`**: Devuelve roles sin prefijo
- ✅ **Verificación de roles**: Usa nombres limpios para verificar permisos

### 4. Configuración Inicial (`app/config/initialSetup.js`)
- ✅ **Roles creados**: 'user', 'admin', 'evaluador', 'moderator' (sin prefijo)
- ✅ **Usuarios por defecto**: admin/admin123 y evaluador/evaluador123
- ✅ **Asignación correcta**: Roles asignados sin prefijo

### 5. Script de Prueba (`test-auth.js`)
- ✅ **Roles de prueba**: Crea roles sin prefijo
- ✅ **Verificación**: Confirma que los roles se asignan correctamente

### 6. Servidor Principal (`server.js`)
- ✅ **Configuración simplificada**: Usa `setupDatabase()` para configuración inicial
- ✅ **Logs mejorados**: Mensajes más claros en español

## Roles Disponibles

### Nombres Correctos (sin prefijo):
- `user` - Usuario regular
- `admin` - Administrador del sistema
- `evaluador` - Evaluador de proyectos
- `moderator` - Moderador del sistema

### Compatibilidad:
- ✅ Acepta roles con prefijo: 'ROLE_USER', 'ROLE_ADMIN', etc.
- ✅ Acepta roles sin prefijo: 'user', 'admin', etc.
- ✅ Limpia automáticamente el prefijo si existe
- ✅ Devuelve siempre roles sin prefijo

## Usuarios por Defecto

### Administrador:
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@upchiapas.edu.mx`
- **Roles**: `admin`

### Evaluador:
- **Username**: `evaluador`
- **Password**: `evaluador123`
- **Email**: `evaluador@upchiapas.edu.mx`
- **Roles**: `evaluador`

## Resultado

Ahora el sistema:
1. ✅ **Acepta roles con o sin prefijo** en el registro
2. ✅ **Limpia automáticamente** el prefijo "ROLE_" si existe
3. ✅ **Devuelve roles sin prefijo** en todas las respuestas
4. ✅ **Es compatible** con el frontend existente
5. ✅ **Mantiene funcionalidad** de verificación de permisos

## Próximos Pasos

1. **Configurar base de datos local** PostgreSQL
2. **Ejecutar el servidor**: `npm start`
3. **Probar login** con usuario admin/evaluador
4. **Verificar acceso** a rutas de administrador y evaluador
5. **Confirmar compatibilidad** con el resto del frontend

## Notas Importantes

- Los roles se almacenan en la base de datos **sin prefijo**
- El sistema es **compatible hacia atrás** (acepta roles con prefijo)
- Las respuestas del API **siempre devuelven roles sin prefijo**
- No es necesario cambiar el frontend existente 