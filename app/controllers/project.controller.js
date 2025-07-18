const db = require('../models'); 
const fs = require("fs");
const path = require("path");
const { UPLOADS_DIR } = require('../middleware/uploadFiles');

// Obtener referencias a los modelos con nombres correctos
const Proyecto = db.proyectos;
const User = db.user;
const Role = db.roles;
const UserRoles = db.user_roles;

// Crear un nuevo proyecto 
exports.createProject = async (req, res) => {
  const userId = req.userId; 
  const { nombreProyecto, descripcion, videoPitch } = req.body; 

  if (!userId || !nombreProyecto) {
    return res.status(400).send({ message: "User ID and Project Name are required." });
  }

  console.log('📁 Archivos recibidos:', req.files);
  console.log('📝 Datos del body:', req.body);

  const fichaTecnicaPath = req.files && req.files['fichaTecnica'] ? req.files['fichaTecnica'][0].path : null;
  const modeloCanvaPath = req.files && req.files['modeloCanva'] ? req.files['modeloCanva'][0].path : null;
  const pdfProyectoPath = req.files && req.files['pdfProyecto'] ? req.files['pdfProyecto'][0].path : null;

  console.log('📂 Rutas de archivos:');
  console.log('Ficha técnica:', fichaTecnicaPath);
  console.log('Modelo Canva:', modeloCanvaPath);
  console.log('PDF Proyecto:', pdfProyectoPath);

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
    
    console.log('✅ Proyecto creado exitosamente:', project.id);
    res.status(201).send({ id: project.id, message: "Project created successfully!", estatus });
  } catch (error) {
    console.error("Error creating project:", error);
    // Limpiar archivos si hay error
    if (fichaTecnicaPath && fs.existsSync(fichaTecnicaPath)) fs.unlinkSync(fichaTecnicaPath);
    if (modeloCanvaPath && fs.existsSync(modeloCanvaPath)) fs.unlinkSync(modeloCanvaPath);
    if (pdfProyectoPath && fs.existsSync(pdfProyectoPath)) fs.unlinkSync(pdfProyectoPath);
    res.status(500).send({ message: error.message || "Some error occurred while creating the project." });
  }
};

// Obtener todos los proyectos (con información básica del usuario)
exports.getAllProjects = async (req, res) => {
  try {
    // Primero intentar sin include para verificar que el modelo funciona
    const projects = await Proyecto.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    // Si hay proyectos, obtener información de usuarios por separado
    if (projects.length > 0) {
      const userIds = [...new Set(projects.map(p => p.idUser))];
      const users = await db.user.findAll({
        where: { id: userIds },
        attributes: ['id', 'username', 'nombre', 'categoria']
      });
      
      // Crear un mapa de usuarios para acceso rápido
      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = user;
      });
      
      // Agregar información de usuario a cada proyecto
      const projectsWithUsers = projects.map(project => {
        const projectData = project.toJSON();
        projectData.user = userMap[project.idUser] || null;
        return projectData;
      });
      
      res.status(200).send(projectsWithUsers);
    } else {
    res.status(200).send(projects);
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send({ message: error.message || "Some error occurred while retrieving projects." });
  }
};

// Obtener un proyecto por ID
exports.getProjectById = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await Proyecto.findByPk(id);
    
    if (!project) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }
    
    // Obtener información del usuario por separado
    const user = await db.user.findByPk(project.idUser, {
      attributes: ['username', 'nombre', 'email']
    });
    
    const projectData = project.toJSON();
    projectData.user = user;
    
    res.status(200).send(projectData);
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
        model: db.proyectos,
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
      const user = await db.user.findByPk(userId, {
        include: [{
          model: db.roles,
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
    const project = await Proyecto.findByPk(id);
    if (!project) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }

    // Autorización: solo el dueño o un admin puede eliminar
    if (project.idUser !== userId) {
      const user = await db.user.findByPk(userId, {
        include: [{
          model: db.roles,
          through: db.user_roles,
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

  console.log(`📥 Solicitud de descarga: Proyecto ${projectId}, Archivo ${fileType}`);
  console.log(`📁 Upload directory: ${UPLOADS_DIR}`);

  try {
    const project = await Proyecto.findByPk(projectId);
    if (!project) {
      console.log(`❌ Proyecto ${projectId} no encontrado`);
      return res.status(404).send({ message: "Project not found." });
    }

    console.log(`✅ Proyecto encontrado: "${project.name}"`);

    let filePath = null;
    let fileName = '';

    switch (fileType) {
      case 'technicalSheet':
        filePath = project.technicalSheet;
        fileName = `ficha_tecnica_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        break;
      case 'canvaModel':
        filePath = project.canvaModel;
        fileName = `modelo_canvas_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        break;
      case 'projectPdf':
        filePath = project.projectPdf;
        fileName = `proyecto_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        break;
      default:
        console.log(`❌ Tipo de archivo inválido: ${fileType}`);
        return res.status(400).send({ message: "Invalid file type." });
    }

    console.log(`📁 Ruta del archivo en BD: ${filePath}`);
    console.log(`📄 Nombre del archivo: ${fileName}`);

    if (!filePath) {
      console.log(`❌ No hay ruta configurada para ${fileType}`);
      return res.status(404).send({ message: `No file path configured for ${fileType}.` });
    }

    // Estrategia mejorada para encontrar el archivo
    let absolutePath = null;
    
    // Opción 1: Verificar si la ruta absoluta existe
    if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
      absolutePath = filePath;
      console.log(`✅ Archivo encontrado en ruta absoluta: ${absolutePath}`);
    }
    // Opción 2: Buscar por nombre de archivo en el directorio de uploads
    else {
      const fileNameFromPath = path.basename(filePath);
      const uploadsPath = path.join(UPLOADS_DIR, fileNameFromPath);
      
      if (fs.existsSync(uploadsPath)) {
        absolutePath = uploadsPath;
        console.log(`✅ Archivo encontrado en uploads: ${absolutePath}`);
      } else {
        console.log(`❌ Archivo no encontrado: ${fileNameFromPath}`);
        
        // Opción 3: Buscar archivos similares en el directorio de uploads
        try {
          const files = fs.readdirSync(UPLOADS_DIR);
          console.log(`📄 Archivos disponibles en ${UPLOADS_DIR}:`, files);
          
          // Buscar archivos que coincidan con el tipo de archivo
          const fileTypePatterns = {
            'technicalSheet': ['ficha', 'technical', 'sheet'],
            'canvaModel': ['canva', 'canvas', 'model'],
            'projectPdf': ['proyecto', 'project', 'pdf', 'resumen']
          };
          
          const patterns = fileTypePatterns[fileType] || [];
          const matchingFiles = files.filter(file => 
            patterns.some(pattern => file.toLowerCase().includes(pattern))
          );
          
          if (matchingFiles.length > 0) {
            absolutePath = path.join(UPLOADS_DIR, matchingFiles[0]);
            console.log(`✅ Usando archivo similar: ${matchingFiles[0]}`);
          } else {
            console.log(`❌ No se encontraron archivos similares para ${fileType}`);
          }
        } catch (error) {
          console.log(`❌ Error listando archivos: ${error.message}`);
        }
      }
    }

    if (!absolutePath || !fs.existsSync(absolutePath)) {
      console.log(`❌ No se pudo encontrar el archivo para ${fileType}`);
      return res.status(404).send({ 
        message: "File not found on disk.",
        details: `Could not locate ${fileType} for project ${projectId}`
      });
    }

    console.log(`✅ Archivo encontrado, iniciando descarga: ${absolutePath}`);
    
    // Verificar que el archivo es legible
    try {
      fs.accessSync(absolutePath, fs.constants.R_OK);
    } catch (error) {
      console.error(`❌ Archivo no es legible: ${absolutePath}`);
      return res.status(500).send({ message: "File is not readable." });
    }
    
    res.download(absolutePath, fileName);
  } catch (error) {
    console.error("❌ Error downloading project file:", error);
    res.status(500).send({ message: "Error downloading file." });
  }
};