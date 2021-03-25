const commentsRouter = require("express").Router();
const Comment = require("../models/comment");
const Post = require("../models/post");
const checkJWT = require("../utils/checkJWT");
const { validateComment } = require("../utils/validators");

commentsRouter.post("/", [checkJWT, validateComment], async (req, res) => {
  const { comment, postId } = req.body;
  const post = await Post.findById(postId).select("comments");

  if (!post) {
    return res.status(400).json({ error: "Post does not exist" });
  }
  const newComment = new Comment({
    user: req.userId,
    post: post.id,
    comment,
  });

  const savedComment = await newComment.save();

  post.comments.push(savedComment.id);
  await post.save();

  res.status(201).json({ comment: savedComment });
});

module.exports = commentsRouter;
