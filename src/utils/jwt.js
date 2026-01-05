import jwt from "jsonwebtoken";

export const generateAccessToken = async (userId) => {
  try {
    return await jwt.sign({ userId: userId }, process.env.JWT_SECRET, {
      algorithm: "HS256",
    });
  } catch (error) {
    console.error("Error while generating access token :", error);
  }
};

export const verifyAccessToken = async (token) => {
  try {
    return await jwt.verify(token, process.env.JWT_SECRET, { algorithms: "HS256" });
  } catch (error) {
    console.error("Error while verifying access token :", error);
  }
};
