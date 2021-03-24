const usersRouter = require("express").Router();
const User = require("../models/user");
const checkJWT = require("../utils/checkJWT");
const {
  validateProfileEdits,
  validateIsOwnAccount,
} = require("../utils/validators");

// PUT

usersRouter.put(
  "/:username",
  [checkJWT, validateProfileEdits, validateIsOwnAccount],
  async (req, res) => {
    const { profilePic, name, biography } = req.body;
    const profileToEdit = await User.findOne({ username: req.params.username });

    if (!profileToEdit) {
      return res.status(400).json({ error: "Account does not exist" });
    }

    profileToEdit.profilePic = profilePic
      ? profilePic
      : profileToEdit.profilePic;

    profileToEdit.name = name;
    profileToEdit.biography = biography;
    await profileToEdit.save();

    res.status(201).json({
      profilePic: profileToEdit.profilePic,
      name: profileToEdit.name,
      biography: profileToEdit.biography,
    });
  }
);

module.exports = usersRouter;
