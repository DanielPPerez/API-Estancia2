const db = require('../models'); 
const fs = require("fs");
const path = require("path");

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
    const project = await db.proyecto.create({
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
    const projects = await db.proyecto.findAll({
      include: [{
        model: db.user,
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
    const project = await db.proyecto.findByPk(id, {
      include: [{
        model: db.user,
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
    const user = await db.user.findByPk(userId, {
      attributes: ['id', 'username', 'categoria', 'carrera'],
      include: [{
        model: db.proyecto,
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
    const project = await db.proyecto.findByPk(id);
    if (!project) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }

    // Autorización: solo el dueño o un admin puede editar
    if (project.idUser !== userId) {
      // Verificar si el usuario es admin
      const user = await db.user.findByPk(userId, {
        include: [{
          model: db.role,
          through: db.user_roles,
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
    const project = await db.proyecto.findByPk(id);
    if (!project) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }

    // Autorización: solo el dueño o un admin puede eliminar
    if (project.idUser !== userId) {
      const user = await db.user.findByPk(userId, {
        include: [{
          model: db.role,
          through: db.user_roles,
          where: { name: 'admin' }
        }]
      });
      
      if (!user || user.roles.length === 0) {
        return res.status(403).send({ message: "Forbidden: You are not authorized to delete this project." });
      }
    }

    // Guardar rutas de archivos antes de eliminar
    const technicalSheetPath = project.technicalSheet;
    const canvaModelPath = project.canvaModel;
    const projectPdfPath = project.projectPdf;

    await project.destroy();

    // Eliminar archivos del sistema de archivos
    if (technicalSheetPath && fs.existsSync(technicalSheetPath)) {
      fs.unlinkSync(technicalSheetPath);
    }
    if (canvaModelPath && fs.existsSync(canvaModelPath)) {
      fs.unlinkSync(canvaModelPath);
    }
    if (projectPdfPath && fs.existsSync(projectPdfPath)) {
      fs.unlinkSync(projectPdfPath);
    }

    res.status(200).send({ message: "Project and associated files deleted successfully." });
  } catch (error) {
    console.error(`Error deleting project with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Could not delete project." });
  }
};

// Descargar un archivo de proyecto
exports.downloadProjectFile = async (req, res) => {
  const { projectId, fileType } = req.params; 

  if (!projectId || !fileType) {
    return res.status(400).send({ message: "Project ID and File Type are required." });
  }

  let filePathColumn;
  switch (fileType.toLowerCase()) {
    case 'technicalsheet':
      filePathColumn = 'technicalSheet';
      break;
    case 'canvamodel':
      filePathColumn = 'canvaModel';
      break;
    case 'projectpdf':
      filePathColumn = 'projectPdf';
      break;
    default:
      return res.status(400).send({ message: "Invalid file type specified." });
  }

  try {
    const project = await db.proyecto.findByPk(projectId);
    if (!project) {
      return res.status(404).send({ message: `Project with id ${projectId} not found.` });
    }

    const filePath = project[filePathColumn];
    if (!filePath) {
      return res.status(404).send({ message: `File of type '${fileType}' not found for this project.` });
    }

    if (!fs.existsSync(filePath)) {
      console.error("File does not exist on filesystem:", filePath);
      return res.status(404).send({ message: "The file does not exist on the server." });
    }

    // Obtener el nombre original del archivo para la descarga
    const filename = path.basename(filePath); 

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        if (!res.headersSent) {
          res.status(500).send({ message: "Could not download the file." });
        }
      } else {
        console.log("File downloaded successfully:", filename);
      }
    });

  } catch (err) {
    console.error("Error in downloadProjectFile:", err);
    if (!res.headersSent) {
      res.status(500).send({ message: "Server error while trying to download file." });
    }
  }
};