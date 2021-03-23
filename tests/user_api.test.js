const mongoose = require("mongoose");
const User = require("../models/user");
const helper = require("./user_helper");
const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);

beforeEach(async () => {
  await User.deleteMany({});
  await User.insertMany(helper.intialUsers);
});

describe("registering a new user", () => {
  test("succeeds when all fields are valid", async () => {
    const newUser = {
      name: "Alex C.",
      username: "alex1",
      email: "alex@email.com",
      password: "mypassword!",
    };

    await api
      .post("/api/auth/register")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.allUsers();
    expect(usersAtEnd).toHaveLength(helper.intialUsers.length + 1);

    const usernames = usersAtEnd.map((user) => user.username);
    expect(usernames).toContain("alex1");
  });

  test("fails with status code 400 if username is taken", async () => {
    const newUser = {
      name: "Joe C.",
      username: "joe1",
      email: "jc@email.com",
      password: "mypassword!",
    };

    await api.post("/api/auth/register").send(newUser).expect(400);

    const usersAtEnd = await helper.allUsers();
    expect(usersAtEnd).toHaveLength(helper.intialUsers.length);
  });

  test("fails with status code 400 if email is already registered to an existing user", async () => {
    const newUser = {
      name: "Joe C.",
      username: "joe2",
      email: "joe@email.com",
      password: "mypassword!",
    };

    await api.post("/api/auth/register").send(newUser).expect(400);

    const usersAtEnd = await helper.allUsers();
    expect(usersAtEnd).toHaveLength(helper.intialUsers.length);
  });

  test("fails with status code 400 if name is less than 2 characters long", async () => {
    const newUser = {
      name: "J",
      username: "joe2",
      email: "jc@email.com",
      password: "mypassword!",
    };

    await api.post("/api/auth/register").send(newUser).expect(400);

    const usersAtEnd = await helper.allUsers();
    expect(usersAtEnd).toHaveLength(helper.intialUsers.length);
  });

  test("fails with status code 400 if username is less than 3 characters long", async () => {
    const newUser = {
      name: "Joe C.",
      username: "jc",
      email: "jc@email.com",
      password: "mypassword!",
    };

    await api.post("/api/auth/register").send(newUser).expect(400);

    const usersAtEnd = await helper.allUsers();
    expect(usersAtEnd).toHaveLength(helper.intialUsers.length);
  });

  test("fails with status code 400 if username is longer than 20 characters", async () => {
    const newUser = {
      name: "Joe C.",
      username: "reallyLongUsername123", // 21 characters
      email: "jc@email.com",
      password: "mypassword!",
    };

    await api.post("/api/auth/register").send(newUser).expect(400);

    const usersAtEnd = await helper.allUsers();
    expect(usersAtEnd).toHaveLength(helper.intialUsers.length);
  });

  test("fails with status code 400 if username contains a special character (username can only contain alphanumeric and underscore)", async () => {
    const newUser = {
      name: "Joe C.",
      username: "joe!",
      email: "jc@email.com",
      password: "mypassword!",
    };

    await api.post("/api/auth/register").send(newUser).expect(400);

    const usersAtEnd = await helper.allUsers();
    expect(usersAtEnd).toHaveLength(helper.intialUsers.length);
  });

  test("fails with status code 400 if password is less than 6 characters long", async () => {
    const newUser = {
      name: "Joe C.",
      username: "joe2",
      email: "jc@email.com",
      password: "12345",
    };

    await api.post("/api/auth/register").send(newUser).expect(400);

    const usersAtEnd = await helper.allUsers();
    expect(usersAtEnd).toHaveLength(helper.intialUsers.length);
  });

  test("fails with status code 400 if password contains spaces", async () => {
    const newUser = {
      name: "Joe C.",
      username: "joe2",
      email: "jc@email.com",
      password: "pass word",
    };

    await api.post("/api/auth/register").send(newUser).expect(400);

    const usersAtEnd = await helper.allUsers();
    expect(usersAtEnd).toHaveLength(helper.intialUsers.length);
  });

  test("fails with status code 400 if email is not in a valid format (valid format is 'something'@'something'[.'something']", async () => {
    const newUser = {
      name: "Joe C.",
      username: "joe2",
      email: "jcemail.com",
      password: "password",
    };

    await api.post("/api/auth/register").send(newUser).expect(400);

    const usersAtEnd = await helper.allUsers();
    expect(usersAtEnd).toHaveLength(helper.intialUsers.length);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
