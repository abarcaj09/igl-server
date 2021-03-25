// middleware to validate that all needed fields are given
// and that the fields meet the needed conditions

const hasSpaces = (str) => {
  return /\s/g.test(str);
};

const hasSpecialCharacter = (str) => {
  return /[^a-z0-9_]/.test(str);
};

const validEmailFormat = (email) => {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
    email
  );
};

const validateRegister = (req, res, next) => {
  const { name, username, email, password } = req.body;
  let errorMessages = [];

  if (!name || name.length < 2) {
    errorMessages.push("Full Name must be at least 2 characters long");
  }

  if (!username || username.length < 3 || username.length > 20) {
    errorMessages.push("Username must be between 3 and 20 characters long");
  }
  if (hasSpecialCharacter(username)) {
    errorMessages.push(
      "Username can't contain capital letters, spaces, or special characters"
    );
  }

  if (!password || password.length < 6 || hasSpaces(password)) {
    errorMessages.push(
      "Password must be at least 6 characters long and not have spaces"
    );
  }

  if (!email || !validEmailFormat(email)) {
    errorMessages.push("Invalid email format");
  }

  if (errorMessages.length) {
    return res.status(400).json({ error: errorMessages });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { account, password } = req.body;

  if (!account) {
    return res.status(400).json({ error: "Username/email is required" });
  } else if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  next();
};

const validateProfileEdits = (req, res, next) => {
  const { name, biography } = req.body;

  if (!name || name.length < 2) {
    return res
      .status(400)
      .json({ error: "Name can not be less than 2 characters long" });
  }

  if (biography && biography.length > 150) {
    return res
      .status(400)
      .json({ error: "Biography can not be longer than 150 characters" });
  }

  next();
};

// validate that the requesting user is getting or modifying their own data
const validateIsOwnAccount = (req, res, next) => {
  const requestingUser = req.username; // from jwt
  const account = req.params.username; // from route
  if (requestingUser !== account) {
    return res
      .status(403)
      .json({ error: "Can not access someone else's account" });
  }

  next();
};

// Get the size of the image before it was encoded to a base64 string
const getImageSize = (b64string) => {
  const padding = b64string.slice(-2).match(/=/g);
  return (b64string.length * 3) / 4 - (padding ? padding.length : 0);
};

const validateProfileImage = (req, res, next) => {
  const { image } = req.body;
  const imageSizeLimit = 7000000; // 7MB

  if (!image) {
    return res.status(400).json({ error: "No image was provided" });
  }

  if (getImageSize(image) > imageSizeLimit) {
    return res
      .status(400)
      .json({ error: "Profile picture must be smaller than 7MB" });
  }

  next();
};

const validatePostImages = (req, res, next) => {
  const base64strings = req.body;
  const imageSizeLimit = 7000000; // 7MB
  const totalSizeLimit = 20000000; // 20 MB
  let totalSize = 0;

  if (!base64strings || !base64strings.length) {
    return res
      .status(400)
      .json({ error: "At least 1 image needs to be provided" });
  }

  for (const image of base64strings) {
    const imageSize = getImageSize(image);
    totalSize += imageSize;

    if (imageSize > imageSizeLimit) {
      return res.status(400).json({
        error: "Each image must be smaller than 7MB",
      });
    } else if (totalSize > totalSizeLimit) {
      return res
        .status(400)
        .json({ error: "Total size for all images must be less than 20MB" });
    }
  }

  next();
};

const validatePost = (req, res, next) => {
  const { imageUrls } = req.body;

  if (!imageUrls || !imageUrls.length) {
    return res
      .status(400)
      .json({ error: "At least 1 image is needed to create a post" });
  }

  next();
};

const validateComment = (req, res, next) => {
  const { comment, postId } = req.body;

  if (!comment || comment.length < 1) {
    return res
      .status(400)
      .json({ error: "Comment must be at least 1 character long" });
  } else if (!postId) {
    return res.status(400).json({ error: "A post ID needs to be provided" });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileEdits,
  validateIsOwnAccount,
  validateProfileImage,
  validatePostImages,
  validatePost,
  validateComment,
};
