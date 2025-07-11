const db = require('./app/models');
const path = require('path');
const fs = require('fs');

// Importar la configuración de uploads
const { UPLOADS_DIR } = require('./app/middleware/uploadFiles');

async function fixFilePaths() {
  try {
    console.log('🔧 Iniciando corrección de rutas de archivos...');
    console.log(`📁 Directorio de uploads: ${UPLOADS_DIR}`);
    
    // 1. Obtener todos los proyectos
    const projects = await db.proyectos.findAll();
    console.log(`📋 Total de proyectos encontrados: ${projects.length}`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const project of projects) {
      console.log(`\n🔍 Procesando proyecto ID ${project.id}: "${project.name}"`);
      
      let needsUpdate = false;
      const updateData = {};
      
      // Verificar y corregir cada tipo de archivo
      const fileFields = [
        { field: 'technicalSheet', name: 'Ficha Técnica' },
        { field: 'canvaModel', name: 'Modelo Canvas' },
        { field: 'projectPdf', name: 'PDF Proyecto' }
      ];
      
      for (const fileField of fileFields) {
        const currentPath = project[fileField.field];
        
        if (currentPath) {
          console.log(`  📄 ${fileField.name}: ${currentPath}`);
          
          // Verificar si la ruta actual es válida
          let isValidPath = false;
          let correctedPath = null;
          
          // Opción 1: Verificar si la ruta absoluta existe
          if (path.isAbsolute(currentPath) && fs.existsSync(currentPath)) {
            isValidPath = true;
            console.log(`    ✅ Ruta absoluta válida`);
          }
          // Opción 2: Verificar si existe en el directorio de uploads
          else {
            const fileName = path.basename(currentPath);
            const uploadsPath = path.join(UPLOADS_DIR, fileName);
            
            if (fs.existsSync(uploadsPath)) {
              isValidPath = true;
              correctedPath = uploadsPath;
              console.log(`    ✅ Archivo encontrado en uploads: ${fileName}`);
            } else {
              console.log(`    ❌ Archivo no encontrado: ${fileName}`);
              
              // Buscar archivos similares en el directorio de uploads
              try {
                const files = fs.readdirSync(UPLOADS_DIR);
                const similarFiles = files.filter(file => 
                  file.includes(fileField.field.toLowerCase()) || 
                  file.includes(project.name.toLowerCase())
                );
                
                if (similarFiles.length > 0) {
                  console.log(`    🔍 Archivos similares encontrados:`, similarFiles);
                  // Usar el primer archivo similar encontrado
                  correctedPath = path.join(UPLOADS_DIR, similarFiles[0]);
                  console.log(`    ✅ Usando archivo similar: ${similarFiles[0]}`);
                }
              } catch (error) {
                console.log(`    ❌ Error listando archivos: ${error.message}`);
              }
            }
          }
          
          // Si la ruta no es válida pero tenemos una corrección
          if (!isValidPath && correctedPath) {
            updateData[fileField.field] = correctedPath;
            needsUpdate = true;
            console.log(`    🔧 Corrigiendo ruta a: ${correctedPath}`);
          }
          // Si la ruta no es válida y no hay corrección
          else if (!isValidPath) {
            console.log(`    ⚠️  No se pudo corregir la ruta para ${fileField.name}`);
            errorCount++;
          }
        } else {
          console.log(`  📄 ${fileField.name}: No configurado`);
        }
      }
      
      // Actualizar el proyecto si es necesario
      if (needsUpdate) {
        try {
          await project.update(updateData);
          updatedCount++;
          console.log(`  ✅ Proyecto actualizado`);
        } catch (error) {
          console.error(`  ❌ Error actualizando proyecto: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`  ✅ Proyecto no necesita actualización`);
      }
    }
    
    console.log('\n🎯 Resumen de correcciones:');
    console.log(`- Proyectos procesados: ${projects.length}`);
    console.log(`- Proyectos actualizados: ${updatedCount}`);
    console.log(`- Errores encontrados: ${errorCount}`);
    
    // Verificar archivos en el directorio de uploads
    console.log('\n📁 Archivos en el directorio de uploads:');
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      files.forEach(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        console.log(`  📄 ${file} (${stats.size} bytes)`);
      });
    } catch (error) {
      console.error(`❌ Error listando archivos: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error en la corrección de rutas:', error);
  } finally {
    process.exit(0);
  }
}

fixFilePaths(); 