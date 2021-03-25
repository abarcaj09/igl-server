const mongoose = require("mongoose");
const Comment = require("../models/comment");
const Post = require("../models/post");
const User = require("../models/user");
const supertest = require("supertest");
const app = require("../app");
const commentHelper = require("./comment_helper");
const postHelper = require("./post_helper");

const api = supertest(app);

let config;
let testUser;
let testPost;

beforeEach(async () => {
  await Post.deleteMany({});
  await User.deleteMany({});
  await Comment.deleteMany({});

  const user = {
    name: "Test User",
    username: "test",
    email: "test@email.com",
    password: "testpassword",
  };

  const response = await api.post("/api/auth/register").send(user);

  config = `Bearer ${response.body.token}`;
  testUser = await User.findOne({ username: "test" });

  const newPost = {
    imageUrls: [
      "https://images.unsplash.com/photo-1616277434249-1ea8218b973d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
    ],
    caption: "post to comment on",
  };

  await api.post("/api/posts/").set("Authorization", config).send(newPost);

  testPost = await Post.findOne({ user: testUser.id });
});

describe("creating a comment", () => {
  test("succeeds when the comment length is greater 0 and the post exists", async () => {
    const newComment = {
      comment: "this comment will be created",
      postId: testPost.id,
    };

    await api
      .post("/api/comments")
      .set("Authorization", config)
      .send(newComment)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    //   comment was created
    const createdComment = await Comment.findOne({ post: newComment.postId });
    expect(createdComment).not.toBeNull();
    expect(createdComment.comment).toBe(newComment.comment);

    // comment was added to the post
    const postCommentedOn = await Post.findById(newComment.postId);
    expect(postCommentedOn.comments).toContain(createdComment.id);
  });

  test("fails with status code 400 when comment length is less than 1", async () => {
    const newComment = {
      comment: "",
      postId: testPost.id,
    };

    await api
      .post("/api/comments")
      .set("Authorization", config)
      .send(newComment)
      .expect(400);
  });

  test("fails with status code 400 when the given post does not exist", async () => {
    const nonExistingPostId = await postHelper.nonExistingId();
    const newComment = {
      comment: "this comment will not be created",
      postId: nonExistingPostId,
    };

    await api
      .post("/api/comments")
      .set("Authorization", config)
      .send(newComment)
      .expect(400);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
