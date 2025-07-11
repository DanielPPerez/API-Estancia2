// debug-files.js
const fs = require('fs');
const path = require('path');

async function debugFiles() {
  try {
    console.log('🔍 Verificando configuración de archivos...');
    
    // Verificar directorio de uploads
    const uploadsDir = path.join(process.cwd(), "uploads");
    console.log('📁 Directorio de uploads:', uploadsDir);
    console.log('📂 Existe:', fs.existsSync(uploadsDir));
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log('📄 Archivos en uploads:', files);
      
      if (files.length > 0) {
        console.log('\n📋 Detalles de archivos:');
        files.forEach(file => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          console.log(`- ${file} (${stats.size} bytes, ${stats.mtime})`);
        });
      }
    }
    
    // Verificar permisos de escritura
    try {
      const testFile = path.join(uploadsDir, 'test.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('✅ Permisos de escritura: OK');
    } catch (error) {
      console.error('❌ Error de permisos:', error.message);
    }
    
    // Verificar modelo de proyecto
    const db = require('./app/models');
    console.log('\n🔍 Verificando modelo de proyecto...');
    
    if (db.proyectos) {
      console.log('✅ Modelo proyectos encontrado');
      console.log('📋 Campos del modelo:', Object.keys(db.proyectos.rawAttributes));
    } else {
      console.error('❌ Modelo proyectos no encontrado');
    }
    
    // Probar consulta de proyectos
    console.log('\n🧪 Probando consulta de proyectos...');
    const projects = await db.proyectos.findAll({
      limit: 3,
      attributes: ['id', 'name', 'technicalSheet', 'canvaModel', 'projectPdf', 'videoLink']
    });
    
    console.log(`✅ Encontrados ${projects.length} proyectos`);
    
    projects.forEach(project => {
      console.log(`\n📋 Proyecto ${project.id}:`);
      console.log(`  Nombre: ${project.name}`);
      console.log(`  Ficha técnica: ${project.technicalSheet ? '✅' : '❌'}`);
      console.log(`  Modelo Canva: ${project.canvaModel ? '✅' : '❌'}`);
      console.log(`  PDF Proyecto: ${project.projectPdf ? '✅' : '❌'}`);
      console.log(`  Video: ${project.videoLink ? '✅' : '❌'}`);
      
      // Verificar si los archivos existen
      if (project.technicalSheet) {
        console.log(`  Ficha técnica existe: ${fs.existsSync(project.technicalSheet)}`);
      }
      if (project.canvaModel) {
        console.log(`  Modelo Canva existe: ${fs.existsSync(project.canvaModel)}`);
      }
      if (project.projectPdf) {
        console.log(`  PDF Proyecto existe: ${fs.existsSync(project.projectPdf)}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error en debug:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

debugFiles(); 