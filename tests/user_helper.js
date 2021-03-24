const User = require("../models/user");

const intialUsers = [
  {
    name: "Joe A.",
    username: "joe1",
    email: "joe@email.com",
    password: "$2y$10$fQ.QR6HiPzEKbW9waP.zCuux30m1sVothHIRLX7kcz.NVyQHAVlIu", // hash for "joespassword"
  },
  {
    name: "Mary B.",
    username: "mary1",
    email: "mary@email.com",
    password: "$2y$10$.PgmHCJP0mKicPs5YI.Dx.ItYByn2p3xGyF95CglVK66MopAbBcGe", // hash for "abc12345"
  },
  {
    name: "Eric C.",
    username: "eric1",
    email: "eric@email.com",
    password: "$2y$10$.PgmHCJP0mKicPs5YI.Dx.ItYByn2p3xGyF95CglVK66MopAbBcGe", // hash for "abc12345"
  },
  {
    name: "Sue D.",
    username: "sue1",
    email: "sue@email.com",
    password: "$2y$10$.PgmHCJP0mKicPs5YI.Dx.ItYByn2p3xGyF95CglVK66MopAbBcGe", // hash for "abc12345"
  },
  {
    name: "May E.",
    username: "may1",
    email: "may@email.com",
    password: "$2y$10$.PgmHCJP0mKicPs5YI.Dx.ItYByn2p3xGyF95CglVK66MopAbBcGe", // hash for "abc12345"
  },
];

const allUsers = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

// biography must be less than 150 characters long
const invalidLengthBio =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis"; // 151 characters

module.exports = { intialUsers, allUsers, invalidLengthBio };
