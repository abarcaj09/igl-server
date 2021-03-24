const usersRouter = require("express").Router();
const User = require("../models/user");
const checkJWT = require("../utils/checkJWT");
const {
  validateProfileEdits,
  validateIsOwnAccount,
} = require("../utils/validators");

// POST

usersRouter.post("/:username/follow", checkJWT, async (req, res) => {
  const requestingUser = await User.findById(req.userId).select("following");
  const toFollow = await User.findOne({ username: req.params.username }).select(
    "followers"
  );

  if (!toFollow) {
    return res
      .status(400)
      .json({ error: "Can not follow a user that does not exist," });
  } else if (toFollow.id === requestingUser.id) {
    return res.status(400).json({ error: "Can not follow yourself." });
  }

  const followingIndex = requestingUser.following.indexOf(toFollow.id);
  const followerIndex = toFollow.followers.indexOf(requestingUser.id);

  if (followingIndex === -1) {
    // user is not following => follow
    requestingUser.following.push(toFollow.id);
    await requestingUser.save();

    toFollow.followers.push(requestingUser.id);
    await toFollow.save();

    return res.status(201).json({
      following: requestingUser.following,
    });
  }

  // user was following => unfollow
  requestingUser.following.splice(followingIndex, 1);
  await requestingUser.save();

  toFollow.followers.splice(followerIndex, 1);
  await toFollow.save();

  res.status(201).json({
    following: requestingUser.following,
  });
});

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
