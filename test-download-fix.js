const db = require('./app/models');
const path = require('path');
const fs = require('fs');

// Importar la configuración de uploads
const { UPLOADS_DIR } = require('./app/middleware/uploadFiles');

async function testDownloadFix() {
  try {
    console.log('🧪 Probando corrección de descargas...');
    console.log(`📁 Directorio de uploads: ${UPLOADS_DIR}`);
    
    // 1. Verificar archivos en el directorio de uploads
    console.log('\n📁 Archivos disponibles en uploads:');
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
    
    // 2. Obtener proyectos con archivos
    const projects = await db.proyectos.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { technicalSheet: { [db.Sequelize.Op.ne]: null } },
          { canvaModel: { [db.Sequelize.Op.ne]: null } },
          { projectPdf: { [db.Sequelize.Op.ne]: null } }
        ]
      },
      limit: 5
    });
    
    console.log(`\n📋 Proyectos con archivos encontrados: ${projects.length}`);
    
    for (const project of projects) {
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
    
    // 3. Generar URLs de prueba
    console.log('\n🔗 URLs de prueba para descarga:');
    projects.forEach(project => {
      console.log(`\n📋 Proyecto: ${project.name} (ID: ${project.id})`);
      console.log(`  Ficha Técnica: GET /api/projects/${project.id}/download/technicalSheet`);
      console.log(`  Modelo Canvas: GET /api/projects/${project.id}/download/canvaModel`);
      console.log(`  PDF Proyecto: GET /api/projects/${project.id}/download/projectPdf`);
    });
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    process.exit(0);
  }
}

testDownloadFix(); 