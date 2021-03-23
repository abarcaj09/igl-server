const User = require("../models/user");

const intialUsers = [
  {
    name: "Joe A.",
    username: "joe1",
    email: "joe@email.com",
    password: "joespassword",
  },
  {
    name: "Mary B.",
    username: "mary1",
    email: "mary@email.com",
    password: "abc12345",
  },
];

const allUsers = async () => {
  const users = await User.find({});
  return users.map((user = user.toJSON()));
};

module.exports = { intialUsers, allUsers };
