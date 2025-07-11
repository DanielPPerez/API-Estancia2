// debug-project-files.js
const db = require('./app/models');
const fs = require('fs');
const path = require('path');

async function debugProjectFiles() {
  try {
    console.log('🔍 Verificando proyectos y archivos...');
    
    // Obtener todos los proyectos
    const projects = await db.proyectos.findAll({
      attributes: ['id', 'name', 'technicalSheet', 'canvaModel', 'projectPdf', 'videoLink', 'estatus'],
      order: [['id', 'ASC']]
    });
    
    console.log(`📋 Encontrados ${projects.length} proyectos:`);
    
    projects.forEach(project => {
      console.log(`\n📁 Proyecto ID ${project.id}: "${project.name}"`);
      console.log(`  Estatus: ${project.estatus}`);
      console.log(`  Video: ${project.videoLink || '❌ No disponible'}`);
      console.log(`  Ficha técnica: ${project.technicalSheet || '❌ No disponible'}`);
      console.log(`  Modelo Canva: ${project.canvaModel || '❌ No disponible'}`);
      console.log(`  PDF Proyecto: ${project.projectPdf || '❌ No disponible'}`);
      
      // Verificar si los archivos existen físicamente
      if (project.technicalSheet) {
        const exists = fs.existsSync(project.technicalSheet);
        console.log(`    📄 Ficha técnica existe: ${exists ? '✅' : '❌'} (${project.technicalSheet})`);
        if (exists) {
          const stats = fs.statSync(project.technicalSheet);
          console.log(`    📊 Tamaño: ${stats.size} bytes`);
        }
      }
      
      if (project.canvaModel) {
        const exists = fs.existsSync(project.canvaModel);
        console.log(`    📄 Modelo Canva existe: ${exists ? '✅' : '❌'} (${project.canvaModel})`);
        if (exists) {
          const stats = fs.statSync(project.canvaModel);
          console.log(`    📊 Tamaño: ${stats.size} bytes`);
        }
      }
      
      if (project.projectPdf) {
        const exists = fs.existsSync(project.projectPdf);
        console.log(`    📄 PDF Proyecto existe: ${exists ? '✅' : '❌'} (${project.projectPdf})`);
        if (exists) {
          const stats = fs.statSync(project.projectPdf);
          console.log(`    📊 Tamaño: ${stats.size} bytes`);
        }
      }
    });
    
    // Verificar directorio de uploads
    const uploadsDir = path.join(process.cwd(), "uploads");
    console.log(`\n📁 Directorio de uploads: ${uploadsDir}`);
    console.log(`📂 Existe: ${fs.existsSync(uploadsDir)}`);
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`📄 Archivos en uploads (${files.length}):`);
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        console.log(`  - ${file} (${stats.size} bytes)`);
      });
    }
    
    // Probar endpoint de descarga para el primer proyecto
    if (projects.length > 0) {
      const firstProject = projects[0];
      console.log(`\n🧪 Probando endpoint de descarga para proyecto ${firstProject.id}:`);
      
      // Simular la función de descarga
      const testDownload = async (projectId, fileType) => {
        try {
          const project = await db.proyectos.findByPk(projectId);
          if (!project) {
            console.log(`  ❌ Proyecto ${projectId} no encontrado`);
            return;
          }
          
          let filePath = null;
          let fileName = '';
          
          switch (fileType) {
            case 'technicalSheet':
              filePath = project.technicalSheet;
              fileName = `ficha_tecnica_${project.name}.pdf`;
              break;
            case 'canvaModel':
              filePath = project.canvaModel;
              fileName = `modelo_canvas_${project.name}.pdf`;
              break;
            case 'projectPdf':
              filePath = project.projectPdf;
              fileName = `proyecto_${project.name}.pdf`;
              break;
            default:
              console.log(`  ❌ Tipo de archivo inválido: ${fileType}`);
              return;
          }
          
          if (!filePath) {
            console.log(`  ❌ No hay ruta para ${fileType}`);
            return;
          }
          
          if (!fs.existsSync(filePath)) {
            console.log(`  ❌ Archivo no existe: ${filePath}`);
            return;
          }
          
          console.log(`  ✅ ${fileType}: ${filePath} -> ${fileName}`);
          
        } catch (error) {
          console.log(`  ❌ Error probando ${fileType}: ${error.message}`);
        }
      };
      
      await testDownload(firstProject.id, 'technicalSheet');
      await testDownload(firstProject.id, 'canvaModel');
      await testDownload(firstProject.id, 'projectPdf');
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

debugProjectFiles(); 