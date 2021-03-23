const authRouter = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../utils/config");
const { validateRegister } = require("../utils/validators");

const generateJWT = (user) => {
  const userInfo = { username: user.username, id: user.id };
  return jwt.sign(userInfo, JWT_SECRET, { expiresIn: "5d" });
};

authRouter.post("/register", validateRegister, async (req, res) => {
  const { name, username, email, password } = req.body;
  const existingUsername = await User.findOne({ username });
  const existingEmail = await User.findOne({ email });

  if (existingUsername) {
    return res.status(400).json({ error: "Username is taken" });
  } else if (existingEmail) {
    return res.status(400).json({
      error: "Email already registered to an account",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10); // 10 == salt rounds
  const newUser = new User({
    name,
    username,
    email,
    password: passwordHash,
  });

  const savedUser = await newUser.save();
  const token = generateJWT(savedUser);
  res.status(201).json({ token, username: savedUser.username });
});

module.exports = authRouter;
