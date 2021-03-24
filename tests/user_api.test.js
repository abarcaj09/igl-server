const mongoose = require("mongoose");
const User = require("../models/user");
const helper = require("./user_helper");
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

    // console.log("========= config =========", config);

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

afterAll(() => {
  mongoose.connection.close();
});
