// middleware to validate that all needed fields are given
// and that the fields meet the needed conditions

const hasSpaces = (str) => {
  return /\s/g.test(str);
};

const hasSpecialCharacter = (str) => {
  return /[^a-z0-9_]/.test(str);
};

const validEmailFormat = (email) => {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
    email
  );
};

const validateRegister = (req, res, next) => {
  const { name, username, email, password } = req.body;
  let errorMessages = [];

  if (!name || name.length < 2) {
    errorMessages.push("Full Name must be at least 2 characters long");
  }

  if (!username || username.length < 3 || username.length > 20) {
    errorMessages.push("Username must be between 3 and 20 characters long");
  }
  if (hasSpecialCharacter(username)) {
    errorMessages.push(
      "Username can't contain capital letters, spaces, or special characters"
    );
  }

  if (!password || password.length < 6 || hasSpaces(password)) {
    errorMessages.push(
      "Password must be at least 6 characters long and not have spaces"
    );
  }

  if (!email || !validEmailFormat(email)) {
    errorMessages.push("Invalid email format");
  }

  if (errorMessages.length) {
    return res.status(400).json({ error: errorMessages });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { account, password } = req.body;

  if (!account) {
    return res.status(400).json({ error: "Username/email is required" });
  } else if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  next();
};

const validateProfileEdits = (req, res, next) => {
  const { name, biography } = req.body;

  if (!name || name.length < 2) {
    return res
      .status(400)
      .json({ error: "Name can not be less than 2 characters long" });
  }

  if (biography && biography.length > 150) {
    return res
      .status(400)
      .json({ error: "Biography can not be longer than 150 characters" });
  }

  next();
};

// validate that the requesting user is getting or modifying their own data
const validateIsOwnAccount = (req, res, next) => {
  const requestingUser = req.username; // from jwt
  const account = req.params.username; // from route
  if (requestingUser !== account) {
    return res
      .status(403)
      .json({ error: "Can not access someone else's account" });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileEdits,
  validateIsOwnAccount,
};
