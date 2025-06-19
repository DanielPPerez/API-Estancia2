const pool = require('../config/db.config'); 
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

  try {
    const [result] = await pool.query(
      `INSERT INTO projects 
       (user_id, name, description, video_link, technical_sheet_path, canva_model_path, project_pdf_path) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, nombreProyecto, descripcion, videoPitch, fichaTecnicaPath, modeloCanvaPath, pdfProyectoPath]
    );
    res.status(201).send({ id: result.insertId, message: "Project created successfully!" });
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
    const [projects] = await pool.query(
      `SELECT p.id, p.name, p.description, p.video_link, 
              p.technical_sheet_path, p.canva_model_path, p.project_pdf_path,
              p.created_at, p.user_id, u.username as owner_username, u.nombre as owner_name
       FROM projects p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
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
    const [projects] = await pool.query(
      `SELECT p.*, u.username as owner_username, u.nombre as owner_name, u.email as owner_email
       FROM projects p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );
    if (projects.length === 0) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }
    res.status(200).send(projects[0]);
  } catch (error) {
    console.error(`Error fetching project with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Error retrieving project with id " + id });
  }
};

// Obtener todos los proyectos de un usuario específico 
exports.getProjectsByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const [userRows] = await pool.query("SELECT id, username, categoria, carrera FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) {
        return res.status(404).send({ message: `User with ID ${userId} not found.` });
    }
    const user = userRows[0];

    const [projects] = await pool.query(
      "SELECT id, name, description, video_link, created_at FROM projects WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    
    user.proyectos = projects; 
    res.status(200).send(user); 
  } catch (error) {
    console.error(`Error fetching projects for user ${userId}:`, error);
    res.status(500).send({ message: error.message || "Error fetching user projects." });
  }
};


// Actualizar un proyecto por ID
exports.updateProject = async (req, res) => {
  const { id } = req.params; 
  const { nombreProyecto, descripcion, videoPitch } = req.body;
  const userId = req.userId; 

  // Podrías querer verificar que el req.userId es el dueño del proyecto o es un admin
  // ...lógica de autorización aquí...

  // Obtener rutas de archivos actuales para posible eliminación si se reemplazan
  let oldProjectData;
  try {
    const [rows] = await pool.query("SELECT technical_sheet_path, canva_model_path, project_pdf_path, user_id FROM projects WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }
    oldProjectData = rows[0];

    // Autorización: solo el dueño o un admin puede editar (ejemplo simple)
    // Deberías tener una lógica de roles más robusta para esto.
    // if (oldProjectData.user_id !== userId && !req.userRoles.includes('admin')) { // Asumiendo que req.userRoles existe
    //   return res.status(403).send({ message: "Forbidden: You are not authorized to update this project." });
    // }

  } catch (error) {
    return res.status(500).send({ message: "Error fetching project data for update." });
  }

  // Manejo de archivos: si se suben nuevos, usar esas rutas, sino mantener las antiguas
  const fichaTecnicaPath = req.files && req.files['fichaTecnica'] ? req.files['fichaTecnica'][0].path : oldProjectData.technical_sheet_path;
  const modeloCanvaPath = req.files && req.files['modeloCanva'] ? req.files['modeloCanva'][0].path : oldProjectData.canva_model_path;
  const pdfProyectoPath = req.files && req.files['pdfProyecto'] ? req.files['pdfProyecto'][0].path : oldProjectData.project_pdf_path;

  const fieldsToUpdate = [];
  const params = [];

  if (nombreProyecto !== undefined) { fieldsToUpdate.push("name = ?"); params.push(nombreProyecto); }
  if (descripcion !== undefined) { fieldsToUpdate.push("description = ?"); params.push(descripcion); }
  if (videoPitch !== undefined) { fieldsToUpdate.push("video_link = ?"); params.push(videoPitch); }
  
  // Si se subió un nuevo archivo, la ruta ya está en la variable correspondiente
  if (req.files && req.files['fichaTecnica']) { fieldsToUpdate.push("technical_sheet_path = ?"); params.push(fichaTecnicaPath); }
  if (req.files && req.files['modeloCanva']) { fieldsToUpdate.push("canva_model_path = ?"); params.push(modeloCanvaPath); }
  if (req.files && req.files['pdfProyecto']) { fieldsToUpdate.push("project_pdf_path = ?"); params.push(pdfProyectoPath); }
  
  if (fieldsToUpdate.length === 0) {
    return res.status(400).send({ message: "No fields to update provided." });
  }

  let query = "UPDATE projects SET " + fieldsToUpdate.join(", ") + ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
  params.push(id);

  try {
    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: `Project with id ${id} not found or no changes made.` });
    }

    if (req.files && req.files['fichaTecnica'] && oldProjectData.technical_sheet_path && oldProjectData.technical_sheet_path !== fichaTecnicaPath && fs.existsSync(oldProjectData.technical_sheet_path)) {
        fs.unlinkSync(oldProjectData.technical_sheet_path);
    }
  

    res.status(200).send({ message: "Project updated successfully." });
  } catch (error) {
    console.error(`Error updating project with id ${id}:`, error);

    if (req.files && req.files['fichaTecnica'] && fs.existsSync(fichaTecnicaPath) && fichaTecnicaPath !== oldProjectData.technical_sheet_path) fs.unlinkSync(fichaTecnicaPath);

    res.status(500).send({ message: error.message || "Error updating project." });
  }
};

// Eliminar un proyecto por ID
exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId; 


  let projectData;
  try {
    const [rows] = await pool.query("SELECT user_id, technical_sheet_path, canva_model_path, project_pdf_path FROM projects WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }
    projectData = rows[0];

 
  } catch (error) {
    return res.status(500).send({ message: "Error fetching project data for deletion." });
  }

  try {
    const [result] = await pool.query("DELETE FROM projects WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: `Project with id ${id} not found.` });
    }

    // Eliminar archivos del sistema de archivos
    if (projectData.technical_sheet_path && fs.existsSync(projectData.technical_sheet_path)) {
      fs.unlinkSync(projectData.technical_sheet_path);
    }
    if (projectData.canva_model_path && fs.existsSync(projectData.canva_model_path)) {
      fs.unlinkSync(projectData.canva_model_path);
    }
    if (projectData.project_pdf_path && fs.existsSync(projectData.project_pdf_path)) {
      fs.unlinkSync(projectData.project_pdf_path);
    }

    res.status(200).send({ message: "Project and associated files deleted successfully." });
  } catch (error) {
    console.error(`Error deleting project with id ${id}:`, error);
    res.status(500).send({ message: error.message || "Could not delete project." });
  }
};


// Descargar un archivo de proyecto (adaptado de tu downloadFile)

exports.downloadProjectFile = async (req, res) => {
    const { projectId, fileType } = req.params; 

    if (!projectId || !fileType) {
        return res.status(400).send({ message: "Project ID and File Type are required." });
    }

    let filePathColumn;
    switch (fileType.toLowerCase()) {
        case 'technicalsheet':
            filePathColumn = 'technical_sheet_path';
            break;
        case 'canvamodel':
            filePathColumn = 'canva_model_path';
            break;
        case 'projectpdf':
            filePathColumn = 'project_pdf_path';
            break;
        default:
            return res.status(400).send({ message: "Invalid file type specified." });
    }

    try {
        const [projectRows] = await pool.query(
            `SELECT ${filePathColumn} FROM projects WHERE id = ?`,
            [projectId]
        );

        if (projectRows.length === 0) {
            return res.status(404).send({ message: `Project with id ${projectId} not found.` });
        }

        const filePath = projectRows[0][filePathColumn];

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
                // Evitar enviar otra respuesta si los encabezados ya se enviaron
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