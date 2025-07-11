// test-project-upload.js
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testProjectUpload() {
  try {
    console.log('🧪 Probando subida de proyecto...');
    
    // Crear un archivo PDF de prueba
    const testPdfPath = path.join(__dirname, 'test.pdf');
    const testPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
    
    fs.writeFileSync(testPdfPath, testPdfContent);
    console.log('✅ Archivo PDF de prueba creado');
    
    // Crear FormData
    const formData = new FormData();
    formData.append('nombreProyecto', 'Proyecto de Prueba');
    formData.append('descripcion', 'Descripción del proyecto de prueba');
    formData.append('videoPitch', 'https://www.youtube.com/watch?v=test');
    formData.append('fichaTecnica', fs.createReadStream(testPdfPath));
    formData.append('modeloCanva', fs.createReadStream(testPdfPath));
    formData.append('pdfProyecto', fs.createReadStream(testPdfPath));
    
    console.log('📋 FormData creado con los siguientes campos:');
    console.log('- nombreProyecto: Proyecto de Prueba');
    console.log('- descripcion: Descripción del proyecto de prueba');
    console.log('- videoPitch: https://www.youtube.com/watch?v=test');
    console.log('- fichaTecnica: archivo PDF');
    console.log('- modeloCanva: archivo PDF');
    console.log('- pdfProyecto: archivo PDF');
    
    // Simular la petición HTTP
    const fetch = require('node-fetch');
    const token = 'test-token'; // Token de prueba
    
    const response = await fetch('http://localhost:8080/api/projects', {
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
    
    // Limpiar archivo de prueba
    fs.unlinkSync(testPdfPath);
    console.log('✅ Archivo de prueba eliminado');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  } finally {
    process.exit(0);
  }
}

testProjectUpload(); 