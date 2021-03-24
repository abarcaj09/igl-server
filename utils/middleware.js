// express middleware

const log = require("./log");

const requestLog = (req, res, next) => {
  log.info(`Method: ${req.method}`);
  log.info(`Path: ${req.path}`);
  log.info(`Body: ${req.body}`);
  log.info("----");
  next();
};

const unknownEndpoint = (req, res) => {
  res.status(404).json({ error: "Unknown Endpoint" });
};

const errorHandler = (error, req, res, next) => {
  log.error(error.name);
  log.error(error.message);

  if (error.name === "CastError") {
    return res.status(400).json({ error: "Malformatted ID" });
  }

  next(error);
};

module.exports = {
  requestLog,
  unknownEndpoint,
  errorHandler,
};
