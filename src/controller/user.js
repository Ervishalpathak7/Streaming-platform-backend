import { User } from "../models/user.js";
import { hashPassword } from "../utils/bcrypt.js";

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
