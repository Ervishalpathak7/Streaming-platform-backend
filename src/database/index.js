import mongoose from "mongoose"


export const connectDb = async (uri) => {
    try {
        await mongoose.connect(uri);
        if(mongoose.connection.readyState == 1) {
            console.log("Database connected successfully");
        }
        
    } catch (error) {
        throw error;
    }

}