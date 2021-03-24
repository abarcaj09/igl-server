const postsRouter = require("express").Router();
const Post = require("../models/post");
const checkJWT = require("../utils/checkJWT");
const { validatePostImages } = require("../utils/validators");

// POST

postsRouter.post(
  "/images",
  [checkJWT, validatePostImages],
  async (req, res) => {
    const base64strings = req.body;
    let urls = [];

    for (const image of base64strings) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        upload_preset: "igl-posts",
      });
      urls.push(uploadResponse.secure_url);
    }

    res.status(201).json({ urls });
  }
);
