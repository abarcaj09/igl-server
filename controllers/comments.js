const commentsRouter = require("express").Router();
const Comment = require("../models/comment");
const Post = require("../models/post");
const checkJWT = require("../utils/checkJWT");
const { validateComment } = require("../utils/validators");

// POST

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

// DELETE

commentsRouter.delete("/:id", checkJWT, async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(400).json({ error: "Comment does not exist" });
  }

  if (comment.user.toString() !== req.userId) {
    return res
      .status(403)
      .json({ error: "Can not delete a comment that you didn't create" });
  }

  const post = await Post.findById(comment.post);

  post.comments = post.comments.filter(
    (cmnt) => cmnt.toString() !== comment.id
  );
  await post.save();

  await Comment.findByIdAndDelete(comment.id);
  res.status(204).end();
});

module.exports = commentsRouter;
