// test-download-api.js
const fetch = require('node-fetch');

async function testDownloadAPI() {
  try {
    console.log('🧪 Probando API de descarga...');
    
    // Token de prueba (necesitarás un token válido)
    const token = 'test-token'; // Reemplazar con token válido
    
    // Probar con proyecto ID 1
    const projectId = 1;
    const fileTypes = ['technicalSheet', 'canvaModel', 'projectPdf'];
    
    for (const fileType of fileTypes) {
      console.log(`\n📥 Probando descarga: ${fileType}`);
      
      const url = `https://api-estancia2.onrender.com/api/projects/${projectId}/download/${fileType}`;
      console.log(`🔗 URL: ${url}`);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'x-access-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`📡 Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log(`✅ Descarga exitosa para ${fileType}`);
          const contentLength = response.headers.get('content-length');
          console.log(`📊 Tamaño: ${contentLength} bytes`);
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText}`);
        }
        
      } catch (error) {
        console.log(`❌ Error de red: ${error.message}`);
      }
    }
    
    // También probar obtener información del proyecto
    console.log('\n📋 Probando obtener información del proyecto...');
    
    const projectUrl = `https://api-estancia2.onrender.com/api/projects/${projectId}`;
    console.log(`🔗 URL: ${projectUrl}`);
    
    try {
      const response = await fetch(projectUrl, {
        method: 'GET',
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const projectData = await response.json();
        console.log(`✅ Proyecto encontrado: "${projectData.name}"`);
        console.log(`📁 Ficha técnica: ${projectData.technicalSheet || 'No disponible'}`);
        console.log(`📁 Modelo Canva: ${projectData.canvaModel || 'No disponible'}`);
        console.log(`📁 PDF Proyecto: ${projectData.projectPdf || 'No disponible'}`);
        console.log(`📹 Video: ${projectData.videoLink || 'No disponible'}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`❌ Error de red: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  } finally {
    process.exit(0);
  }
}

testDownloadAPI(); 