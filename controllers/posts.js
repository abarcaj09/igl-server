const postsRouter = require("express").Router();
const Post = require("../models/post");
const User = require("../models/user");
const checkJWT = require("../utils/checkJWT");
const { validatePostImages, validatePost } = require("../utils/validators");

// POST

postsRouter.post(
  "/images",
  [checkJWT, validatePostImages],
  async (req, res) => {
    const base64strings = req.body;
    let urls = [];

    for (const image of base64strings) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        upload_preset: "igl-posts",
      });
      urls.push(uploadResponse.secure_url);
    }

    res.status(201).json({ urls });
  }
);

postsRouter.post("/", [checkJWT, validatePost], async (req, res) => {
  const { imageUrls, caption } = req.body;
  const user = await User.findById(req.userId);

  const newPost = new Post({
    images: imageUrls,
    user: user._id,
    caption,
  });

  const savedPost = await newPost.save();
  user.posts = user.posts.concat(savedPost._id);
  await user.save();

  await savedPost
    .populate({
      path: "user",
      select: "username name profilePic",
    })
    .execPopulate();

  res.status(201).json({ post: savedPost });
});

module.exports = postsRouter;
