const postsRouter = require("express").Router();
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const checkJWT = require("../utils/checkJWT");
const { validatePostImages, validatePost } = require("../utils/validators");

// GET

postsRouter.get("/:username/previews", async (req, res) => {
  const user = await User.findOne(
    { username: req.params.username },
    "posts"
  ).populate({
    path: "posts",
    select: "images likes comments",
    options: { sort: { createdAt: -1 } },
    limit: 6,
  });

  if (!user) {
    return res.status(400).json({ error: "User does not exist" });
  }

  res.json({ previews: user.posts });
});

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

// DELETE routes

postsRouter.delete("/:id", checkJWT, async (req, res) => {
  const requestingUser = await User.findById(req.userId, "posts");
  const toDelete = await Post.findById(req.params.id, "user likes");

  if (!toDelete) {
    return res.status(400).json({ error: "This post does not exist" });
  } else if (requestingUser.id !== toDelete.user.toString()) {
    return res
      .status(403)
      .json({ error: "Can not delete a post that you didn't create" });
  }

  // delete all comments associated with the post
  await Comment.deleteMany({ post: toDelete.id });

  // remove the post from those who liked and/or saved it
  await User.updateMany(
    { $or: [{ _id: { $in: toDelete.likes } }, { saved: toDelete.id }] },
    { $pull: { likes: toDelete.id, saved: toDelete.id } }
  );

  // remove the post from the list of posts created by the user
  requestingUser.posts = requestingUser.posts.filter(
    (post) => post.toString() !== toDelete.id
  );
  await requestingUser.save();

  // delete the post
  await Post.findByIdAndDelete(toDelete.id);

  res.status(204).end();
});

module.exports = postsRouter;
