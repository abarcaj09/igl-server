const usersRouter = require("express").Router();
const User = require("../models/user");
const Post = require("../models/post");
const checkJWT = require("../utils/checkJWT");
const {
  validateProfileEdits,
  validateIsOwnAccount,
  validateProfileImage,
} = require("../utils/validators");

// GET

// explore posts will be posts from users that :username isn't following
usersRouter.get(
  "/:username/explore",
  [checkJWT, validateIsOwnAccount],
  async (req, res) => {
    const user = await User.findOne({ username: req.params.username }).select(
      "following"
    );
    const posts = await Post.find({
      user: { $nin: [...user.following, user.id] },
    }).select("images likes comments caption user");

    res.json({ posts });
  }
);

// home posts will be the most recent post from the people that :username
// is following
usersRouter.get(
  "/:username/home",
  [checkJWT, validateIsOwnAccount],
  async (req, res) => {
    const user = await User.findOne(
      { username: req.params.username },
      "following"
    ).populate({
      path: "following",
      select: "posts ",
      limit: 5,
      populate: {
        path: "posts",
        options: { sort: { createdAt: -1 }, perDocumentLimit: 1 },
        populate: [
          { path: "user", select: "name username profilePic" },
          {
            path: "likes",
            select: "name username profilePic",
          },
          {
            path: "comments",
            select: "comment createdAt",
            perDocumentLimit: 2,
            populate: {
              path: "user",
              select: "username",
            },
          },
        ],
      },
    });

    let homePosts = [];
    for (const followedUser of user.following) {
      if (followedUser.posts.length) {
        homePosts.push(followedUser.posts[0]);
      }
    }

    res.json({ posts: homePosts });
  }
);

// suggestions will be up to 3 accounts that the :username isn't following
usersRouter.get(
  "/:username/suggestions",
  [checkJWT, validateIsOwnAccount],
  async (req, res) => {
    const user = await User.findOne({
      username: req.params.username,
    }).select("following");

    if (!user) {
      return res.status(400).json({ error: "Username does not exist" });
    }

    const suggestions = await User.find(
      {
        _id: {
          $nin: [...user.following, user.id],
        },
      },
      "username name profilePic"
    ).limit(3);

    res.json({ suggestions });
  }
);

// POST
usersRouter.post(
  "/images",
  [checkJWT, validateProfileImage],
  async (req, res) => {
    const { image } = req.body;

    const uploadResponse = await cloudinary.uploader.upload(image, {
      upload_preset: "igl-profiles",
    });

    const url = uploadResponse.secure_url;
    res.status(201).json({ url });
  }
);

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

  res.json({
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
