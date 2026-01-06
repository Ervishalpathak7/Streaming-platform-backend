import { Router } from "express";
import { loginController, register } from "../../controller/user.js";


const userRouter = Router();


userRouter.post('/register' , register);
userRouter.post('/login' , loginController)


export default userRouter