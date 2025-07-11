// fix-all-files.js
const db = require('./app/models');
const fs = require('fs');
const path = require('path');
const { UPLOADS_DIR } = require('./app/middleware/uploadFiles');

async function fixAllFiles() {
  try {
    console.log('🔧 Solucionando problemas de archivos...');
    console.log(`📁 Upload directory actual: ${UPLOADS_DIR}`);
    
    // PASO 1: Copiar archivos del directorio antiguo
    console.log('\n📋 PASO 1: Copiando archivos del directorio antiguo...');
    
    const oldUploadsDir = '/opt/render/project/src/uploads';
    console.log(`📁 Directorio antiguo: ${oldUploadsDir}`);
    
    if (fs.existsSync(oldUploadsDir)) {
      // Crear el directorio nuevo si no existe
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        console.log(`✅ Directorio nuevo creado: ${UPLOADS_DIR}`);
      }
      
      // Listar archivos en el directorio antiguo
      const oldFiles = fs.readdirSync(oldUploadsDir);
      console.log(`📄 Archivos en directorio antiguo: ${oldFiles.length}`);
      
      let copiedCount = 0;
      
      for (const file of oldFiles) {
        const oldPath = path.join(oldUploadsDir, file);
        const newPath = path.join(UPLOADS_DIR, file);
        
        // Verificar si el archivo ya existe en el nuevo directorio
        if (fs.existsSync(newPath)) {
          console.log(`  ⚠️ Archivo ya existe: ${file}`);
          continue;
        }
        
        try {
          // Copiar el archivo
          fs.copyFileSync(oldPath, newPath);
          console.log(`  ✅ Archivo copiado: ${file}`);
          copiedCount++;
        } catch (error) {
          console.log(`  ❌ Error copiando ${file}: ${error.message}`);
        }
      }
      
      console.log(`📊 ${copiedCount} archivos copiados del directorio antiguo.`);
    } else {
      console.log(`❌ Directorio antiguo no existe: ${oldUploadsDir}`);
    }
    
    // PASO 2: Corregir rutas en la base de datos
    console.log('\n📋 PASO 2: Corrigiendo rutas en la base de datos...');
    
    const projects = await db.proyectos.findAll({
      attributes: ['id', 'name', 'technicalSheet', 'canvaModel', 'projectPdf'],
      order: [['id', 'ASC']]
    });
    
    console.log(`📋 Proyectos encontrados: ${projects.length}`);
    
    let fixedCount = 0;
    
    for (const project of projects) {
      console.log(`\n🔍 Proyecto ${project.id}: "${project.name}"`);
      
      const fields = [
        { name: 'technicalSheet', dbField: 'technicalSheet' },
        { name: 'canvaModel', dbField: 'canvaModel' },
        { name: 'projectPdf', dbField: 'projectPdf' }
      ];
      
      for (const field of fields) {
        const currentPath = project[field.dbField];
        console.log(`  📁 ${field.name}: ${currentPath || 'No configurado'}`);
        
        if (currentPath) {
          // Verificar si la ruta apunta al directorio antiguo
          if (currentPath.includes('/opt/render/project/src/uploads/')) {
            console.log(`    ❌ Ruta antigua detectada: ${currentPath}`);
            
            // Extraer solo el nombre del archivo
            const fileName = path.basename(currentPath);
            const newPath = path.join(UPLOADS_DIR, fileName);
            
            console.log(`    🔧 Nueva ruta: ${newPath}`);
            
            // Verificar si el archivo existe en el nuevo directorio
            if (fs.existsSync(newPath)) {
              console.log(`    ✅ Archivo encontrado en nueva ubicación`);
              
              try {
                await project.update({ [field.dbField]: newPath });
                console.log(`    ✅ Ruta actualizada en la base de datos`);
                fixedCount++;
              } catch (error) {
                console.log(`    ❌ Error actualizando BD: ${error.message}`);
              }
            } else {
              console.log(`    ❌ Archivo no encontrado en nueva ubicación`);
              
              // Buscar archivos similares en el directorio actual
              try {
                const files = fs.readdirSync(UPLOADS_DIR);
                const matchingFiles = files.filter(file => 
                  file.includes(field.name.replace('Sheet', 'Tecnica').replace('Model', 'Canva').replace('Pdf', 'Proyecto'))
                );
                
                if (matchingFiles.length > 0) {
                  console.log(`    🔍 Archivos similares encontrados:`, matchingFiles);
                  
                  // Usar el primer archivo que coincida
                  const bestMatch = matchingFiles[0];
                  const newPath = path.join(UPLOADS_DIR, bestMatch);
                  
                  console.log(`    🔧 Usando archivo similar: ${bestMatch}`);
                  
                  try {
                    await project.update({ [field.dbField]: newPath });
                    console.log(`    ✅ Ruta actualizada con archivo similar`);
                    fixedCount++;
                  } catch (error) {
                    console.log(`    ❌ Error actualizando BD: ${error.message}`);
                  }
                } else {
                  console.log(`    ❌ No se encontraron archivos similares`);
                }
              } catch (error) {
                console.log(`    ❌ Error listando archivos: ${error.message}`);
              }
            }
          } else if (currentPath.includes('/tmp/uploads/')) {
            console.log(`    ✅ Ruta ya está correcta`);
          } else {
            console.log(`    ⚠️ Ruta no reconocida: ${currentPath}`);
          }
        }
      }
    }
    
    console.log(`\n🎉 Proceso completado. ${fixedCount} rutas corregidas.`);
    
    // PASO 3: Mostrar resumen final
    console.log('\n📊 RESUMEN FINAL:');
    const finalProjects = await db.proyectos.findAll({
      attributes: ['id', 'name', 'technicalSheet', 'canvaModel', 'projectPdf'],
      order: [['id', 'ASC']]
    });
    
    finalProjects.forEach(project => {
      console.log(`\n📁 Proyecto ${project.id}: "${project.name}"`);
      console.log(`  Ficha técnica: ${project.technicalSheet ? '✅' : '❌'}`);
      console.log(`  Modelo Canva: ${project.canvaModel ? '✅' : '❌'}`);
      console.log(`  PDF Proyecto: ${project.projectPdf ? '✅' : '❌'}`);
      
      if (project.technicalSheet) {
        const exists = fs.existsSync(project.technicalSheet);
        console.log(`    📄 Ficha técnica existe: ${exists ? '✅' : '❌'}`);
      }
      if (project.canvaModel) {
        const exists = fs.existsSync(project.canvaModel);
        console.log(`    📄 Modelo Canva existe: ${exists ? '✅' : '❌'}`);
      }
      if (project.projectPdf) {
        const exists = fs.existsSync(project.projectPdf);
        console.log(`    📄 PDF Proyecto existe: ${exists ? '✅' : '❌'}`);
      }
    });
    
    // Mostrar archivos disponibles
    const availableFiles = fs.readdirSync(UPLOADS_DIR);
    console.log(`\n📄 Archivos disponibles en ${UPLOADS_DIR}: ${availableFiles.length}`);
    availableFiles.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    });
    
  } catch (error) {
    console.error('❌ Error en fix:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

fixAllFiles(); 