import { AppError } from "../error/index.js";
import { User } from "../models/user.js";
import { comparePassword, hashPassword } from "../utils/bcrypt.js";
import { generateAccessToken } from "../utils/jwt.js";
import { logger } from "../utils/winston.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    throw new AppError("Invalid data fields", 400);

  // hash password
  const hashedPassword = await hashPassword(password);

  // create user in db
  try {
    const createdUser = await User.create({
      name,
      email,
      password: hashedPassword,
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
  // send the response
  res.status(201).json({
    message: "User Registered successfully",
  });
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
