export const handleBackgroundError = (error, context = {}, type = "UNEXPECTED",) => {
  console.error({
    type : type,
    message: error.message || "Unknown error",
    context,
    stack: error?.stack,
  });
};
