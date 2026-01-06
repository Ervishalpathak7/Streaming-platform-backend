import { verifyAccessToken } from "../utils/jwt.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.headers?.authorization.split(" ")[1];
    if (!accessToken) {
      res.status(401).json({
        message: "no access token , kindly login again",
      });
      return;
    }
    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      res.status(401).json({
        message: "Access token expired , kindly login again",
      });
      return;
    }
    req.id = payload.userId;
    next();
  } catch (error) {
    res.status(500).json({
      message: "internal server error",
    });
    console.error("error in auth middleware :", error);
  }
};
