// controllers/calificaciones.controller.js
const pool = require('../config/db.config');

// Crear una nueva calificación para un proyecto
exports.createCalificacion = async (req, res) => {
  const evaluadorId = req.userId; // ID del evaluador logueado (viene de authJwt.verifyToken)
  const {
    proyectoId, // ID del proyecto que se está calificando
    innovacion,
    mercado,
    tecnica,
    financiera,
    pitch,
    observaciones,
  } = req.body;

  if (!evaluadorId || !proyectoId) {
    return res.status(400).send({ message: "Evaluator ID and Project ID are required." });
  }

  // Validar que los campos de calificación sean números si se proveen
  const criterios = { innovacion, mercado, tecnica, financiera, pitch };
  for (const key in criterios) {
    if (criterios[key] !== undefined && (isNaN(parseFloat(criterios[key])) || parseFloat(criterios[key]) < 0 || parseFloat(criterios[key]) > 5)) { // Rango 0-5
        return res.status(400).send({ message: `Invalid value for ${key}. Must be a number between 0 and 5.` });
    }
  }

  // Calcular el total como promedio de los criterios ingresados
  let calculatedTotal = 0;
  let numCriterios = 0;
  if (innovacion !== undefined) { calculatedTotal += parseFloat(innovacion); numCriterios++; }
  if (mercado !== undefined) { calculatedTotal += parseFloat(mercado); numCriterios++; }
  if (tecnica !== undefined) { calculatedTotal += parseFloat(tecnica); numCriterios++; }
  if (financiera !== undefined) { calculatedTotal += parseFloat(financiera); numCriterios++; }
  if (pitch !== undefined) { calculatedTotal += parseFloat(pitch); numCriterios++; }
  
  // Calcular el promedio y redondear a 2 decimales (rango 0-5)
  const finalTotal = req.body.total !== undefined ? parseFloat(req.body.total).toFixed(2) : 
                     (numCriterios > 0 ? (calculatedTotal / numCriterios).toFixed(2) : 0);

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Opcional: Verificar que el proyecto exista y obtener el ID del alumno
    const [projectRows] = await connection.query("SELECT user_id FROM projects WHERE id = ?", [proyectoId]);
    if (projectRows.length === 0) {
      await connection.rollback();
      return res.status(404).send({ message: `Project with ID ${proyectoId} not found.` });
    }
    const userAlumnoIdFromProject = projectRows[0].user_id;

    // 2. Opcional: Verificar si este evaluador ya calificó este proyecto para evitar duplicados
    const [existingCalificacion] = await connection.query(
        "SELECT id FROM calificaciones WHERE user_evaluador_id = ? AND proyecto_id = ?",
        [evaluadorId, proyectoId]
    );
    if (existingCalificacion.length > 0) {
        await connection.rollback();
        return res.status(409).send({ message: "You have already submitted a grade for this project." });
    }

    // 3. Insertar la calificación
    const [result] = await connection.query(
      `INSERT INTO calificaciones 
       (user_evaluador_id, proyecto_id, user_alumno_id, innovacion, mercado, tecnica, financiera, pitch, observaciones, total) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evaluadorId,
        proyectoId,
        userAlumnoIdFromProject,
        innovacion !== undefined ? parseFloat(innovacion) : null,
        mercado !== undefined ? parseFloat(mercado) : null,
        tecnica !== undefined ? parseFloat(tecnica) : null,
        financiera !== undefined ? parseFloat(financiera) : null,
        pitch !== undefined ? parseFloat(pitch) : null,
        observaciones,
        finalTotal,
      ]
    );

    await connection.commit();
    res.status(201).send({ id: result.insertId, message: "Calificación submitted successfully!" });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error creating calificación:", error);
    res.status(500).send({ message: error.message || "Failed to submit calificación." });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener todas las calificaciones (para Admin/Moderador)
exports.getAllCalificaciones = async (req, res) => {
  try {
    const [calificaciones] = await pool.query(
      `SELECT 
         c.id, c.proyecto_id, c.innovacion, c.mercado, c.tecnica, c.financiera, c.pitch, c.observaciones, c.total, c.created_at,
         p.name AS project_name, 
         u_evaluador.username AS evaluador_username,
         u_alumno.username AS alumno_username
       FROM calificaciones c
       LEFT JOIN projects p ON c.proyecto_id = p.id
       LEFT JOIN users u_evaluador ON c.user_evaluador_id = u_evaluador.id
       LEFT JOIN users u_alumno ON c.user_alumno_id = u_alumno.id
       ORDER BY c.created_at DESC`
    );
    res.status(200).send(calificaciones);
  } catch (error) {
    console.error("Error fetching calificaciones:", error);
    res.status(500).send({ message: error.message || "Failed to retrieve calificaciones." });
  }
};

// Obtener calificaciones de un proyecto específico
exports.getCalificacionesByProyectoId = async (req, res) => {
  const { proyectoId } = req.params;
  try {
    const [calificaciones] = await pool.query(
      `SELECT 
         c.id, c.innovacion, c.mercado, c.tecnica, c.financiera, c.pitch, c.observaciones, c.total, c.created_at,
         u_evaluador.username AS evaluador_username,
         u_evaluador.nombre AS evaluador_nombre
       FROM calificaciones c
       LEFT JOIN users u_evaluador ON c.user_evaluador_id = u_evaluador.id
       WHERE c.proyecto_id = ? 
       ORDER BY c.created_at DESC`,
      [proyectoId]
    );
    // Es válido que un proyecto aún no tenga calificaciones, devolver array vacío.
    res.status(200).send(calificaciones);
  } catch (error) {
    console.error(`Error fetching calificaciones for project ${proyectoId}:`, error);
    res.status(500).send({ message: error.message || "Failed to retrieve calificaciones for the project." });
  }
};

// Obtener calificaciones hechas por un evaluador específico
exports.getCalificacionesByEvaluadorId = async (req, res) => {
    const evaluadorId = req.params.evaluadorId || req.userId; // Si :evaluadorId está en la ruta o es el propio user

    try {
        const [calificaciones] = await pool.query(
          `SELECT 
             c.id, c.proyecto_id, c.innovacion, c.mercado, c.tecnica, c.financiera, c.pitch, c.observaciones, c.total, c.created_at,
             p.name AS project_name,
             u_alumno.username AS alumno_username,
             u_alumno.nombre AS alumno_nombre
           FROM calificaciones c
           LEFT JOIN projects p ON c.proyecto_id = p.id
           LEFT JOIN users u_alumno ON c.user_alumno_id = u_alumno.id
           WHERE c.user_evaluador_id = ? 
           ORDER BY c.created_at DESC`,
          [evaluadorId]
        );
        res.status(200).send(calificaciones);
    } catch (error) {
        console.error(`Error fetching calificaciones by evaluator ${evaluadorId}:`, error);
        res.status(500).send({ message: error.message || "Failed to retrieve calificaciones by evaluator." });
    }
};

// Actualizar una calificación (cualquier evaluador o admin)
exports.updateCalificacion = async (req, res) => {
  const { id } = req.params; // ID de la calificación a actualizar
  const editorId = req.userId; 
  const {
    innovacion,
    mercado,
    tecnica,
    financiera,
    pitch,
    observaciones,
  } = req.body;

  const criterios = { innovacion, mercado, tecnica, financiera, pitch };
  for (const key in criterios) {
    if (criterios[key] !== undefined && (isNaN(parseFloat(criterios[key])) || parseFloat(criterios[key]) < 0 || parseFloat(criterios[key]) > 5)) {
        return res.status(400).send({ message: `Invalid value for ${key}. Must be a number between 0 and 5.` });
    }
  }

  let calculatedTotal = 0;
  let numCriteriosActualizados = 0;

  // Calcular el promedio solo con los criterios que se están actualizando
  if (innovacion !== undefined) { calculatedTotal += parseFloat(innovacion); numCriteriosActualizados++; }
  if (mercado !== undefined) { calculatedTotal += parseFloat(mercado); numCriteriosActualizados++; }
  if (tecnica !== undefined) { calculatedTotal += parseFloat(tecnica); numCriteriosActualizados++; }
  if (financiera !== undefined) { calculatedTotal += parseFloat(financiera); numCriteriosActualizados++; }
  if (pitch !== undefined) { calculatedTotal += parseFloat(pitch); numCriteriosActualizados++; }
  
  // Calcular el promedio y redondear a 2 decimales (rango 0-5)
  const finalTotal = req.body.total !== undefined ? parseFloat(req.body.total).toFixed(2) : 
                     (numCriteriosActualizados > 0 ? (calculatedTotal / numCriteriosActualizados).toFixed(2) : undefined);

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verificar que la calificación existe
    const [calificacionRows] = await connection.query(
      "SELECT id FROM calificaciones WHERE id = ?",
      [id]
    );
    if (calificacionRows.length === 0) {
      await connection.rollback();
      return res.status(404).send({ message: `Calificación with ID ${id} not found.` });
    }

    // Verificar que el usuario tiene rol de evaluador o admin
    const [editorRolesRows] = await connection.query(
      `SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?`,
      [editorId]
    );
    const editorRoles = editorRolesRows.map(r => r.name.toLowerCase());

    // Permitir actualización si es evaluador o admin
    if (!editorRoles.includes("evaluador") && !editorRoles.includes("admin")) {
      await connection.rollback();
      return res.status(403).send({ message: "Forbidden: You must be an evaluator or admin to update calificaciones." });
    }

    const fieldsToUpdate = [];
    const params = [];
    if (innovacion !== undefined) { fieldsToUpdate.push("innovacion = ?"); params.push(parseFloat(innovacion)); }
    if (mercado !== undefined) { fieldsToUpdate.push("mercado = ?"); params.push(parseFloat(mercado)); }
    if (tecnica !== undefined) { fieldsToUpdate.push("tecnica = ?"); params.push(parseFloat(tecnica)); }
    if (financiera !== undefined) { fieldsToUpdate.push("financiera = ?"); params.push(parseFloat(financiera)); }
    if (pitch !== undefined) { fieldsToUpdate.push("pitch = ?"); params.push(parseFloat(pitch)); }
    if (observaciones !== undefined) { fieldsToUpdate.push("observaciones = ?"); params.push(observaciones); }
    if (finalTotal !== undefined) { // Solo actualizar total si se recalculó o se envió explícitamente
        fieldsToUpdate.push("total = ?"); params.push(finalTotal);
    }
    
    if (fieldsToUpdate.length === 0) {
      await connection.rollback();
      return res.status(400).send({ message: "No fields to update provided." });
    }

    let query = "UPDATE calificaciones SET " + fieldsToUpdate.join(", ") + ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    params.push(id);

    const [result] = await connection.query(query, params);
    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(200).send({ message: "Calificación not changed or data was identical." });
    }
    res.status(200).send({ message: "Calificación updated successfully." });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`Error updating calificación ${id}:`, error);
    res.status(500).send({ message: error.message || "Failed to update calificación." });
  } finally {
    if (connection) connection.release();
  }
};

// Eliminar una calificación (cualquier evaluador o admin)
exports.deleteCalificacion = async (req, res) => {
  const { id } = req.params; 
  const deleterId = req.userId;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verificar que la calificación existe
    const [calificacionRows] = await connection.query(
      "SELECT id FROM calificaciones WHERE id = ?",
      [id]
    );
    if (calificacionRows.length === 0) {
      await connection.rollback();
      return res.status(404).send({ message: `Calificación with ID ${id} not found.` });
    }

    // Verificar que el usuario tiene rol de evaluador o admin
    const [deleterRolesRows] = await connection.query(
      `SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?`,
      [deleterId]
    );
    const deleterRoles = deleterRolesRows.map(r => r.name.toLowerCase());

    // Permitir eliminación si es evaluador o admin
    if (!deleterRoles.includes("evaluador") && !deleterRoles.includes("admin")) {
      await connection.rollback();
      return res.status(403).send({ message: "Forbidden: You must be an evaluator or admin to delete calificaciones." });
    }

    const [result] = await connection.query("DELETE FROM calificaciones WHERE id = ?", [id]);
    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: `Calificación with ID ${id} not found (unexpected).` });
    }
    res.status(200).send({ message: "Calificación deleted successfully." });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`Error deleting calificación ${id}:`, error);
    res.status(500).send({ message: error.message || "Failed to delete calificación." });
  } finally {
    if (connection) connection.release();
  }
};