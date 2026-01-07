import { AppError } from "../error/index.js";

export const errorHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err?.errorMessage || "Internal server error",
  });
  if (err instanceof AppError) {
    console.error(`Error : ${err.errorMessage}`);
  } else console.error(`Error : ${err.errorMessage}`);
};
