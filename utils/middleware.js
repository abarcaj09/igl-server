// express middleware

const log = require("./log");

const requestLog = (req, res, next) => {
  log.info(`Method: ${req.method}`);
  log.info(`Path: ${req.path}`);
  log.info(`Body: ${JSON.stringify(req.body)}`);
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
  } else if (error.name === "JsonWebTokenError") {
    return res
      .status(401)
      .json({ error: "Invalid token (Try logging in again)" });
  } else if (error.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ error: "Token expired (Try logging in again)" });
  }

  next(error);
};

module.exports = {
  requestLog,
  unknownEndpoint,
  errorHandler,
};
