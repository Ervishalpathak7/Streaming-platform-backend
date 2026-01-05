import express from "express"
import { configDotenv } from "dotenv";
import userRouter from "./routes/user.js";


configDotenv();
const app = express();


app.use(express.urlencoded({extended : true , limit : "16kb"}));
app.use(express.json({limit : "16kb"}));

// routes
app.use("/api" , userRouter)


export default app;
