import express from "express"
import { configDotenv } from "dotenv";


configDotenv();
const app = express();

app.use(express.urlencoded({extended : true , limit : "16kb"}));
app.use(express.json({limit : "16kb"}));



export default app;
