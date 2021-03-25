const Comment = require("../models/comment");

const nonExistingId = async () => {
  const tempComment = new Comment({
    comment: "temp comment",
    post: "605be6d4848d60771ff2cedb",
    user: "605bddbf3b7a5e728d95ac0e",
  });

  await tempComment.save();
  await tempComment.remove();

  return tempComment.id;
};

module.exports = { nonExistingId };
