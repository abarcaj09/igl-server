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

// post will be liked if it isn't already like by the user, else the
// like will be removed
postsRouter.post("/:id/likes", checkJWT, async (req, res) => {
  const post = await Post.findById(req.params.id).select("likes");
  const user = await User.findById(req.userId).select("likes");

  if (!post || !user) {
    return res.status(400).json({ error: "User or post does not exist." });
  }

  const postLikeIndex = post.likes.indexOf(user.id);
  const userLikeIndex = user.likes.indexOf(post.id);

  if (postLikeIndex === -1) {
    // user has NOT liked this post => like the post
    post.likes.push(user.id);
    await post.save();

    user.likes.push(post.id);
    await user.save();

    return res.status(201).json({
      userLikes: user.likes,
    });
  }

  // user has liked this post => unlike the post
  post.likes.splice(postLikeIndex, 1);
  await post.save();

  user.likes.splice(userLikeIndex, 1);
  await user.save();

  res.json({
    userLikes: user.likes,
  });
});

// post will be saved if it isn't already saved by the user, else the
// save will be removed
postsRouter.post("/:id/save", checkJWT, async (req, res) => {
  const user = await User.findById(req.userId).select("saved");
  const post = await Post.findById(req.params.id);

  if (!post || !user) {
    return res.status(400).json({ error: "User or post does not exist." });
  }

  const savedIndex = user.saved.indexOf(post.id);
  if (savedIndex === -1) {
    // user has NOT saved this post => save it
    user.saved.push(post.id);
    await user.save();

    return res.status(201).json({
      userSaved: user.saved,
    });
  }

  // user has saved this post => remove it from saved
  user.saved.splice(savedIndex, 1);
  await user.save();

  res.json({
    userSaved: user.saved,
  });
});
module.exports = postsRouter;
