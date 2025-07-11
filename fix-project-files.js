// fix-project-files.js
const db = require('./app/models');
const fs = require('fs');
const path = require('path');
const { UPLOADS_DIR } = require('./app/middleware/uploadFiles');

async function fixProjectFiles() {
  try {
    console.log('🔧 Verificando y corrigiendo archivos de proyectos...');
    console.log(`📁 Upload directory: ${UPLOADS_DIR}`);
    
    // Verificar que el directorio existe
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log(`❌ Directorio de uploads no existe: ${UPLOADS_DIR}`);
      return;
    }
    
    // Listar archivos disponibles
    const files = fs.readdirSync(UPLOADS_DIR);
    console.log(`📄 Archivos disponibles: ${files.length}`);
    files.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    });
    
    // Obtener todos los proyectos
    const projects = await db.proyectos.findAll({
      attributes: ['id', 'name', 'technicalSheet', 'canvaModel', 'projectPdf'],
      order: [['id', 'ASC']]
    });
    
    console.log(`\n📋 Proyectos en la base de datos: ${projects.length}`);
    
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
          // Verificar si el archivo existe
          let absolutePath = currentPath;
          if (!path.isAbsolute(currentPath)) {
            absolutePath = path.join(UPLOADS_DIR, path.basename(currentPath));
          }
          
          if (fs.existsSync(absolutePath)) {
            console.log(`    ✅ Archivo existe: ${absolutePath}`);
          } else {
            console.log(`    ❌ Archivo no existe: ${absolutePath}`);
            
            // Buscar archivos que coincidan con el patrón
            const fileName = path.basename(currentPath);
            const matchingFiles = files.filter(file => 
              file.includes(field.name.replace('Sheet', 'Tecnica').replace('Model', 'Canva').replace('Pdf', 'Proyecto'))
            );
            
            if (matchingFiles.length > 0) {
              console.log(`    🔍 Archivos similares encontrados:`, matchingFiles);
              
              // Usar el primer archivo que coincida
              const newPath = path.join(UPLOADS_DIR, matchingFiles[0]);
              console.log(`    🔧 Actualizando ruta a: ${newPath}`);
              
              try {
                await project.update({ [field.dbField]: newPath });
                console.log(`    ✅ Ruta actualizada en la base de datos`);
                fixedCount++;
              } catch (error) {
                console.log(`    ❌ Error actualizando BD: ${error.message}`);
              }
            } else {
              console.log(`    ❌ No se encontraron archivos similares`);
            }
          }
        }
      }
    }
    
    console.log(`\n🎉 Proceso completado. ${fixedCount} rutas corregidas.`);
    
    // Mostrar resumen final
    console.log('\n📊 Resumen final:');
    const finalProjects = await db.proyectos.findAll({
      attributes: ['id', 'name', 'technicalSheet', 'canvaModel', 'projectPdf'],
      order: [['id', 'ASC']]
    });
    
    finalProjects.forEach(project => {
      console.log(`\n📁 Proyecto ${project.id}: "${project.name}"`);
      console.log(`  Ficha técnica: ${project.technicalSheet ? '✅' : '❌'}`);
      console.log(`  Modelo Canva: ${project.canvaModel ? '✅' : '❌'}`);
      console.log(`  PDF Proyecto: ${project.projectPdf ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Error en fix:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

fixProjectFiles(); 