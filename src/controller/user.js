import { User } from "../models/user.js";
import { comparePassword, hashPassword } from "../utils/bcrypt.js";
import { generateAccessToken } from "../utils/jwt.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      res.status(400).json({
        message: "Invalid data fields",
      });
      return;
    }

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      res.status(409).json({
        message: "Email already exist",
      });
      return;
    }

    // hash password
    const hashedPassword = await hashPassword(password);
    // create user in db
    const createdUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // send the response
    if (createdUser) {
      res.status(201).json({
        message: "User created successfully",
      });
      return;
    }
    res.status(500).json({
      message: "error while creating user",
    });
    return;
  } catch (error) {
    console.error("Error in registration :", error);
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(400).json({
        message: "Invalid data fields",
      });
      return;
    }

    const existingUserByEmail = await User.findOne({ email });
    if (!existingUserByEmail) {
      res.status(404).json({
        message: "No user found by this email",
      });
      return;
    }

    if (!(await comparePassword(password, existingUserByEmail.password))) {
      res.status(401).json({
        message: "Invalid Credential",
      });
      return;
    }

    // access token
    const accessToken = await generateAccessToken(existingUserByEmail._id);
    
    res.set('Authorization' , accessToken).status(200).json({
      message: "User logged in succesfully",
    });

    return;
  } catch (error) {
    console.error("Error while logging in :", error);
  }
};
