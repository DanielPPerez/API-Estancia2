const db = require('./app/models');
const path = require('path');
const fs = require('fs');

// Importar la configuración de uploads
const { UPLOADS_DIR } = require('./app/middleware/uploadFiles');

async function fixAndTestDownloads() {
  try {
    console.log('🔧 Iniciando corrección y prueba de descargas...');
    console.log(`📁 Directorio de uploads: ${UPLOADS_DIR}`);
    
    // PASO 1: Corregir rutas de archivos
    console.log('\n📋 PASO 1: Corrigiendo rutas de archivos...');
    
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
    
    // PASO 2: Probar descargas
    console.log('\n📋 PASO 2: Probando descargas...');
    
    // Verificar archivos en el directorio de uploads
    console.log('\n📁 Archivos en el directorio de uploads:');
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      if (files.length === 0) {
        console.log('  ⚠️  No hay archivos en el directorio de uploads');
      } else {
        files.forEach(file => {
          const filePath = path.join(UPLOADS_DIR, file);
          const stats = fs.statSync(filePath);
          console.log(`  📄 ${file} (${stats.size} bytes)`);
        });
      }
    } catch (error) {
      console.error(`❌ Error listando archivos: ${error.message}`);
    }
    
    // Obtener proyectos con archivos para prueba
    const projectsWithFiles = await db.proyectos.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { technicalSheet: { [db.Sequelize.Op.ne]: null } },
          { canvaModel: { [db.Sequelize.Op.ne]: null } },
          { projectPdf: { [db.Sequelize.Op.ne]: null } }
        ]
      },
      limit: 3
    });
    
    console.log(`\n📋 Proyectos con archivos para prueba: ${projectsWithFiles.length}`);
    
    for (const project of projectsWithFiles) {
      console.log(`\n🔍 Proyecto ID ${project.id}: "${project.name}"`);
      
      const fileTypes = [
        { field: 'technicalSheet', name: 'Ficha Técnica', type: 'technicalSheet' },
        { field: 'canvaModel', name: 'Modelo Canvas', type: 'canvaModel' },
        { field: 'projectPdf', name: 'PDF Proyecto', type: 'projectPdf' }
      ];
      
      for (const fileType of fileTypes) {
        const filePath = project[fileType.field];
        
        if (filePath) {
          console.log(`  📄 ${fileType.name}: ${filePath}`);
          
          // Simular la lógica de búsqueda del controlador
          let foundPath = null;
          
          // Opción 1: Ruta absoluta
          if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
            foundPath = filePath;
            console.log(`    ✅ Encontrado en ruta absoluta`);
          }
          // Opción 2: Buscar por nombre en uploads
          else {
            const fileName = path.basename(filePath);
            const uploadsPath = path.join(UPLOADS_DIR, fileName);
            
            if (fs.existsSync(uploadsPath)) {
              foundPath = uploadsPath;
              console.log(`    ✅ Encontrado en uploads: ${fileName}`);
            } else {
              console.log(`    ❌ No encontrado: ${fileName}`);
              
              // Opción 3: Buscar archivos similares
              try {
                const files = fs.readdirSync(UPLOADS_DIR);
                const patterns = {
                  'technicalSheet': ['ficha', 'technical', 'sheet'],
                  'canvaModel': ['canva', 'canvas', 'model'],
                  'projectPdf': ['proyecto', 'project', 'pdf', 'resumen']
                };
                
                const matchingFiles = files.filter(file => 
                  patterns[fileType.type].some(pattern => file.toLowerCase().includes(pattern))
                );
                
                if (matchingFiles.length > 0) {
                  foundPath = path.join(UPLOADS_DIR, matchingFiles[0]);
                  console.log(`    ✅ Usando archivo similar: ${matchingFiles[0]}`);
                } else {
                  console.log(`    ❌ No se encontraron archivos similares`);
                }
              } catch (error) {
                console.log(`    ❌ Error buscando archivos: ${error.message}`);
              }
            }
          }
          
          if (foundPath) {
            console.log(`    ✅ Archivo disponible para descarga: ${foundPath}`);
          } else {
            console.log(`    ❌ Archivo no disponible para descarga`);
          }
        } else {
          console.log(`  📄 ${fileType.name}: No configurado`);
        }
      }
    }
    
    // Generar URLs de prueba
    console.log('\n🔗 URLs de prueba para descarga:');
    projectsWithFiles.forEach(project => {
      console.log(`\n📋 Proyecto: ${project.name} (ID: ${project.id})`);
      console.log(`  Ficha Técnica: GET /api/projects/${project.id}/download/technicalSheet`);
      console.log(`  Modelo Canvas: GET /api/projects/${project.id}/download/canvaModel`);
      console.log(`  PDF Proyecto: GET /api/projects/${project.id}/download/projectPdf`);
    });
    
    console.log('\n✅ Proceso completado. Las descargas deberían funcionar ahora.');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  } finally {
    process.exit(0);
  }
}

fixAndTestDownloads(); 