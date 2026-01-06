import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
    lowercase: true,
  },
  password: {
    type: String,
    require: true,
  },
  files: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Videos",
  },
});

export const User = mongoose.model("Users", UserSchema);

// export const createTestingUser = async () => {
//   try {
//     const user = await User.create({
//       name: "Vishal",
//       email: "Vishalpathak",
//       password: "visalpathak",
//     });

//     if (user) {
//       console.log("User created Successfully : ", user);
//       await TestingVideoFunc(user , "video uri")
//       return;
//     }
//     console.log("Error creating user");
//   } catch (error) {
//     throw error;
//   }
// };
