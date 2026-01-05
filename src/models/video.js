import mongoose, { Schema } from "mongoose";


const VideoSchema = new Schema({
    owner : {
        type : "ObjectId",
        ref : "Users"
    },
    url : {
        type : String,
        require : true
    },

})


export const Video = new mongoose.model("Videos" , VideoSchema);

// export const TestingVideoFunc = async (user , url ) => {
//     try {
//         const video = await Video.create({
//             owner : user._id,
//             url,
//         })
//         if(video) {
//             console.log("Video saved successfully" , video)
//             return;
//         }
//         console.log("error creating video " , video);

//     } catch (error) {
//         throw error
//     }
// }