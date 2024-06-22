const db = require("../models");
const { proyecto: Proyecto } = db;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
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
      res.status(500).send({ message: err.message });
    });
};
