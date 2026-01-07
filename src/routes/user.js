import { Router } from "express";
import { loginController, register } from "../controller/user.js";
import {asyncHandler} from "../utils/asyncHandler.js"


const userRouter = Router();


userRouter.post('/register' , asyncHandler(register));
userRouter.post('/login' , asyncHandler(loginController))


export default userRouter