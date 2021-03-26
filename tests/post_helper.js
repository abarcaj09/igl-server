const Post = require("../models/post");

const nonExistingId = async () => {
  const tempPost = new Post({
    images: ["image"],
    caption: "temp post",
    user: "605bddbf3b7a5e728d95ac0e",
  });

  await tempPost.save();
  await tempPost.remove();

  return tempPost.id;
};

const initialPosts = [
  {
    images: ["imageurl1"],
    caption: "init post 1",
    user: "605bddbf3b7a5e728d95ac0e",
  },
  {
    images: ["imageurl1", "imageurl2"],
    caption: "init post 2",
    user: "605bddbf3b7a5e728d95ac0e",
  },
];

module.exports = { nonExistingId, initialPosts };
