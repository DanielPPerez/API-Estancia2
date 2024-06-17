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
  // Aquí puedes procesar la subida del proyecto
  const userId = req.userId; // Este ID proviene del token
  const {
    projectName,
    projectDescription,
    videoLink,
    technicalSheet,
    canvaModel,
    projectPdf,
  } = req.body;

  // Guarda el proyecto en la base de datos, asociándolo con userId
  // Ejemplo:
  Project.create({
    userId: userId,
    name: projectName,
    description: projectDescription,
    videoLink: videoLink,
    technicalSheet: technicalSheet,
    canvaModel: canvaModel,
    projectPdf: projectPdf,
  })
    .then(() => {
      res.status(200).send({ message: "Project uploaded successfully!" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
