import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"

const verifyUser = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken ||
            req.header("Authorization").replace("Bearer ", "");
        if (!token) {
            throw new ApiError(401, "Unauthorized access.")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(401, "Invalid Access Token.")
        }
        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, "Unauthorized access.")
    }
})

export { verifyUser }