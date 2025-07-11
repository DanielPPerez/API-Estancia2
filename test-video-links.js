const db = require('./app/models');

async function testVideoLinks() {
  try {
    console.log('🔍 Probando enlaces de video...');
    
    // 1. Verificar que hay proyectos con enlaces de video
    const projects = await db.proyectos.findAll({
      attributes: ['id', 'name', 'videoLink', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    console.log('\n📋 Proyectos encontrados:');
    projects.forEach(project => {
      console.log(`- ID: ${project.id}`);
      console.log(`  Nombre: ${project.name}`);
      console.log(`  Video Link: ${project.videoLink || 'No disponible'}`);
      console.log(`  Fecha: ${project.createdAt}`);
      console.log('');
    });
    
    // 2. Verificar que el campo videoLink existe en el modelo
    const modelAttributes = Object.keys(db.proyectos.rawAttributes);
    console.log('📝 Atributos del modelo proyectos:', modelAttributes);
    
    if (modelAttributes.includes('videoLink')) {
      console.log('✅ Campo videoLink existe en el modelo');
    } else {
      console.log('❌ Campo videoLink NO existe en el modelo');
    }
    
    // 3. Probar diferentes tipos de enlaces
    const testLinks = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://drive.google.com/file/d/1234567890/view',
      'https://vimeo.com/123456789',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ'
    ];
    
    console.log('\n🔗 Tipos de enlaces de prueba:');
    testLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link}`);
    });
    
    // 4. Verificar que los enlaces son válidos
    console.log('\n✅ Verificación de enlaces válidos:');
    testLinks.forEach((link, index) => {
      const isValid = link.includes('youtube.com') || 
                     link.includes('youtu.be') || 
                     link.includes('drive.google.com') || 
                     link.includes('vimeo.com');
      console.log(`${index + 1}. ${isValid ? '✅' : '❌'} ${link}`);
    });
    
    console.log('\n🎯 Resumen:');
    console.log(`- Total de proyectos: ${projects.length}`);
    console.log(`- Proyectos con video: ${projects.filter(p => p.videoLink).length}`);
    console.log(`- Proyectos sin video: ${projects.filter(p => !p.videoLink).length}`);
    
  } catch (error) {
    console.error('❌ Error probando enlaces de video:', error);
  } finally {
    process.exit(0);
  }
}

testVideoLinks(); 