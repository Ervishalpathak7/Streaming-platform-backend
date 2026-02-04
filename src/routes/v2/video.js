import { Router } from "express";
import { completeUploadControllerV2, getMyVideosControllerV2, getSignedUrlControllerV2, initUploadControllerV2 } from "../../controller/v2/videoController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { rateLimitMiddleware } from "../../middlewares/rateLimiting.js";


const v2VideoRouter = Router();

v2VideoRouter.get("/my",
    authMiddleware,
    rateLimitMiddleware("GET", req => req.userId || req.ip),
    asyncHandler(getMyVideosControllerV2)
);

v2VideoRouter.post("/init",
    authMiddleware,
    rateLimitMiddleware("UPLOAD", req => req.userId || req.ip),
    asyncHandler(initUploadControllerV2)
);

v2VideoRouter.get("/signed-urls/:videoId",
    authMiddleware,
    rateLimitMiddleware("UPLOAD", req => req.userId || req.ip),
    asyncHandler(getSignedUrlControllerV2)
);

v2VideoRouter.post("/complete/:videoId",
    authMiddleware,
    rateLimitMiddleware("UPLOAD", req => req.userId || req.ip),
    asyncHandler(completeUploadControllerV2)
);



export default v2VideoRouter;