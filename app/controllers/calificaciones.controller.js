// controllers/calificaciones.controller.js
const db = require('../models');

// Obtener referencias a los modelos con nombres correctos
const Calificaciones = db.calificaciones;
const Proyecto = db.proyectos;
const User = db.user;

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

  try {
    // 1. Verificar que el proyecto exista y obtener el ID del alumno
    const project = await db.proyectos.findByPk(proyectoId);
    if (!project) {
      return res.status(404).send({ message: `Project with ID ${proyectoId} not found.` });
    }
    const userAlumnoIdFromProject = project.idUser;

    // 2. Verificar si este evaluador ya calificó este proyecto para evitar duplicados
    const existingCalificacion = await db.calificaciones.findOne({
      where: {
        userEvaluadorId: evaluadorId,
        proyectoId: proyectoId
      }
    });
    
    if (existingCalificacion) {
        return res.status(409).send({ message: "You have already submitted a grade for this project." });
    }

    // 3. Insertar la calificación
    const calificacion = await db.calificaciones.create({
      userEvaluadorId: evaluadorId,
      proyectoId: proyectoId,
      userAlumnoId: userAlumnoIdFromProject,
      innovacion: innovacion !== undefined ? parseFloat(innovacion) : null,
      mercado: mercado !== undefined ? parseFloat(mercado) : null,
      tecnica: tecnica !== undefined ? parseFloat(tecnica) : null,
      financiera: financiera !== undefined ? parseFloat(financiera) : null,
      pitch: pitch !== undefined ? parseFloat(pitch) : null,
        observaciones,
      total: finalTotal,
    });

    res.status(201).send({ id: calificacion.id, message: "Calificación submitted successfully!" });

  } catch (error) {
    console.error("Error creating calificación:", error);
    res.status(500).send({ message: error.message || "Failed to submit calificación." });
  }
};

// Obtener todas las calificaciones (para Admin/Moderador)
exports.getAllCalificaciones = async (req, res) => {
  try {
    const calificaciones = await db.calificaciones.findAll({
      include: [
        {
          model: db.projects,
          as: 'proyecto',
          attributes: ['name']
        },
        {
          model: db.users,
          as: 'evaluador',
          attributes: ['username']
        },
        {
          model: db.users,
          as: 'alumno',
          attributes: ['username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
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
    const calificaciones = await db.calificaciones.findAll({
      where: { proyectoId },
      include: [
        {
          model: db.users,
          as: 'evaluador',
          attributes: ['username', 'nombre']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
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
    const calificaciones = await db.calificaciones.findAll({
      where: { userEvaluadorId: evaluadorId },
      include: [
        {
          model: db.projects,
          as: 'proyecto',
          attributes: ['name']
        },
        {
          model: db.users,
          as: 'alumno',
          attributes: ['username', 'nombre']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
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

  try {
    // Verificar que la calificación existe
    const calificacion = await db.calificaciones.findByPk(id);
    if (!calificacion) {
      return res.status(404).send({ message: `Calificación with ID ${id} not found.` });
    }

    // Verificar autorización: solo el evaluador que la creó o un admin puede editarla
    if (calificacion.userEvaluadorId !== editorId) {
      // Verificar si el editor es admin
      const editor = await db.users.findByPk(editorId, {
        include: [{
          model: db.roles,
          through: db.user_roles,
          where: { name: 'admin' }
        }]
      });
      
      if (!editor || editor.roles.length === 0) {
        return res.status(403).send({ message: "Forbidden: You are not authorized to update this calificación." });
    }
    }

    // Preparar datos de actualización
    const updateData = {};
    if (innovacion !== undefined) updateData.innovacion = parseFloat(innovacion);
    if (mercado !== undefined) updateData.mercado = parseFloat(mercado);
    if (tecnica !== undefined) updateData.tecnica = parseFloat(tecnica);
    if (financiera !== undefined) updateData.financiera = parseFloat(financiera);
    if (pitch !== undefined) updateData.pitch = parseFloat(pitch);
    if (observaciones !== undefined) updateData.observaciones = observaciones;
    if (finalTotal !== undefined) updateData.total = finalTotal;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).send({ message: "No fields to update provided." });
    }

    await calificacion.update(updateData);
    res.status(200).send({ message: "Calificación updated successfully." });

  } catch (error) {
    console.error(`Error updating calificación with ID ${id}:`, error);
    res.status(500).send({ message: error.message || "Failed to update calificación." });
  }
};

// Eliminar una calificación (solo el evaluador que la creó o admin)
exports.deleteCalificacion = async (req, res) => {
  const { id } = req.params; 
  const deleterId = req.userId;

  try {
    const calificacion = await db.calificaciones.findByPk(id);
    if (!calificacion) {
      return res.status(404).send({ message: `Calificación with ID ${id} not found.` });
    }

    // Verificar autorización: solo el evaluador que la creó o un admin puede eliminarla
    if (calificacion.userEvaluadorId !== deleterId) {
      // Verificar si el deleter es admin
      const deleter = await db.users.findByPk(deleterId, {
        include: [{
          model: db.roles,
          through: db.user_roles,
          where: { name: 'admin' }
        }]
      });
      
      if (!deleter || deleter.roles.length === 0) {
        return res.status(403).send({ message: "Forbidden: You are not authorized to delete this calificación." });
    }
    }

    await calificacion.destroy();
    res.status(200).send({ message: "Calificación deleted successfully." });

  } catch (error) {
    console.error(`Error deleting calificación with ID ${id}:`, error);
    res.status(500).send({ message: error.message || "Failed to delete calificación." });
  }
};