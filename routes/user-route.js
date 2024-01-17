const express = require("express");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { userModel } = require("../models/user-model");
const { AuthMiddleware } = require("../middlewares/auth-middleware");

const userRouter = express.Router();

userRouter.post("/userDetails", AuthMiddleware, async (req, res) => {
  try {
    if (Object.hasOwn(req, "userId")) {
      const user = await userModel.findOne({ _id: req.userId }, { name: 1 });

      res.status(200).send({ name: user.name, logged_in_success: true });
    } else {
      res.status(200).send({ logged_in_success: false });
    }
  } catch (err) {
    throw new Error(err);
  }
});

userRouter.post("/signup", async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    console.log(user);
    if (!!user) {
      const error = new Error("User already registered");
      next(error);
    } else {
      const hash = await argon2.hash(password);
      const new_user = new userModel({ name, email, password: hash });
      await new_user.save();
      res.status(201).end();
    }
  } catch (err) {
    next(err);
  }
});

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!!user) {
      if (await argon2.verify(user.password, password)) {
        const token = jwt.sign({ userId: user._id }, process.env.token_secret);
        const refresh_token = jwt.sign({ userId: user._id }, process.env.refresh_token_secret);

        res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, signed: true });
        res.cookie("refresh_token", refresh_token, { httpOnly: true, maxAge: 28 * 24 * 60 * 60 * 1000, signed: true });

        res.status(200).end();
      } else {
        throw new Error("Invalid Password");
      }
    } else {
      throw new Error("Invalid Email");
    }
  } catch (err) {
    throw new Error(err);
  }
});

module.exports = { userRouter };
