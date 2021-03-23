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
];

const allUsers = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

module.exports = { intialUsers, allUsers };
