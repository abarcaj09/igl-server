const mongoose = require("mongoose");
const User = require("../models/user");
const Post = require("../models/post");
const helper = require("./user_helper");
const postHelper = require("./post_helper");
const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);

let config;
let testUser;

beforeEach(async () => {
  await User.deleteMany({});
  await User.insertMany(helper.intialUsers);

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

describe("Editing a user", () => {
  test("succeeds when a user edits their own account with valid data", async () => {
    const edits = {
      profilePic:
        "https://images.unsplash.com/photo-1616277434249-1ea8218b973d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      name: "Test U.",
      biography: "Test's biography",
    };

    await api
      .put(`/api/users/${testUser.username}`)
      .set("Authorization", config)
      .send(edits)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const editedUser = await User.findOne({ username: "test" });

    expect(editedUser.profilePic).toBe(edits.profilePic);
    expect(editedUser.name).toBe(edits.name);
    expect(editedUser.biography).toBe(edits.biography);
  });

  test("fails with status code 400 when a user edits their biography to be over 150 characters", async () => {
    const edits = {
      profilePic: "",
      name: "Test U.",
      biography: helper.invalidLengthBio,
    };

    await api
      .put(`/api/users/${testUser.username}`)
      .set("Authorization", config)
      .send(edits)
      .expect(400);
  });

  test("fails with status code 400 when a user edits their name to be less than 2 characters long", async () => {
    const edits = {
      profilePic: "",
      name: "T",
      biography: "Test's biography",
    };

    await api
      .put(`/api/users/${testUser.username}`)
      .set("Authorization", config)
      .send(edits)
      .expect(400);
  });

  test("fails with status code 403 when a user attempts to edit someone else's account", async () => {
    const edits = {
      profilePic: "",
      name: "Test U.",
      biography: "Test's biography",
    };

    await api
      .put("/api/users/joe1")
      .set("Authorization", config)
      .send(edits)
      .expect(403);
  });
});

describe("following a user", () => {
  test("adds the user if the requesting user WASN'T already following", async () => {
    const toFollow = helper.intialUsers[0];
    await api
      .post(`/api/users/${toFollow.username}/follow`)
      .set("Authorization", config)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const requestingUser = await User.findOne({ username: testUser.username });
    const userToFollow = await User.findOne({ username: toFollow.username });

    expect(requestingUser.following.includes(userToFollow.id)).toBe(true);
    expect(userToFollow.followers.includes(requestingUser.id)).toBe(true);
  });

  test("removes the user if the requesting user WAS already following", async () => {
    const toFollow = helper.intialUsers[0];
    // follow the user first
    await api
      .post(`/api/users/${toFollow.username}/follow`)
      .set("Authorization", config);

    await api
      .post(`/api/users/${toFollow.username}/follow`)
      .set("Authorization", config)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const requestingUser = await User.findOne({ username: testUser.username });
    const userToFollow = await User.findOne({ username: toFollow.username });

    expect(requestingUser.following).not.toContain(userToFollow.id);
    expect(userToFollow.followers).not.toContain(requestingUser.id);
  });

  test("fails with status code 400 if the user to follow does not exist", async () => {
    const nonExistingUsername = await helper.nonExistingUsername();

    await api
      .post(`/api/users/${nonExistingUsername}/follow`)
      .set("Authorization", config)
      .expect(400);
  });

  test("fails with status code 400 if the requesting user attempts to follow themself", async () => {
    await api
      .post(`/api/users/${testUser.username}/follow`)
      .set("Authorization", config)
      .expect(400);
  });
});

describe("getting suggested profiles", () => {
  test("succeeds when the user gets their own suggestions and the retrieved suggestions are not followed by the user and at most 3 suggestions are received", async () => {
    const toFollow = helper.intialUsers[0];
    // follow a user first
    await api
      .post(`/api/users/${toFollow.username}/follow`)
      .set("Authorization", config);

    const response = await api
      .get(`/api/users/${testUser.username}/suggestions`)
      .set("Authorization", config);

    const suggestions = response.body.suggestions.map(
      (suggestedUser) => suggestedUser.id
    );
    const requestingUser = await User.findOne({ username: testUser.username });

    suggestions.forEach((suggestedUser) =>
      expect(requestingUser.following).not.toContain(suggestedUser)
    );

    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  test("fails with status code 403 when the user gets someone else's suggestions", async () => {
    const otherUser = helper.intialUsers[0];

    await api
      .get(`/api/users/${otherUser.username}/suggestions`)
      .set("Authorization", config)
      .expect(403);
  });
});

describe("getting a user's home posts", () => {
  beforeEach(async () => {
    await Post.deleteMany({});
    await Post.insertMany(postHelper.initialPosts);
  });

  test("succeeds and contains posts from users that the requesting user is following", async () => {
    const followedUser = {
      name: "Followed User",
      username: "followed",
      email: "followed@email.com",
      password: "followedpassword",
    };

    const response = await api.post("/api/auth/register").send(followedUser);
    const followedUserConfig = `Bearer ${response.body.token}`;

    // create a post for followedUser
    const newPost = {
      imageUrls: [
        "https://images.unsplash.com/photo-1616277434249-1ea8218b973d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      ],
      caption: "follwed's post",
    };

    await api
      .post("/api/posts/")
      .set("Authorization", followedUserConfig)
      .send(newPost);

    // testUser follows followedUser
    await api
      .post(`/api/users/${followedUser.username}/follow`)
      .set("Authorization", config);

    // testUser gets their home posts
    const homeResponse = await api
      .get(`/api/users/${testUser.username}/home`)
      .set("Authorization", config)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const requestingUser = await User.findOne({ username: testUser.username });

    const homePosts = homeResponse.body.posts;
    expect(homePosts).not.toBeNull();

    // homePosts should not include initial posts because testUser isn't following
    // the user who created those posts
    homePosts.forEach((post) => {
      expect(requestingUser.following.includes(post.user.id)).toBe(true);
    });
  });

  test("fails with status code 403 if the user tries to get another user's home posts", async () => {
    const otherUser = helper.intialUsers[0];

    await api
      .get(`/api/users/${otherUser.username}/home`)
      .set("Authorization", config)
      .expect(403);
  });
});

describe("getting a user's explore posts", () => {
  beforeEach(async () => {
    await Post.deleteMany({});
    await Post.insertMany(postHelper.initialPosts);
  });

  test("succeeds and contains posts from users that the requesting user is not following", async () => {
    const response = await api
      .get(`/api/users/${testUser.username}/explore`)
      .set("Authorization", config)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const requestingUser = await User.findOne({ username: testUser.username });

    const explorePosts = response.body.posts;
    expect(explorePosts).not.toBeNull();

    explorePosts.forEach((post) => {
      expect(requestingUser.following).not.toContain(post.user.id);
    });
  });

  test("fails with status code 403 if the user tries to get another user's explore posts", async () => {
    const otherUser = helper.intialUsers[0];

    await api
      .get(`/api/users/${otherUser.username}/explore`)
      .set("Authorization", config)
      .expect(403);
  });
});

describe("getting a user's profile", () => {
  test("succeeds and contains the profile's followers, following, posts, and saved if the profile exists", async () => {
    const response = await api
      .get(`/api/users/${testUser.username}`)
      .set("Authorization", config)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const profile = response.body.profile;
    expect(profile).not.toBeNull();

    expect(profile.followers).not.toBeNull();
    expect(profile.following).not.toBeNull();
    expect(profile.saved).not.toBeNull();
    expect(profile.posts).not.toBeNull();
  });

  test("fails with status code 400 if the user tries to get a profile that does not exist", async () => {
    const nonExistingUsername = await helper.nonExistingUsername();

    await api
      .get(`/api/users/${nonExistingUsername}`)
      .set("Authorization", config)
      .expect(400);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
