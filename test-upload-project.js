// test-upload-project.js
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUploadProject() {
  try {
    console.log('🧪 Probando subida completa de proyecto...');
    
    // Crear archivos PDF de prueba
    const testPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
    
    const testFiles = [
      { name: 'ficha-tecnica-test.pdf', content: testPdfContent },
      { name: 'modelo-canvas-test.pdf', content: testPdfContent },
      { name: 'resumen-ejecutivo-test.pdf', content: testPdfContent }
    ];
    
    // Crear archivos temporales
    const tempFiles = [];
    for (const file of testFiles) {
      const tempPath = path.join(__dirname, file.name);
      fs.writeFileSync(tempPath, file.content);
      tempFiles.push(tempPath);
      console.log(`✅ Archivo creado: ${tempPath}`);
    }
    
    // Crear FormData
    const formData = new FormData();
    formData.append('nombreProyecto', 'Proyecto de Prueba - Archivos');
    formData.append('descripcion', 'Este es un proyecto de prueba para verificar que los archivos se suban correctamente');
    formData.append('videoPitch', 'https://www.youtube.com/watch?v=test-video');
    formData.append('fichaTecnica', fs.createReadStream(tempFiles[0]));
    formData.append('modeloCanva', fs.createReadStream(tempFiles[1]));
    formData.append('pdfProyecto', fs.createReadStream(tempFiles[2]));
    
    console.log('📋 FormData creado con los siguientes campos:');
    console.log('- nombreProyecto: Proyecto de Prueba - Archivos');
    console.log('- descripcion: Este es un proyecto de prueba...');
    console.log('- videoPitch: https://www.youtube.com/watch?v=test-video');
    console.log('- fichaTecnica: archivo PDF');
    console.log('- modeloCanva: archivo PDF');
    console.log('- pdfProyecto: archivo PDF');
    
    // Simular la petición HTTP
    const fetch = require('node-fetch');
    const token = 'test-token'; // Token de prueba
    
    console.log('\n📡 Enviando petición a la API...');
    const response = await fetch('https://api-estancia2.onrender.com/api/projects', {
      method: 'POST',
      headers: {
        'x-access-token': token,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('📡 Respuesta del servidor:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseData = await response.text();
    console.log('Response Body:', responseData);
    
    // Limpiar archivos temporales
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🗑️ Archivo eliminado: ${file}`);
      }
    });
    
    if (response.ok) {
      console.log('\n✅ Subida exitosa! Ahora puedes probar la descarga.');
    } else {
      console.log('\n❌ Error en la subida. Revisa los logs del servidor.');
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  } finally {
    process.exit(0);
  }
}

testUploadProject(); 