// Se importa 'cloudinary' para poder interactuar con la API (ej: eliminar archivos).
const cloudinary = require('cloudinary').v2;
const db = require('../models');

// Se obtienen las referencias a los modelos de la base de datos.
const Proyecto = db.projects;
const User = db.user;
const Role = db.roles;
const UserRoles = db.user_roles;

/**
 * Función auxiliar para extraer el ID público de una URL de Cloudinary.
 * Esto es crucial para poder decirle a Cloudinary qué archivo específico eliminar.
 * @param {string} url - La URL completa del archivo en Cloudinary.
 * @returns {string|null} - El public_id con su carpeta, ej: 'proyectos_pdf/fichaTecnica-12345'
 */
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    // La parte que nos interesa está después de '/upload/'.
    const startIndex = url.indexOf('/upload/') + '/upload/'.length;
    // Y termina justo antes de la versión (v123456) si existe.
    const versionIndex = url.indexOf('/v', startIndex);
    const relevantPart = url.substring(versionIndex + 1); // Cortamos desde la 'v'
    const publicIdWithFormat = relevantPart.substring(relevantPart.indexOf('/') + 1); // Quitamos la versión
    const publicId = publicIdWithFormat.substring(0, publicIdWithFormat.lastIndexOf('.')); // Quitamos la extensión .pdf
    return publicId;
  } catch (error) {
    console.error('Could not extract public_id from URL:', url, error);
    return null;
  }
};


// --- CONTROLADORES DE RUTAS ---

/**
 * Crear un nuevo proyecto con subida de archivos a Cloudinary.
 */
exports.createProject = async (req, res) => {
  const userId = req.userId;
  const { nombreProyecto, descripcion, videoPitch } = req.body;

  if (!userId || !nombreProyecto) {
    return res.status(400).send({ message: "User ID and Project Name are required." });
  }

  // Objeto para almacenar las URLs de los archivos subidos.
  const fileUrls = {};
  if (req.cloudinary_files && req.cloudinary_files.length > 0) {
    req.cloudinary_files.forEach(file => {
      // Mapeamos cada archivo a su campo correspondiente basándonos en el 'public_id'
      // que generamos en el middleware.
      if (file.public_id.startsWith('proyectos_pdf/fichaTecnica')) {
        fileUrls.technicalSheet = file.secure_url;
      } else if (file.public_id.startsWith('proyectos_pdf/modeloCanva')) {
        fileUrls.canvaModel = file.secure_url;
      } else if (file.public_id.startsWith('proyectos_pdf/pdfProyecto')) {
        fileUrls.projectPdf = file.secure_url;
      }
    });
  }

  // Determinar estatus automáticamente.
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
      // Se guardan las URLs de Cloudinary en la base de datos.
      technicalSheet: fileUrls.technicalSheet || null,
      canvaModel: fileUrls.canvaModel || null,
      projectPdf: fileUrls.projectPdf || null,
      estatus
    });

    console.log('✅ Project created successfully with Cloudinary URLs:', project.id);
    res.status(201).send({ id: project.id, message: "Project created successfully!", estatus });
  } catch (error) {
    console.error("Error creating project:", error);
    // Ya no es necesario limpiar archivos locales en caso de error.
    res.status(500).send({ message: error.message || "Some error occurred while creating the project." });
  }
};

/**
 * Obtener todos los proyectos con información básica de su autor.
 */
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Proyecto.findAll({
      order: [['createdAt', 'DESC']]
    });

    if (projects.length > 0) {
      const userIds = [...new Set(projects.map(p => p.idUser))];
      const users = await User.findAll({
        where: { id: userIds },
        attributes: ['id', 'username', 'nombre', 'categoria']
      });

      const userMap = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

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

/**
 * Obtener un proyecto específico por su ID.
 */
exports.getProjectById = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await Proyecto.findByPk(id);

    if (!project) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }

    const user = await User.findByPk(project.idUser, {
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

/**
 * Obtener todos los proyectos de un usuario específico.
 */
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

/**
 * Actualizar un proyecto, manejando el reemplazo de archivos en Cloudinary.
 */
exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { nombreProyecto, descripcion, videoPitch, estatus } = req.body;
  const userId = req.userId;

  try {
    const project = await Proyecto.findByPk(id);
    if (!project) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }

    // Lógica de autorización (sin cambios)
    if (project.idUser !== userId) {
      const user = await User.findByPk(userId, { include: Role });
      const isAdmin = user.roles.some(role => role.name === 'admin');
      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden: You are not authorized to update this project." });
      }
    }

    const updateData = {};
    if (nombreProyecto !== undefined) updateData.name = nombreProyecto;
    if (descripcion !== undefined) updateData.description = descripcion;
    if (videoPitch !== undefined) updateData.videoLink = videoPitch;
    if (estatus !== undefined) updateData.estatus = estatus;

    // Manejo de reemplazo de archivos.
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
          updateData[fieldNameInDb] = file.secure_url; // Actualizar con la nueva URL.
          if (oldFileUrl) {
            const publicIdToDelete = extractPublicIdFromUrl(oldFileUrl);
            if (publicIdToDelete) {
              console.log(`🗑️ Deleting old file from Cloudinary: ${publicIdToDelete}`);
              // Eliminar el archivo antiguo de la nube.
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

/**
 * Eliminar un proyecto, incluyendo sus archivos de Cloudinary.
 */
exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const project = await Proyecto.findByPk(id);
    if (!project) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }

    // Lógica de autorización (sin cambios)
    if (project.idUser !== userId) {
        const user = await User.findByPk(userId, { include: Role });
        const isAdmin = user.roles.some(role => role.name === 'admin');
        if (!isAdmin) {
          return res.status(403).send({ message: "Forbidden: You are not authorized to delete this project." });
        }
    }

    // Crear un array con todas las URLs de archivos que existen.
    const filesToDelete = [
      project.technicalSheet,
      project.canvaModel,
      project.projectPdf
    ].filter(Boolean); // 'Boolean' como filtro elimina valores null o undefined.

    if (filesToDelete.length > 0) {
      const deletePromises = filesToDelete.map(url => {
        const publicId = extractPublicIdFromUrl(url);
        if (publicId) {
          console.log(`🗑️ Deleting project file from Cloudinary: ${publicId}`);
          return cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        }
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

/**
 * Redirigir al usuario para descargar un archivo del proyecto.
 */
exports.downloadProjectFile = async (req, res) => {
  const { projectId, fileType } = req.params;

  try {
    const project = await Proyecto.findByPk(projectId);
    if (!project) {
      return res.status(404).send({ message: "Project not found." });
    }

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

    // En lugar de descargar desde nuestro servidor, redirigimos al cliente
    // a la URL de Cloudinary para que lo descargue directamente desde allí.
    console.log(`➡️ Redirecting user to Cloudinary URL: ${fileUrl}`);
    res.redirect(302, fileUrl);

  } catch (error) {
    console.error("❌ Error processing download request:", error);
    res.status(500).send({ message: "Error processing file download." });
  }
};