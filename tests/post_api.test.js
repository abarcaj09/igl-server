const mongoose = require("mongoose");
const Post = require("../models/post");
const User = require("../models/user");
const supertest = require("supertest");
const app = require("../app");
const helper = require("./post_helper");
const userHelper = require("./user_helper");

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

    const postCreator = await User.findOne({
      username: testUser.username,
    }).populate({
      path: "posts",
      select: "caption images",
    });

    const createdPost = postCreator.posts[0];

    expect(createdPost).toBeDefined();
    expect(createdPost.caption).toBe(newPost.caption);

    // have to copy images into an array because it is of type CoreMongooseArray
    expect([...createdPost.images]).toEqual(newPost.imageUrls);
  });

  test("fails with status code 400 if no image urls are given", async () => {
    const newPost = {
      caption: "post won't be created",
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
      caption: "post won't be created",
    };

    await api
      .post("/api/posts/")
      .set("Authorization", config)
      .send(newPost)
      .expect(400);
  });
});

describe("liking a post", () => {
  let testPost;

  beforeEach(async () => {
    const newPost = {
      imageUrls: [
        "https://images.unsplash.com/photo-1616277434249-1ea8218b973d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      ],
      caption: "post to be liked",
    };

    await api.post("/api/posts/").set("Authorization", config).send(newPost);
    testPost = await Post.findOne({ user: testUser.id });
  });

  test("adds a like if the user hasn't liked the post yet", async () => {
    await api
      .post(`/api/posts/${testPost.id}/likes`)
      .set("Authorization", config)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    //   post is in user's likes
    const requestingUser = await User.findOne({ username: testUser.username });
    expect(requestingUser.likes.includes(testPost.id)).toBe(true);

    // user is in post's likes
    const likedPost = await Post.findById(testPost.id);
    expect(likedPost.likes.includes(requestingUser.id)).toBe(true);
  });

  test("removes the like if the user has already liked the post", async () => {
    // like the post
    await api
      .post(`/api/posts/${testPost.id}/likes`)
      .set("Authorization", config);

    await api
      .post(`/api/posts/${testPost.id}/likes`)
      .set("Authorization", config)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const requestingUser = await User.findOne({ username: testUser.username });
    expect(requestingUser.likes).not.toContain(testPost.id);

    const unlikedPost = await Post.findById(testPost.id);
    expect(unlikedPost.likes).not.toContain(requestingUser.id);
  });

  test("fails with status code 400 if the post does not exist", async () => {
    const nonExistingPostId = helper.nonExistingId();

    await api
      .post(`/api/posts/${nonExistingPostId}/likes`)
      .set("Authorization", config)
      .expect(400);
  });
});

describe("saving a post", () => {
  let testPost;

  beforeEach(async () => {
    const newPost = {
      imageUrls: [
        "https://images.unsplash.com/photo-1616277434249-1ea8218b973d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      ],
      caption: "post to be saved",
    };

    await api.post("/api/posts/").set("Authorization", config).send(newPost);
    testPost = await Post.findOne({ user: testUser.id });
  });
  test("adds it to the user's saved posts if it had not been saved yet", async () => {
    await api
      .post(`/api/posts/${testPost.id}/save`)
      .set("Authorization", config)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    //   post is in user's saved
    const requestingUser = await User.findOne({ username: testUser.username });
    expect(requestingUser.saved.includes(testPost.id)).toBe(true);
  });

  test("removes it from user's saved posts if it had already been saved", async () => {
    // save the post
    await api
      .post(`/api/posts/${testPost.id}/save`)
      .set("Authorization", config);

    await api
      .post(`/api/posts/${testPost.id}/save`)
      .set("Authorization", config)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const requestingUser = await User.findOne({ username: testUser.username });
    expect(requestingUser.saved).not.toContain(testPost.id);
  });

  test("fails with status code 400 if the post does not exist", async () => {
    const nonExistingPostId = helper.nonExistingId();

    await api
      .post(`/api/posts/${nonExistingPostId}/save`)
      .set("Authorization", config)
      .expect(400);
  });
});

describe("deleting a post", () => {
  test("succeeds when the post exists and it was created by the requesting user", async () => {
    // create a post for testUser
    const newPost = {
      imageUrls: [
        "https://images.unsplash.com/photo-1616277434249-1ea8218b973d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      ],
      caption: "to delete",
    };

    const response = await api
      .post("/api/posts/")
      .set("Authorization", config)
      .send(newPost);

    const postId = response.body.post.id;
    expect(postId).toBeDefined();

    await api
      .delete(`/api/posts/${postId}`)
      .set("Authorization", config)
      .expect(204);

    const deletedPost = await Post.findById(postId);
    expect(deletedPost).toBeNull();

    const requestingUser = await User.findOne({ username: testUser.username });
    expect(requestingUser.posts).not.toContain(postId);
  });

  test("fails with status code 400 when the post does not exist", async () => {
    const nonExistingId = await helper.nonExistingId();

    await api
      .delete(`/api/posts/${nonExistingId}`)
      .set("Authorization", config)
      .expect(400);
  });

  test("fails with status code 403 when the requesting user tries to delete a post they didn't create", async () => {
    const otherUser = {
      name: "Other User",
      username: "other",
      email: "other@email.com",
      password: "otherpassword",
    };

    const response = await api.post("/api/auth/register").send(otherUser);
    const otherUserConfig = `Bearer ${response.body.token}`;

    // create a post for otherUser
    const newPost = {
      imageUrls: [
        "https://images.unsplash.com/photo-1616277434249-1ea8218b973d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      ],
      caption: "other's post",
    };

    const otherResponse = await api
      .post("/api/posts/")
      .set("Authorization", otherUserConfig)
      .send(newPost);

    const otherUserPostId = otherResponse.body.post.id;

    // testUser attempting to delete otherUser's post
    await api
      .delete(`/api/posts/${otherUserPostId}`)
      .set("Authorization", config)
      .expect(403);
  });
});

describe("getting a user's post previews", () => {
  test("succeeds and contains images, likes, and comments", async () => {
    const newPost = {
      imageUrls: [
        "https://images.unsplash.com/photo-1616277434249-1ea8218b973d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      ],
      caption: "post to be retrieved",
    };

    await api.post("/api/posts/").set("Authorization", config).send(newPost);

    const reponse = await api
      .get(`/api/posts/${testUser.username}/previews`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const postPreviews = reponse.body.previews;
    expect(postPreviews).toBeDefined();

    postPreviews.forEach((post) => {
      expect(post.images).toBeDefined();
      expect(post.likes).toBeDefined();
      expect(post.comments).toBeDefined();
    });
  });

  test("fails with status code 400 if the user does not exist", async () => {
    const nonExistingUsername = await userHelper.nonExistingUsername();

    await api.get(`/api/posts/${nonExistingUsername}/previews`).expect(400);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
