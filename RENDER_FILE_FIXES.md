# 🔧 Correcciones para Render - Manejo de Archivos

## 📋 **Problema Principal**

En Render, el sistema de archivos es **efímero**, lo que significa que:
- Los archivos se pierden cuando el servidor se reinicia
- Las rutas relativas no funcionan correctamente
- Necesitamos usar rutas absolutas y directorios persistentes

## 🔧 **Correcciones Implementadas**

### **1. Middleware de Upload Mejorado (`uploadFiles.js`)**
```javascript
// Configuración para Render
let UPLOADS_DIR;
if (process.env.NODE_ENV === 'production') {
  // En producción (Render), usar /tmp que es persistente
  UPLOADS_DIR = "/tmp/uploads";
} else {
  // En desarrollo, usar la carpeta local
  UPLOADS_DIR = path.join(process.cwd(), "uploads");
}
```

**Mejoras:**
- ✅ Usa `/tmp/uploads` en producción (Render)
- ✅ Usa `uploads/` local en desarrollo
- ✅ Fallback al directorio temporal del sistema
- ✅ Logging detallado del proceso de upload
- ✅ Verificación de archivos después de la subida

### **2. Controlador de Descarga Mejorado (`project.controller.js`)**
```javascript
// Manejo de rutas absolutas y relativas
let absolutePath = filePath;
if (!path.isAbsolute(filePath)) {
  absolutePath = path.join(UPLOADS_DIR, path.basename(filePath));
}
```

**Mejoras:**
- ✅ Manejo de rutas absolutas y relativas
- ✅ Logging detallado de rutas de archivos
- ✅ Listado de archivos disponibles para debugging
- ✅ Mensajes de error más específicos

### **3. Scripts de Corrección Creados**

#### **`fix-project-files.js`**
- Verifica proyectos existentes
- Corrige rutas de archivos
- Busca archivos similares si no encuentra el original
- Actualiza la base de datos automáticamente

#### **`test-upload-project.js`**
- Prueba la subida completa de un proyecto
- Crea archivos PDF de prueba
- Simula la petición HTTP real
- Verifica que todo funcione correctamente

## 🚀 **Pasos para Solucionar**

### **Paso 1: Ejecutar Corrección de Archivos**
```bash
cd apiJWTestancia1
node fix-project-files.js
```

Este script:
- ✅ Verifica todos los proyectos existentes
- ✅ Busca archivos que faltan
- ✅ Corrige rutas automáticamente
- ✅ Actualiza la base de datos

### **Paso 2: Probar Subida de Proyecto**
```bash
cd apiJWTestancia1
node test-upload-project.js
```

Este script:
- ✅ Crea archivos PDF de prueba
- ✅ Simula subida completa de proyecto
- ✅ Verifica que los archivos se guarden
- ✅ Prueba la funcionalidad end-to-end

### **Paso 3: Verificar Logs del Servidor**
Los logs ahora incluyen:
- 📁 Directorio de uploads usado
- 📄 Archivos recibidos y guardados
- 📊 Tamaño de archivos
- ❌ Errores específicos si ocurren

## 🔍 **Diagnóstico de Problemas**

### **Si los archivos no se guardan:**
1. **Problema**: Directorio no tiene permisos de escritura
2. **Solución**: Usar `/tmp/uploads` en Render
3. **Verificación**: Revisar logs de upload

### **Si las rutas están mal:**
1. **Problema**: Rutas relativas vs absolutas
2. **Solución**: Usar rutas absolutas en producción
3. **Verificación**: Ejecutar `fix-project-files.js`

### **Si los archivos se pierden:**
1. **Problema**: Sistema de archivos efímero en Render
2. **Solución**: Usar `/tmp` que es persistente
3. **Verificación**: Verificar que los archivos persistan

## 📝 **Comandos de Verificación**

### **1. Verificar estado actual:**
```bash
node debug-project-files.js
```

### **2. Corregir archivos existentes:**
```bash
node fix-project-files.js
```

### **3. Probar subida completa:**
```bash
node test-upload-project.js
```

### **4. Verificar directorio de uploads:**
```bash
ls -la /tmp/uploads/  # En Render
ls -la uploads/       # En desarrollo
```

## 🎯 **Resultado Esperado**

Después de las correcciones:
- ✅ Los archivos se guardan en `/tmp/uploads` en Render
- ✅ Las rutas se almacenan como absolutas
- ✅ Los archivos persisten entre reinicios
- ✅ La descarga funciona correctamente
- ✅ Logging detallado para debugging

## ⚠️ **Consideraciones para Render**

### **1. Sistema de Archivos:**
- Usar `/tmp` que es persistente en Render
- Evitar rutas relativas en producción
- Verificar permisos de escritura

### **2. Reinicios del Servidor:**
- Los archivos en `/tmp` persisten
- Los archivos en otros directorios se pierden
- Considerar almacenamiento en la nube para producción

### **3. Logs de Debugging:**
- Los logs ahora muestran rutas exactas
- Incluyen información de archivos
- Facilitan el diagnóstico de problemas

## 📋 **Checklist de Verificación**

- [ ] Ejecutar `fix-project-files.js`
- [ ] Verificar que los archivos existan en `/tmp/uploads`
- [ ] Probar subida con `test-upload-project.js`
- [ ] Verificar descarga desde el frontend
- [ ] Revisar logs del servidor
- [ ] Confirmar que todo funcione correctamente

## 🔧 **Próximos Pasos**

1. **Ejecutar corrección** con `fix-project-files.js`
2. **Probar subida** con `test-upload-project.js`
3. **Verificar descarga** desde el frontend
4. **Revisar logs** para confirmar funcionamiento
5. **Documentar** cualquier problema restante 