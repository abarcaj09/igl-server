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

module.exports = { nonExistingId };
