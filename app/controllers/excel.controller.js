// controllers/excel.controller.js
const ExcelJS = require('exceljs');
const pool = require('../config/db.pool');
const fs = require('fs');
const path = require('path');

// --- FUNCIONES DE VALIDACIÓN ---

// Función para obtener la estructura de una tabla de la base de datos
async function getTableStructure(tableName, poolConnection) {
  try {
    const [columns] = await poolConnection.query(`DESCRIBE ${tableName}`);
    return columns.map(col => ({
      name: col.Field,
      type: col.Type,
      null: col.Null,
      key: col.Key,
      default: col.Default,
      extra: col.Extra
    }));
  } catch (error) {
    console.error(`Error getting structure for table ${tableName}:`, error);
    throw error;
  }
}

// Función para validar el formato del archivo Excel
function validateExcelFormat(workbook, allowedTables) {
  const errors = [];
  const warnings = [];
  
  // Verificar que el archivo tenga hojas
  if (workbook.worksheets.length === 0) {
    errors.push('El archivo Excel no contiene hojas.');
    return { errors, warnings };
  }
  
  // Verificar que todas las hojas correspondan a tablas permitidas
  const sheetNames = workbook.worksheets.map(sheet => sheet.name);
  const invalidSheets = sheetNames.filter(sheetName => !allowedTables.includes(sheetName));
  
  if (invalidSheets.length > 0) {
    errors.push(`Hojas no permitidas encontradas: ${invalidSheets.join(', ')}. Solo se permiten: ${allowedTables.join(', ')}`);
  }
  
  // Verificar que cada hoja tenga al menos una fila de encabezados
  for (const worksheet of workbook.worksheets) {
    if (worksheet.rowCount === 0) {
      errors.push(`La hoja '${worksheet.name}' está vacía.`);
      continue;
    }
    
    const headerRow = worksheet.getRow(1);
    if (!headerRow.hasValues) {
      errors.push(`La hoja '${worksheet.name}' no tiene fila de encabezados válida.`);
    }
  }
  
  return { errors, warnings };
}

// Función para validar que las columnas del Excel coincidan con las de la tabla
function validateTableStructure(excelHeaders, dbColumns, tableName) {
  const errors = [];
  const warnings = [];
  
  // Convertir nombres de columnas a minúsculas para comparación
  const excelHeadersLower = excelHeaders.map(h => h.toLowerCase());
  const dbColumnNames = dbColumns.map(col => col.name.toLowerCase());
  
  // Verificar columnas faltantes en el Excel
  const missingInExcel = dbColumnNames.filter(dbCol => !excelHeadersLower.includes(dbCol));
  if (missingInExcel.length > 0) {
    warnings.push(`Tabla ${tableName}: Columnas faltantes en Excel: ${missingInExcel.join(', ')}`);
  }
  
  // Verificar columnas extra en el Excel
  const extraInExcel = excelHeadersLower.filter(excelCol => !dbColumnNames.includes(excelCol));
  if (extraInExcel.length > 0) {
    warnings.push(`Tabla ${tableName}: Columnas extra en Excel (serán ignoradas): ${extraInExcel.join(', ')}`);
  }
  
  // Verificar que al menos las columnas principales estén presentes
  const requiredColumns = ['id']; // Puedes agregar más columnas requeridas según tu caso
  const missingRequired = requiredColumns.filter(reqCol => !excelHeadersLower.includes(reqCol));
  if (missingRequired.length > 0) {
    errors.push(`Tabla ${tableName}: Columnas requeridas faltantes: ${missingRequired.join(', ')}`);
  }
  
  return { errors, warnings };
}

// Función para validar tipos de datos básicos
function validateDataTypes(rowData, dbColumns, tableName) {
  const errors = [];
  
  for (const [columnName, value] of Object.entries(rowData)) {
    const dbColumn = dbColumns.find(col => col.name.toLowerCase() === columnName.toLowerCase());
    if (!dbColumn) continue; // Columna extra, será ignorada
    
    // Validaciones básicas según el tipo de columna
    const columnType = dbColumn.type.toLowerCase();
    
    if (value !== null && value !== undefined) {
      // Validar enteros
      if (columnType.includes('int') || columnType.includes('bigint')) {
        if (isNaN(Number(value)) || !Number.isInteger(Number(value))) {
          errors.push(`Tabla ${tableName}: Columna '${columnName}' debe ser un número entero, valor recibido: ${value}`);
        }
      }
      
      // Validar decimales
      if (columnType.includes('decimal') || columnType.includes('float') || columnType.includes('double')) {
        if (isNaN(Number(value))) {
          errors.push(`Tabla ${tableName}: Columna '${columnName}' debe ser un número, valor recibido: ${value}`);
        }
      }
      
      // Validar fechas
      if (columnType.includes('date') || columnType.includes('datetime') || columnType.includes('timestamp')) {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push(`Tabla ${tableName}: Columna '${columnName}' debe ser una fecha válida, valor recibido: ${value}`);
        }
      }
      
      // Validar longitud de strings
      if (columnType.includes('varchar') || columnType.includes('char')) {
        const maxLength = parseInt(columnType.match(/\((\d+)\)/)?.[1] || '255');
        if (String(value).length > maxLength) {
          errors.push(`Tabla ${tableName}: Columna '${columnName}' excede la longitud máxima (${maxLength}), valor: ${String(value).substring(0, 50)}...`);
        }
      }
    }
  }
  
  return errors;
}

// Función específica para validar datos de calificaciones
function validateCalificacionesData(rowData, tableName) {
  const errors = [];
  
  // Validar que las calificaciones estén en el rango correcto (0-10)
  const calificacionFields = ['innovacion', 'mercado', 'tecnica', 'financiera', 'pitch'];
  
  for (const field of calificacionFields) {
    if (rowData[field] !== null && rowData[field] !== undefined) {
      const value = Number(rowData[field]);
      if (isNaN(value)) {
        errors.push(`Tabla ${tableName}: La calificación '${field}' debe ser un número, valor recibido: ${rowData[field]}`);
      } else if (value < 0 || value > 10) {
        errors.push(`Tabla ${tableName}: La calificación '${field}' debe estar entre 0 y 10, valor recibido: ${value}`);
      }
    }
  }
  
  // Validar que el total sea la suma de las calificaciones
  if (rowData.total !== null && rowData.total !== undefined) {
    const expectedTotal = calificacionFields.reduce((sum, field) => {
      const value = Number(rowData[field]) || 0;
      return sum + value;
    }, 0);
    
    const actualTotal = Number(rowData.total);
    if (Math.abs(actualTotal - expectedTotal) > 0.01) { // Permitir pequeñas diferencias por decimales
      errors.push(`Tabla ${tableName}: El total (${actualTotal}) no coincide con la suma de las calificaciones (${expectedTotal})`);
    }
  }
  
  return errors;
}

// Función específica para validar datos de usuarios
function validateUsersData(rowData, tableName) {
  const errors = [];
  
  // Validar formato de email
  if (rowData.email && rowData.email !== null && rowData.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(rowData.email))) {
      errors.push(`Tabla ${tableName}: El email '${rowData.email}' no tiene un formato válido`);
    }
  }
  
  // Validar que el username no esté vacío
  if (!rowData.username || String(rowData.username).trim() === '') {
    errors.push(`Tabla ${tableName}: El nombre de usuario no puede estar vacío`);
  }
  
  // Validar longitud del username
  if (rowData.username && String(rowData.username).length > 50) {
    errors.push(`Tabla ${tableName}: El nombre de usuario no puede exceder 50 caracteres`);
  }
  
  // Validar que el username solo contenga caracteres válidos
  if (rowData.username && !/^[a-zA-Z0-9_]+$/.test(String(rowData.username))) {
    errors.push(`Tabla ${tableName}: El nombre de usuario solo puede contener letras, números y guiones bajos`);
  }
  
  return errors;
}

// Función específica para validar datos de proyectos
function validateProjectsData(rowData, tableName) {
  const errors = [];
  
  // Validar que el nombre del proyecto no esté vacío
  if (!rowData.name || String(rowData.name).trim() === '') {
    errors.push(`Tabla ${tableName}: El nombre del proyecto no puede estar vacío`);
  }
  
  // Validar longitud del nombre del proyecto
  if (rowData.name && String(rowData.name).length > 255) {
    errors.push(`Tabla ${tableName}: El nombre del proyecto no puede exceder 255 caracteres`);
  }
  
  // Validar que la descripción no exceda el límite
  if (rowData.description && String(rowData.description).length > 1000) {
    errors.push(`Tabla ${tableName}: La descripción del proyecto no puede exceder 1000 caracteres`);
  }
  
  // Validar formato de URL para el video_link si está presente
  if (rowData.video_link && rowData.video_link !== null && rowData.video_link !== undefined) {
    try {
      new URL(String(rowData.video_link));
    } catch (error) {
      errors.push(`Tabla ${tableName}: El enlace del video '${rowData.video_link}' no es una URL válida`);
    }
  }
  
  // Validar que la categoría esté en las opciones permitidas
  const allowedCategories = ['tecnologia', 'salud', 'educacion', 'medio_ambiente', 'social', 'otros'];
  if (rowData.category && !allowedCategories.includes(String(rowData.category).toLowerCase())) {
    errors.push(`Tabla ${tableName}: La categoría '${rowData.category}' no es válida. Categorías permitidas: ${allowedCategories.join(', ')}`);
  }
  
  return errors;
}

// Función específica para validar datos de roles
function validateRolesData(rowData, tableName) {
  const errors = [];
  
  // Validar que el nombre del rol no esté vacío
  if (!rowData.name || String(rowData.name).trim() === '') {
    errors.push(`Tabla ${tableName}: El nombre del rol no puede estar vacío`);
  }
  
  // Validar longitud del nombre del rol
  if (rowData.name && String(rowData.name).length > 50) {
    errors.push(`Tabla ${tableName}: El nombre del rol no puede exceder 50 caracteres`);
  }
  
  // Validar que el rol esté en las opciones permitidas
  const allowedRoles = ['user', 'admin', 'evaluador'];
  if (rowData.name && !allowedRoles.includes(String(rowData.name).toLowerCase())) {
    errors.push(`Tabla ${tableName}: El rol '${rowData.name}' no es válido. Roles permitidos: ${allowedRoles.join(', ')}`);
  }
  
  return errors;
}

// --- EXPORTACIÓN A EXCEL ---

// Función auxiliar para añadir una hoja a un workbook de ExcelJS
async function addSheetFromTable(workbook, tableName, poolConnection) {
  const sheet = workbook.addWorksheet(tableName.substring(0, 30)); // Nombre de hoja limitado a 30 caracteres
  try {
    const [rows, fields] = await poolConnection.query(`SELECT * FROM ${tableName}`);
    if (rows.length > 0) {
      // Añadir cabeceras (nombres de columnas)
      sheet.columns = fields.map(field => ({ header: field.name, key: field.name, width: 20 }));
      // Añadir filas de datos
      sheet.addRows(rows);
    } else {
      sheet.addRow([`No data found in table ${tableName}`]);
    }
    console.log(`Data from table ${tableName} added to Excel sheet.`);
  } catch (error) {
    console.error(`Error fetching data from table ${tableName}:`, error);
    sheet.addRow([`Error fetching data from table ${tableName}: ${error.message}`]);
  }
}

exports.exportDatabaseToExcel = async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'YourAppName';
  workbook.lastModifiedBy = 'YourAppName';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Lista de tablas que quieres exportar (ajusta según tus necesidades)
  const tablesToExport = ['users', 'roles', 'user_roles', 'projects', 'calificaciones', 'refresh_tokens'];
  let connection;

  try {
    connection = await pool.getConnection(); // Obtener una conexión del pool

    for (const tableName of tablesToExport) {
      await addSheetFromTable(workbook, tableName, connection);
    }

    // Preparar el archivo para la descarga
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `database_export_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
    console.log("Database export to Excel completed.");

  } catch (error) {
    console.error('Error exporting database to Excel:', error);
    res.status(500).send({ message: 'Failed to export database to Excel.', error: error.message });
  } finally {
    if (connection) connection.release(); // Liberar la conexión
  }
};

// --- IMPORTACIÓN DESDE EXCEL Y ACTUALIZACIÓN ---

// Función auxiliar para procesar una hoja e intentar actualizar/insertar en una tabla
// Esta es la parte más compleja debido a la lógica de actualización/inserción
async function processSheetAndUpdateTable(sheet, tableName, poolConnection) {
  let updatedRows = 0;
  let insertedRows = 0;
  let errors = [];
  let warnings = [];

  const headerRow = sheet.getRow(1).values; // Asume que la primera fila son cabeceras
  if (!headerRow || headerRow.length === 0) {
    errors.push(`Sheet ${sheet.name} (for table ${tableName}) has no header row or is empty.`);
    return { updatedRows, insertedRows, errors, warnings };
  }
  
  // Quitar el primer elemento si es undefined (a veces ExcelJS añade uno)
  const headers = headerRow.slice(1).map(h => String(h).trim()); // Nombres de columnas del Excel

  // VALIDACIÓN DE ESTRUCTURA DE TABLA
  try {
    const dbColumns = await getTableStructure(tableName, poolConnection);
    const structureValidation = validateTableStructure(headers, dbColumns, tableName);
    
    if (structureValidation.errors.length > 0) {
      errors.push(...structureValidation.errors);
      return { updatedRows, insertedRows, errors, warnings };
    }
    
    warnings.push(...structureValidation.warnings);
    
    // Iterar sobre las filas de datos (empezando desde la fila 2)
    for (let i = 2; i <= sheet.rowCount; i++) {
      const currentRow = sheet.getRow(i);
      if (!currentRow.hasValues) continue; // Saltar filas vacías

      const rowDataArray = currentRow.values.slice(1); // Datos de la fila, quitando el primer elemento
      const rowDataObject = {};
      headers.forEach((header, index) => {
          // Manejar celdas que pueden ser objetos (ej. fechas, hipervínculos)
          let cellValue = rowDataArray[index];
          if (cellValue && typeof cellValue === 'object' && cellValue.hasOwnProperty('result')) {
              cellValue = cellValue.result; // Para fórmulas
          } else if (cellValue && typeof cellValue === 'object' && cellValue.hasOwnProperty('text')) {
              cellValue = cellValue.text; // Para rich text o hipervínculos
          }
          // Convertir fechas de Excel (número de serie) a formato de fecha JS/MySQL si es necesario
          // Aquí necesitarías identificar las columnas de fecha y parsearlas.
          // Ejemplo simple: if (header.includes('_at') || header.includes('Date')) { cellValue = ExcelDateToJSDate(cellValue); }

          rowDataObject[header] = cellValue === undefined ? null : cellValue;
      });

      // VALIDACIÓN DE TIPOS DE DATOS
      const dataTypeErrors = validateDataTypes(rowDataObject, dbColumns, tableName);
      if (dataTypeErrors.length > 0) {
        errors.push(`Fila ${i}: ${dataTypeErrors.join(', ')}`);
        continue; // Saltar esta fila si hay errores de tipo de datos
      }

      // VALIDACIÓN ESPECÍFICA PARA CALIFICACIONES
      if (tableName === 'calificaciones') {
        const calificacionesErrors = validateCalificacionesData(rowDataObject, tableName);
        if (calificacionesErrors.length > 0) {
          errors.push(`Fila ${i}: ${calificacionesErrors.join(', ')}`);
          continue; // Saltar esta fila si hay errores de calificaciones
        }
      }

      // VALIDACIÓN ESPECÍFICA PARA USUARIOS
      if (tableName === 'users') {
        const usersErrors = validateUsersData(rowDataObject, tableName);
        if (usersErrors.length > 0) {
          errors.push(`Fila ${i}: ${usersErrors.join(', ')}`);
          continue; // Saltar esta fila si hay errores de usuarios
        }
      }

      // VALIDACIÓN ESPECÍFICA PARA PROYECTOS
      if (tableName === 'projects') {
        const projectsErrors = validateProjectsData(rowDataObject, tableName);
        if (projectsErrors.length > 0) {
          errors.push(`Fila ${i}: ${projectsErrors.join(', ')}`);
          continue; // Saltar esta fila si hay errores de proyectos
        }
      }

      // VALIDACIÓN ESPECÍFICA PARA ROLES
      if (tableName === 'roles') {
        const rolesErrors = validateRolesData(rowDataObject, tableName);
        if (rolesErrors.length > 0) {
          errors.push(`Fila ${i}: ${rolesErrors.join(', ')}`);
          continue; // Saltar esta fila si hay errores de roles
        }
      }

      // Lógica de Actualización o Inserción
      // Asumimos que la tabla tiene una columna 'id' como Primary Key
      // Si el 'id' está presente en rowDataObject y no es null/undefined, intentamos UPDATE.
      // De lo contrario, intentamos INSERT.

      try {
        if (rowDataObject.id !== null && rowDataObject.id !== undefined && String(rowDataObject.id).trim() !== "") {
          // Intento de UPDATE
          const id = rowDataObject.id;
          const fieldsToUpdate = { ...rowDataObject };
          delete fieldsToUpdate.id; // No actualizamos el ID

          // Ignorar created_at para no sobreescribirlo en updates si está en el Excel
          if ('created_at' in fieldsToUpdate) delete fieldsToUpdate.created_at;
          // Forzar updated_at a la fecha actual si la columna existe en la tabla
          if ((await poolConnection.query(`SHOW COLUMNS FROM ${tableName} LIKE 'updated_at'`))[0].length > 0) {
              fieldsToUpdate.updated_at = new Date();
          }

          const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
          const values = Object.values(fieldsToUpdate);
          
          if (setClauses) { // Solo actualizar si hay campos que actualizar
              const [result] = await poolConnection.query(
                `UPDATE ${tableName} SET ${setClauses} WHERE id = ?`,
                [...values, id]
              );
              if (result.affectedRows > 0) updatedRows++;
              // Si affectedRows es 0, puede que el ID no existiera o los datos eran idénticos.
              // Podrías intentar un INSERT si affectedRows es 0 y el ID no existía.
          }

        } else {
          // Intento de INSERT
          // Si el ID venía como null/vacío o no venía, se asume que es una nueva fila.
          // Si la tabla tiene ID autoincremental, no deberíamos pasar `id` en el insert.
          const fieldsToInsert = { ...rowDataObject };
          if (fieldsToInsert.hasOwnProperty('id') && (fieldsToInsert.id === null || String(fieldsToInsert.id).trim() === "")) {
              delete fieldsToInsert.id;
          }

          // Asegurarse de que las columnas de fecha sean válidas o null
          // (aquí se necesitaría más lógica para parsear fechas de Excel si vienen en formato numérico)

          const columns = Object.keys(fieldsToInsert).join(', ');
          const placeholders = Object.keys(fieldsToInsert).map(() => '?').join(', ');
          const values = Object.values(fieldsToInsert);

          if (columns) {
              const [result] = await poolConnection.query(
                `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
                values
              );
              if (result.insertId) insertedRows++;
          }
        }
      } catch (error) {
        console.error(`Error processing row ${i} for table ${tableName}:`, error.message, "Row Data:", rowDataObject);
        errors.push(`Row ${i} (ID: ${rowDataObject.id || 'N/A'}) for table ${tableName}: ${error.message}`);
      }
    }
  } catch (error) {
    errors.push(`Error validating table structure for ${tableName}: ${error.message}`);
  }
  
  console.log(`Table ${tableName}: ${updatedRows} rows updated, ${insertedRows} rows inserted.`);
  return { updatedRows, insertedRows, errors, warnings };
}

exports.importFromExcelAndUpdate = async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: 'No Excel file uploaded.' });
  }

  const workbook = new ExcelJS.Workbook();
  const filePath = req.file.path;
  let connection;
  let results = {};
  let overallErrors = [];
  let overallWarnings = [];

  try {
    connection = await pool.getConnection();
    await workbook.xlsx.readFile(filePath);

    // Lista de tablas permitidas para importación
    const allowedTables = ['users', 'roles', 'user_roles', 'projects', 'calificaciones', 'refresh_tokens'];

    // VALIDACIÓN DEL FORMATO DEL EXCEL
    const excelFormatValidation = validateExcelFormat(workbook, allowedTables);
    if (excelFormatValidation.errors.length > 0) {
      overallErrors.push(...excelFormatValidation.errors);
      return res.status(400).send({ 
        message: 'El archivo Excel no tiene el formato correcto. Verifica que las hojas correspondan a las tablas permitidas.', 
        errors: excelFormatValidation.errors 
      });
    }

    // Iterar sobre cada hoja del Excel
    // Asumimos que el nombre de la hoja corresponde al nombre de la tabla
    for (const worksheet of workbook.worksheets) {
        const tableName = worksheet.name;
        
        // VALIDACIÓN: Verificar que la tabla esté en la lista de tablas permitidas
        if (!allowedTables.includes(tableName)) {
            console.warn(`Sheet name '${tableName}' is not in the allowed tables list. Skipping.`);
            overallErrors.push(`Sheet name '${tableName}' is not allowed for import. Allowed tables: ${allowedTables.join(', ')}`);
            continue;
        }
        
        // VALIDACIÓN: Verificar que la tabla existe en la base de datos
        const [tableExists] = await connection.query("SHOW TABLES LIKE ?", [tableName]);
        if (tableExists.length === 0) {
            console.warn(`Sheet name '${tableName}' does not match any known table. Skipping.`);
            overallErrors.push(`Sheet name '${tableName}' does not match any known table. Skipping.`);
            continue;
        }

        console.log(`Processing sheet: ${tableName}`);
        await connection.beginTransaction(); // Transacción por tabla
        try {
            const result = await processSheetAndUpdateTable(worksheet, tableName, connection);
            results[tableName] = result;
            
            if (result.errors.length > 0) {
                // Si hay errores críticos en una hoja, hacer rollback para esa tabla
                await connection.rollback();
                console.log(`Rollback for table ${tableName} due to critical errors.`);
                overallErrors.push(...result.errors.map(e => `Table ${tableName}: ${e}`));
            } else {
                await connection.commit();
                if (result.warnings.length > 0) {
                    overallWarnings.push(...result.warnings.map(w => `Table ${tableName}: ${w}`));
                }
            }
        } catch (tableError) {
            await connection.rollback();
            console.error(`Critical error processing table ${tableName}, rollback performed:`, tableError);
            overallErrors.push(`Critical error processing table ${tableName}: ${tableError.message}`);
        }
    }

    res.status(200).send({
      message: 'Excel import and update process finished.',
      summary: results,
      errors: overallErrors,
      warnings: overallWarnings
    });

  } catch (error) {
    console.error('Error importing from Excel:', error);
    res.status(500).send({ message: 'Failed to import from Excel.', error: error.message });
  } finally {
    if (connection) connection.release();
    // Eliminar el archivo subido después de procesarlo
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};