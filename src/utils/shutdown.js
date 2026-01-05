import { disconnectDb } from "../database/index.js";
import { server } from "../index.js";

export const gracefullShutdown = async () => {
  try {
    await disconnectDb();
  } catch (error) {
    console.log("Error while closing server ", error);
  } finally {
    server.close(() => {
      console.log("Server is Shutting down gracefully");
      process.exit(1);
    });
  }
};
