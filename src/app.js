import express from "express"
import { configDotenv } from "dotenv";
import userRouter from "./public/routes/user.js";
import { authMiddleware } from "./middlewares/auth.js";


configDotenv();
const app = express();


app.use(express.urlencoded({extended : true , limit : "16kb"}));
app.use(express.json({limit : "16kb"}));

// routes
app.use("/api" , userRouter)
app.use(authMiddleware)
app.use('/test' , (_ , res) => {
    res.send("okkkk")
})


export default app;
