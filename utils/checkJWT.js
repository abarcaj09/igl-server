const jwt = require("jsonwebtoken");

const checkJWT = (req, res, next) => {
  const authHeader = req.get("authorization");

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.substring(7);
    const verifiedToken = jwt.verify(token, process.env.SECRET);
    req.userId = verifiedToken.id;
    req.username = verifiedToken.username;
    next();
  } else {
    res
      .status(401)
      .json({ error: "Authorization header is missing or invalid" });
  }
};

module.exports = checkJWT;
