const db = require('../models'); 

const cloudinary = require('cloudinary').v2;

// Obtener referencias a los modelos con nombres correctos
const Proyecto = db.proyectos;
const User = db.user;
const Role = db.roles;
const UserRoles = db.user_roles;

// --> HELPER: Una función útil para extraer el public_id de una URL de Cloudinary.
// Esto es necesario para poder eliminar archivos.
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  // Ejemplo de URL: http://res.cloudinary.com/cloud_name/resource_type/upload/v12345/folder/public_id.format
  const urlParts = url.split('/');
  const publicIdWithFormat = urlParts[urlParts.length - 1];
  const publicId = publicIdWithFormat.split('.')[0];
  const folder = urlParts[urlParts.length - 2];
  return `${folder}/${publicId}`;
};

/// Crear un nuevo proyecto
exports.createProject = async (req, res) => {
  const userId = req.userId;
  const { nombreProyecto, descripcion, videoPitch } = req.body;

  if (!userId || !nombreProyecto) {
    return res.status(400).send({ message: "User ID and Project Name are required." });
  }

  // --> CAMBIO: Ya no usamos req.files[...].path. Ahora leemos req.cloudinary_files
  // que es un array que nuestro middleware ha preparado.
  const fileUrls = {};
  if (req.cloudinary_files && req.cloudinary_files.length > 0) {
    req.cloudinary_files.forEach(file => {
      // Mapeamos el archivo subido a su campo original basándonos en el public_id
      // que diseñamos en el middleware (ej: 'fichaTecnica-167...').
      if (file.public_id.startsWith('proyectos_pdf/fichaTecnica')) {
        fileUrls.technicalSheet = file.secure_url;
      }
      if (file.public_id.startsWith('proyectos_pdf/modeloCanva')) {
        fileUrls.canvaModel = file.secure_url;
      }
      if (file.public_id.startsWith('proyectos_pdf/pdfProyecto')) {
        fileUrls.projectPdf = file.secure_url;
      }
    });
  }

  // Determinar estatus automáticamente
  let estatus = 'no subido';
  if (fileUrls.technicalSheet && fileUrls.canvaModel && fileUrls.projectPdf) {
    estatus = 'subido';
  }

  try {
    const project = await Proyecto.create({
      idUser: userId,
      name: nombreProyecto,
      description: descripcion,
      videoLink: videoPitch,
      // --> CAMBIO: Guardamos las URLs de Cloudinary, no las rutas locales.
      technicalSheet: fileUrls.technicalSheet || null,
      canvaModel: fileUrls.canvaModel || null,
      projectPdf: fileUrls.projectPdf || null,
      estatus
    });

    console.log('✅ Proyecto creado exitosamente con URLs de Cloudinary:', project.id);
    res.status(201).send({ id: project.id, message: "Project created successfully!", estatus });
  } catch (error) {
    console.error("Error creating project:", error);
    // --> CAMBIO: Ya no hay archivos locales que limpiar en caso de error.
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

  const updateData = {};
  if (nombreProyecto !== undefined) updateData.name = nombreProyecto;
  if (descripcion !== undefined) updateData.description = descripcion;
  if (videoPitch !== undefined) updateData.videoLink = videoPitch;
  if (estatus !== undefined) updateData.estatus = estatus;

  // --> CAMBIO: Manejo de actualización de archivos con Cloudinary
  if (req.cloudinary_files && req.cloudinary_files.length > 0) {
    for (const file of req.cloudinary_files) {
      let fieldNameInDb = null;
      let oldFileUrl = null;

      if (file.public_id.startsWith('proyectos_pdf/fichaTecnica')) {
        fieldNameInDb = 'technicalSheet';
        oldFileUrl = project.technicalSheet;
      } else if (file.public_id.startsWith('proyectos_pdf/modeloCanva')) {
        fieldNameInDb = 'canvaModel';
        oldFileUrl = project.canvaModel;
      } else if (file.public_id.startsWith('proyectos_pdf/pdfProyecto')) {
        fieldNameInDb = 'projectPdf';
        oldFileUrl = project.projectPdf;
      }

      if (fieldNameInDb) {
        // Asignar la nueva URL
        updateData[fieldNameInDb] = file.secure_url;

        // Si había un archivo antiguo, eliminarlo de Cloudinary
        if (oldFileUrl) {
          const publicIdToDelete = extractPublicIdFromUrl(oldFileUrl);
          if (publicIdToDelete) {
            console.log(`🗑️ Deleting old file from Cloudinary: ${publicIdToDelete}`);
            // Hacemos la eliminación sin esperar (fire and forget) para no retrasar la respuesta.
            cloudinary.uploader.destroy(publicIdToDelete, { resource_type: 'raw' });
          }
        }
      }
    }
  }

  await project.update(updateData);
  res.status(200).send({ message: "Project updated successfully." });
} catch (error) {
  console.error(`Error updating project with id ${id}:`, error);
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

    
    // --> CAMBIO: Eliminar archivos de Cloudinary antes de eliminar el proyecto.
    const filesToDelete = [
      project.technicalSheet,
      project.canvaModel,
      project.projectPdf
    ].filter(url => url); // Filtra para solo tener URLs válidas

    if (filesToDelete.length > 0) {
      const deletePromises = filesToDelete.map(url => {
        const publicId = extractPublicIdFromUrl(url);
        if (publicId) {
          console.log(`🗑️ Deleting project file from Cloudinary: ${publicId}`);
          return cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises);
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

    // --> CAMBIO RADICAL: La lógica es mucho más simple ahora.
    let fileUrl = null;

    switch (fileType) {
      case 'technicalSheet':
        fileUrl = project.technicalSheet;
        break;
      case 'canvaModel':
        fileUrl = project.canvaModel;
        break;
      case 'projectPdf':
        fileUrl = project.projectPdf;
        break;
      default:
        return res.status(400).send({ message: "Invalid file type." });
    }

    if (!fileUrl) {
      return res.status(404).send({ message: "File not found for this project." });
    }

    // --> En lugar de res.download(), simplemente redirigimos al cliente a la URL de Cloudinary.
    console.log(`➡️ Redirecting user to Cloudinary URL: ${fileUrl}`);
    res.redirect(302, fileUrl);

  } catch (error) {
    console.error("❌ Error processing download request:", error);
    res.status(500).send({ message: "Error processing file download." });
  }
};