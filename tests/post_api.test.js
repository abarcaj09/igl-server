const mongoose = require("mongoose");
const Post = require("../models/user");
const User = require("../models/user");
const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);

let config;
let testUser;

beforeEach(async () => {
  await Post.deleteMany({});
  await User.deleteMany({});

  const user = {
    name: "Test User",
    username: "test",
    email: "test@email.com",
    password: "testpassword",
  };

  const response = await api.post("/api/auth/register").send(user);

  config = `Bearer ${response.body.token}`;
  testUser = await User.findOne({ username: "test" });
});

describe("creating a post", () => {
  test("succeeds when all fields are valid (image urls, caption is optional)", async () => {
    const newPost = {
      imageUrls: [
        "https://images.unsplash.com/photo-1616277434249-1ea8218b973d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      ],
      caption: "test post",
    };

    await api
      .post("/api/posts/")
      .set("Authorization", config)
      .send(newPost)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const postCreator = User.findOne({ username: testUser.username }).populate({
      path: "posts",
      select: "caption images",
    });

    const createdPost = postCreator.posts[0];

    expect(createdPost).toBeDefined();
    expect(createdPost.caption).toBe(newPost.caption);
    expect(createdPost.images).toEqual(newPost.imageUrls);
  });

  test("fails with status code 400 if no image urls are given", async () => {
    const newPost = {
      caption: "test post",
    };

    await api
      .post("/api/posts/")
      .set("Authorization", config)
      .send(newPost)
      .expect(400);
  });

  test("fails with status code 400 if image urls is empty", async () => {
    const newPost = {
      imageUrls: [],
      caption: "test post",
    };

    await api
      .post("/api/posts/")
      .set("Authorization", config)
      .send(newPost)
      .expect(400);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
