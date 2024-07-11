const fs = require("fs");
const path = require("path");
const db = require("../models");
const { user: User, user_roles: UserRoles, proyecto: Proyecto } = db;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = async (req, res) => {
  try {
    // Obtener todos los usuarios
    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        "email",
        "nombre",
        "carrera",
        "cuatrimestre",
        "categoria",
      ],
    });

    // Obtener todos los evaluadores (usuarios con roleId = 2)
    const evaluadorRoles = await UserRoles.findAll({
      where: { roleId: 2 },
    });

    const evaluadorIds = evaluadorRoles.map((role) => role.userId);

    // Filtrar usuarios que son evaluadores
    const evaluadores = users.filter((user) => evaluadorIds.includes(user.id));

    res.status(200).send({ usuarios: users, evaluadores: evaluadores });
  } catch (err) {
    console.error("Error en adminBoard:", err);
    res.status(500).send({ message: err.message });
  }
};

//-----------proyectos-----------
exports.getUserProjects = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "categoria"],
      include: [
        {
          model: Proyecto,
          as: "proyectos",
        },
      ],
    });

    res.status(200).send(users);
  } catch (err) {
    console.error("Error fetching user projects:", err);
    res.status(500).send({ message: err.message });
  }
};

exports.downloadFile = (req, res) => {
  try {
    const fileId = req.params.id; // Obtener el ID del archivo desde los parámetros de la ruta

    // Construir la ruta completa del archivo basado en el ID recibido
    const filePath = path.join(`/var/data/uploads/${fileId}`);

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      console.error("File does not exist:", filePath);
      return res.status(404).send({
        message: "El archivo no existe.",
      });
    }

    // Descargar el archivo utilizando res.download()
    res.download(filePath, (err) => {
      if (err) {
        console.error("Error al descargar el archivo:", err);
        res.status(500).send({
          message: "No se pudo descargar el archivo.",
        });
      } else {
        console.log("Archivo descargado correctamente:", fileId);
      }
    });
  } catch (err) {
    console.error("Error en downloadFile:", err);
    res.status(500).send({
      message: "Error en el servidor.",
    });
  }
};
//-------------

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

exports.deleteUserByUsername = async (req, res) => {
  try {
    const username = req.params.username;

    // Buscar el usuario por su nombre de usuario
    const user = await User.findOne({ where: { username: username } });

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    // Eliminar el usuario
    await User.destroy({ where: { username: username } });

    res.status(200).send({ message: "User deleted successfully!" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send({ message: err.message });
  }
};

exports.uploadProject = (req, res) => {
  const userId = req.userId; // Este ID proviene del token
  const { nombreProyecto, descripcion, videoPitch } = req.body;

  const fichaTecnica = req.files["fichaTecnica"]
    ? req.files["fichaTecnica"][0].path
    : null;
  const modeloCanva = req.files["modeloCanva"]
    ? req.files["modeloCanva"][0].path
    : null;
  const pdfProyecto = req.files["pdfProyecto"]
    ? req.files["pdfProyecto"][0].path
    : null;

  Proyecto.create({
    idUser: userId,
    name: nombreProyecto,
    description: descripcion,
    videoLink: videoPitch,
    technicalSheet: fichaTecnica,
    canvaModel: modeloCanva,
    projectPdf: pdfProyecto,
  })
    .then(() => {
      res.status(200).send({ message: "Project uploaded successfully!" });
    })
    .catch((err) => {
      console.error("Error en uploadProject:", err);
      res.status(500).send({ message: err.message });
    });
};
