import { AppError } from "../error/index.js";
import { User } from "../models/user.js";
import { comparePassword, hashPassword } from "../utils/bcrypt.js";
import { generateAccessToken } from "../utils/jwt.js";
import { logger } from "../utils/winston.js";
import { isValidEmail } from "../utils/emailCheck.js";
import { getRedis } from "../cache/index.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    throw new AppError("Invalid data fields", 400);

  // email check
  if (!isValidEmail(email)) throw new AppError("Invalid Email Format", 400);

  // hash password
  const hashedPassword = await hashPassword(password);

  // create user in db
  try {
    const createdUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const accessToken = await generateAccessToken(createdUser._id);
    res.set("Authorization", accessToken).status(201).json({
      message: "User Registered Succesfully",
    });

    logger.info(`New User Registered : ${createdUser._id}`);

  } catch (error) {
    if (error.code === 11000)
      throw new AppError("Email already registered", 409);
    logger.error("User registration failed", {
      category: "server",
      service: "auth",
      code: "AUTH_REGISTRATION_FAILED",
      lifecycle: "request",
      error,
    });
  }

};

export const loginController = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new AppError("Invalid Data fields", 400);

  const existingUserByEmail = await User.findOne({ email });
  if (!existingUserByEmail) throw new AppError("No user Exist", 404);

  if (!(await comparePassword(password, existingUserByEmail.password)))
    throw new AppError("Invalid Credentials", 401);

  // access token
  const accessToken = await generateAccessToken(existingUserByEmail._id);
  res.set("Authorization", accessToken).status(200).json({
    message: "User logged in Succesfully",
  });
};

export const logoutController = async (req, res) => {
  const token = req.headers.authorization;
  const exp = req.exp;
  const now = Math.floor(Date.now() / 1000);
  const ttl = exp - now;
  if (ttl > 1) {
    const redis = getRedis();
    const res = await redis.set(`bl:${token}`, "1", "EX", ttl)
  }
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
}

export const getMe = async (req, res, next) => {
  const user = await User.findById(req.userId).select("_id name email createdAt");
  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json({
    status: "success",
    data: { user }
  });
};