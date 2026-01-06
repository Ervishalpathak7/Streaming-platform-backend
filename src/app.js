import express from "express"
import { configDotenv } from "dotenv";
import { authMiddleware } from "./middlewares/auth.js";
import fileRouter from "./routes/video.js";
import userRouter from "./routes/user.js";


configDotenv();
const app = express();


app.use(express.urlencoded({extended : true , limit : "16kb"}));
app.use(express.json({limit : "16kb"}));

// routes
app.use("/api" , userRouter)
app.use(authMiddleware)
app.use("/" , fileRouter)
app.use('/test' , (_ , res) => {
    console.log(req.userId)
    res.send("okkkk")
})


export default app;
