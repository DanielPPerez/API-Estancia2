const db = require('../models'); 
const fs = require("fs");
const path = require("path");

// Obtener referencias a los modelos con nombres correctos
const Proyecto = db.projects || db.proyecto;
const User = db.users || db.user;
const Role = db.roles || db.role;
const UserRoles = db.user_roles;

// Crear un nuevo proyecto 
exports.createProject = async (req, res) => {
  const userId = req.userId; 
  const { nombreProyecto, descripcion, videoPitch } = req.body; 

  if (!userId || !nombreProyecto) {
    return res.status(400).send({ message: "User ID and Project Name are required." });
  }

  const fichaTecnicaPath = req.files && req.files['fichaTecnica'] ? req.files['fichaTecnica'][0].path : null;
  const modeloCanvaPath = req.files && req.files['modeloCanva'] ? req.files['modeloCanva'][0].path : null;
  const pdfProyectoPath = req.files && req.files['pdfProyecto'] ? req.files['pdfProyecto'][0].path : null;

  // Determinar estatus automáticamente
  let estatus = 'no subido';
  if (fichaTecnicaPath && modeloCanvaPath && pdfProyectoPath) {
    estatus = 'subido';
  }

  try {
    const project = await Proyecto.create({
      idUser: userId,
      name: nombreProyecto,
      description: descripcion,
      videoLink: videoPitch,
      technicalSheet: fichaTecnicaPath,
      canvaModel: modeloCanvaPath,
      projectPdf: pdfProyectoPath,
      estatus
    });
    
    res.status(201).send({ id: project.id, message: "Project created successfully!", estatus });
  } catch (error) {
    console.error("Error creating project:", error);
    if (fichaTecnicaPath && fs.existsSync(fichaTecnicaPath)) fs.unlinkSync(fichaTecnicaPath);
    if (modeloCanvaPath && fs.existsSync(modeloCanvaPath)) fs.unlinkSync(modeloCanvaPath);
    if (pdfProyectoPath && fs.existsSync(pdfProyectoPath)) fs.unlinkSync(pdfProyectoPath);
    res.status(500).send({ message: error.message || "Some error occurred while creating the project." });
  }
};

// Obtener todos los proyectos (con información básica del usuario)
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Proyecto.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'nombre', 'categoria']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).send(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send({ message: error.message || "Some error occurred while retrieving projects." });
  }
};

// Obtener un proyecto por ID
exports.getProjectById = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await Proyecto.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'nombre', 'email']
      }]
    });
    
    if (!project) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }
    
    res.status(200).send(project);
  } catch (error) {
    console.error(`Error fetching project with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Error retrieving project with id " + id });
  }
};

// Obtener todos los proyectos de un usuario específico 
exports.getProjectsByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'categoria', 'carrera'],
      include: [{
        model: Proyecto,
        as: 'proyectos',
        attributes: ['id', 'name', 'description', 'videoLink', 'createdAt'],
        order: [['createdAt', 'DESC']]
      }]
    });
    
    if (!user) {
      return res.status(404).send({ message: `User with ID ${userId} not found.` });
    }
    
    res.status(200).send(user); 
  } catch (error) {
    console.error(`Error fetching projects for user ${userId}:`, error);
    res.status(500).send({ message: error.message || "Error fetching user projects." });
  }
};

// Actualizar un proyecto por ID
exports.updateProject = async (req, res) => {
  const { id } = req.params; 
  const { nombreProyecto, descripcion, videoPitch, estatus } = req.body; 
  const userId = req.userId; 

  try {
    const project = await Proyecto.findByPk(id);
    if (!project) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }

    // Autorización: solo el dueño o un admin puede editar
    if (project.idUser !== userId) {
      // Verificar si el usuario es admin
      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          through: UserRoles,
          where: { name: 'admin' }
        }]
      });
      
      if (!user || user.roles.length === 0) {
        return res.status(403).send({ message: "Forbidden: You are not authorized to update this project." });
      }
    }

    // Manejo de archivos: si se suben nuevos, usar esas rutas, sino mantener las antiguas
    const fichaTecnicaPath = req.files && req.files['fichaTecnica'] ? req.files['fichaTecnica'][0].path : project.technicalSheet;
    const modeloCanvaPath = req.files && req.files['modeloCanva'] ? req.files['modeloCanva'][0].path : project.canvaModel;
    const pdfProyectoPath = req.files && req.files['pdfProyecto'] ? req.files['pdfProyecto'][0].path : project.projectPdf;

    const updateData = {};
    if (nombreProyecto !== undefined) updateData.name = nombreProyecto;
    if (descripcion !== undefined) updateData.description = descripcion;
    if (videoPitch !== undefined) updateData.videoLink = videoPitch;
    if (estatus !== undefined) updateData.estatus = estatus;
    
    // Si se subió un nuevo archivo, la ruta ya está en la variable correspondiente
    if (req.files && req.files['fichaTecnica']) updateData.technicalSheet = fichaTecnicaPath;
    if (req.files && req.files['modeloCanva']) updateData.canvaModel = modeloCanvaPath;
    if (req.files && req.files['pdfProyecto']) updateData.projectPdf = pdfProyectoPath;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).send({ message: "No fields to update provided." });
    }

    await project.update(updateData);

    // Eliminar archivos antiguos si se subieron nuevos
    if (req.files && req.files['fichaTecnica'] && project.technicalSheet && project.technicalSheet !== fichaTecnicaPath && fs.existsSync(project.technicalSheet)) {
      fs.unlinkSync(project.technicalSheet);
    }

    res.status(200).send({ message: "Project updated successfully." });
  } catch (error) {
    console.error(`Error updating project with id ${id}:`, error);

    if (req.files && req.files['fichaTecnica'] && fs.existsSync(fichaTecnicaPath) && fichaTecnicaPath !== project.technicalSheet) {
      fs.unlinkSync(fichaTecnicaPath);
    }

    res.status(500).send({ message: error.message || "Error updating project." });
  }
};

// Eliminar un proyecto por ID
exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId; 

  try {
    const project = await Proyecto.findByPk(id);
    if (!project) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }

    // Autorización: solo el dueño o un admin puede eliminar
    if (project.idUser !== userId) {
      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          through: UserRoles,
          where: { name: 'admin' }
        }]
      });
      
      if (!user || user.roles.length === 0) {
        return res.status(403).send({ message: "Forbidden: You are not authorized to delete this project." });
      }
    }

    // Eliminar archivos asociados
    if (project.technicalSheet && fs.existsSync(project.technicalSheet)) {
      fs.unlinkSync(project.technicalSheet);
    }
    if (project.canvaModel && fs.existsSync(project.canvaModel)) {
      fs.unlinkSync(project.canvaModel);
    }
    if (project.projectPdf && fs.existsSync(project.projectPdf)) {
      fs.unlinkSync(project.projectPdf);
    }

    await project.destroy();
    res.status(200).send({ message: "Project deleted successfully." });
  } catch (error) {
    console.error(`Error deleting project with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Could not delete project with id " + id });
  }
};

// Descargar archivo de proyecto
exports.downloadProjectFile = async (req, res) => {
  const { projectId, fileType } = req.params;
  
  try {
    const project = await Proyecto.findByPk(projectId);
    if (!project) {
      return res.status(404).send({ message: "Project not found." });
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
        return res.status(400).send({ message: "Invalid file type." });
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).send({ message: "File not found." });
    }

    res.download(filePath, fileName);
  } catch (error) {
    console.error("Error downloading project file:", error);
    res.status(500).send({ message: "Error downloading file." });
  }
};