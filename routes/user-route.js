const express = require("express");
const argon2 = require("argon2");
const { jwtDecode } = require("jwt-decode");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const { otpModel } = require("../models/otp-model");
const { MailTransporter } = require("../utils/mail-transporter");
const { UserRefreshClient } = require("google-auth-library");
require("dotenv").config();

const { userModel } = require("../models/user-model");
const { AuthMiddleware } = require("../middlewares/auth-middleware");

const userRouter = express.Router();

userRouter.post("/verify-user", async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!!user) {
      res.send({ is_registered: true });
    } else {
      res.send({ is_registered: false });
    }
  } catch (err) {
    next(err);
  }
});

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

userRouter.post("/request-otp", async (req, res, next) => {
  const { email } = req.body;
  try {
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const { mailOptions, transporter } = MailTransporter(email, otp);

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        throw new Error(error);
      } else {
        console.log("Email sent: " + info.response);
        const new_otp = new otpModel({ email, otp });
        await new_otp.save();
        res.send("successfully sent mail");
      }
    });
  } catch (err) {
    next(err);
  }
});

userRouter.post("/send-email-link", async (req, res, next) => {
  const { email } = req.body;
  try {
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    user = await userModel.findOne({ email });
    const token = jwt.sign({ userId: user._id }, process.env.token_secret, { expiresIn: 5 * 60, algorithm: process.env.jwt_algorithm });
    const url = `http://localhost:9001/authentication/callback/${token}`;

    const { mailOptions, transporter } = MailTransporter(email, null, url);

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        throw new Error(error);
      } else {
        console.log("Email sent: " + info.response);
        const new_otp = new otpModel({ email, otp });
        await new_otp.save();
        res.send("successfully sent mail");
      }
    });
  } catch (err) {
    next(err);
  }
});

userRouter.post("/verify-email", async (req, res, next) => {
  const { token } = req.body;

  try {
    jwt.verify(token, process.env.token_secret, (err, decoded) => {
      if (err) console.log(err);
      if (decoded) {
        const userId = decoded.userId;

        const new_token = jwt.sign({ userId }, process.env.token_secret, { expiresIn: 7 * 24 * 60 * 60, algorithm: process.env.jwt_algorithm });
        const refresh_token = jwt.sign({ userId }, process.env.refresh_token_secret, { expiresIn: 28 * 24 * 60 * 60, algorithm: process.env.jwt_algorithm });

        res.cookie("token", new_token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, signed: true });
        res.cookie("refresh_token", refresh_token, { httpOnly: true, maxAge: 28 * 24 * 60 * 60 * 1000, signed: true });
        res.status(200).end();
      } else {
        next("url expired");
      }
    });
  } catch (err) {
    next(err);
  }
});

// https://www.googleapis.com/auth/userinfo.email
// https://www.googleapis.com/auth/userinfo.profile

userRouter.post("/signup", async (req, res, next) => {
  const { name, email, password, otp } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!!user) {
      const error = new Error("Email already registered");
    } else {
      const has_otp = await otpModel.findOne({ otp });
      if (!has_otp) {
        const error = new Error("Invalid Otp");
        next(error);
      } else {
        const hash = await argon2.hash(password);
        const new_user = new userModel({ name, email, password: hash });
        await new_user.save();

        res.status(201).end();
      }
    }
  } catch (err) {
    next(err);
  }
});

userRouter.post("/login", async (req, res, next) => {
  const { email, password, otp } = req.body;

  try {
    let is_verified = false;
    let error;
    const user = await userModel.findOne({ email });

    if (password) {
      if (!!user) {
        if (await argon2.verify(user.password, password)) {
          is_verified = true;
        } else {
          error = new Error("Invalid Password");
        }
      } else {
        error = new Error("Invalid Email");
      }
    } else {
      const has_otp = await otpModel.findOne({ email, otp });

      if (!!has_otp) {
        is_verified = true;
      } else {
        error = new Error("Invalid otp");
      }
    }

    if (!is_verified) {
      next(error);
    } else {
      const token = jwt.sign({ userId: user._id }, process.env.token_secret, { expiresIn: 7 * 24 * 60 * 60, algorithm: process.env.jwt_algorithm });
      const refresh_token = jwt.sign({ userId: user._id }, process.env.refresh_token_secret, { expiresIn: 28 * 24 * 60 * 60, algorithm: process.env.jwt_algorithm });

      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, signed: true });

      res.cookie("refresh_token", refresh_token, { httpOnly: true, maxAge: 28 * 24 * 60 * 60 * 1000, signed: true });
      res.status(200).end();
    }
  } catch (err) {
    next(err);
  }
});

userRouter.post("/google-login", async (req, res) => {
  const { token: access_token } = req.body;
  const user_client = new UserRefreshClient(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, access_token);
  const { credentials } = await user_client.refreshAccessToken();
  const user_profile = jwtDecode(credentials.id_token);
  const { name, email } = user_profile;
  let user;
  user = await userModel.findOne({ email });
  if (!!user) {
  } else {
    new_user = new userModel({ name, email, password: "hello" });
    await new_user.save();
  }
  const token = jwt.sign({ userId: user._id }, process.env.token_secret, { expiresIn: 7 * 24 * 60 * 60, algorithm: process.env.jwt_algorithm });
  const refresh_token = jwt.sign({ userId: user._id }, process.env.refresh_token_secret, { expiresIn: 28 * 24 * 60 * 60, algorithm: process.env.jwt_algorithm });

  res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, signed: true });
  res.cookie("refresh_token", refresh_token, { httpOnly: true, maxAge: 28 * 24 * 60 * 60 * 1000, signed: true });
  res.status(200).end();
});

module.exports = { userRouter };
