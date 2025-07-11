// copy-old-files.js
const fs = require('fs');
const path = require('path');
const { UPLOADS_DIR } = require('./app/middleware/uploadFiles');

async function copyOldFiles() {
  try {
    console.log('📋 Copiando archivos del directorio antiguo...');
    
    const oldUploadsDir = '/opt/render/project/src/uploads';
    console.log(`📁 Directorio antiguo: ${oldUploadsDir}`);
    console.log(`📁 Directorio nuevo: ${UPLOADS_DIR}`);
    
    // Verificar si el directorio antiguo existe
    if (!fs.existsSync(oldUploadsDir)) {
      console.log(`❌ Directorio antiguo no existe: ${oldUploadsDir}`);
      return;
    }
    
    // Crear el directorio nuevo si no existe
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      console.log(`✅ Directorio nuevo creado: ${UPLOADS_DIR}`);
    }
    
    // Listar archivos en el directorio antiguo
    const oldFiles = fs.readdirSync(oldUploadsDir);
    console.log(`📄 Archivos en directorio antiguo: ${oldFiles.length}`);
    
    if (oldFiles.length === 0) {
      console.log('📭 No hay archivos para copiar');
      return;
    }
    
    let copiedCount = 0;
    
    for (const file of oldFiles) {
      const oldPath = path.join(oldUploadsDir, file);
      const newPath = path.join(UPLOADS_DIR, file);
      
      console.log(`\n📄 Procesando: ${file}`);
      
      // Verificar si el archivo ya existe en el nuevo directorio
      if (fs.existsSync(newPath)) {
        console.log(`  ⚠️ Archivo ya existe en nuevo directorio: ${file}`);
        continue;
      }
      
      try {
        // Copiar el archivo
        fs.copyFileSync(oldPath, newPath);
        console.log(`  ✅ Archivo copiado: ${file}`);
        copiedCount++;
        
        // Verificar que se copió correctamente
        const oldStats = fs.statSync(oldPath);
        const newStats = fs.statSync(newPath);
        
        if (oldStats.size === newStats.size) {
          console.log(`  📊 Tamaño verificado: ${newStats.size} bytes`);
        } else {
          console.log(`  ❌ Error: tamaños diferentes (${oldStats.size} vs ${newStats.size})`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error copiando ${file}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Proceso completado. ${copiedCount} archivos copiados.`);
    
    // Mostrar archivos en el nuevo directorio
    const newFiles = fs.readdirSync(UPLOADS_DIR);
    console.log(`\n📄 Archivos en directorio nuevo: ${newFiles.length}`);
    newFiles.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    });
    
  } catch (error) {
    console.error('❌ Error en copy:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

copyOldFiles(); 