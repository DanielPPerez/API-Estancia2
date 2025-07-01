// controllers/excel.controller.js
const ExcelJS = require('exceljs');
const pool = require('../config/db.config');
const fs = require('fs');
const path = require('path');

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

  const headerRow = sheet.getRow(1).values; // Asume que la primera fila son cabeceras
  if (!headerRow || headerRow.length === 0) {
    errors.push(`Sheet ${sheet.name} (for table ${tableName}) has no header row or is empty.`);
    return { updatedRows, insertedRows, errors };
  }
  
  // Quitar el primer elemento si es undefined (a veces ExcelJS añade uno)
  const headers = headerRow.slice(1).map(h => String(h).trim()); // Nombres de columnas del Excel

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
  console.log(`Table ${tableName}: ${updatedRows} rows updated, ${insertedRows} rows inserted.`);
  return { updatedRows, insertedRows, errors };
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

  try {
    connection = await pool.getConnection();
    await workbook.xlsx.readFile(filePath);

    // Iterar sobre cada hoja del Excel
    // Asumimos que el nombre de la hoja corresponde al nombre de la tabla
    for (const worksheet of workbook.worksheets) {
        const tableName = worksheet.name;
        // Opcional: validar si tableName es una tabla válida en tu BD
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
                // Si hay errores en una hoja, podríamos decidir hacer rollback para esa tabla
                // await connection.rollback();
                // console.log(`Rollback for table ${tableName} due to errors.`);
                // overallErrors.push(...result.errors.map(e => `Table ${tableName}: ${e}`));
                // Por ahora, continuaremos y reportaremos errores por fila
            }
            await connection.commit();
        } catch (tableError) {
            await connection.rollback();
            console.error(`Critical error processing table ${tableName}, rollback performed:`, tableError);
            overallErrors.push(`Critical error processing table ${tableName}: ${tableError.message}`);
        }
    }

    res.status(200).send({
      message: 'Excel import and update process finished.',
      summary: results,
      errors: overallErrors
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