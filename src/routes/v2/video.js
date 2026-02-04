import { Router } from "express";
import { getSignedUrlControllerV2, initUploadControllerV2 } from "../../controller/v2/videoController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { rateLimitMiddleware } from "../../middlewares/rateLimiting.js";


const v2VideoRouter = Router();

v2VideoRouter.post("/init",
    authMiddleware,
    rateLimitMiddleware("UPLOAD", req => req.userId || req.ip),
    asyncHandler(initUploadControllerV2)
)

v2VideoRouter.get("/signed-urls/:videoId",
    authMiddleware,
    rateLimitMiddleware("UPLOAD", req => req.userId || req.ip),
    asyncHandler( getSignedUrlControllerV2 )
)

export default v2VideoRouter;