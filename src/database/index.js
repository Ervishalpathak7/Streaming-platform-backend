import mongoose from "mongoose";

export const connectDb = async (uri) => {
  try {
    await mongoose.connect(uri, {
      dbName: "streaming-platform",
      maxPoolSize: 10,
    });
    if (mongoose.connection.readyState == 1) {
      console.log("Database connected successfully");
    }
  } catch (error) {
    throw error;
  }
};

export const disconnectDb = async () => {
  try {
    await mongoose.disconnect();
    console.log("Database is disconnected successfully")
    
  } catch (error) {
    throw error;
  }
};
