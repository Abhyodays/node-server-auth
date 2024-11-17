import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token.")
    }
}
const registerUser = asyncHandler(async (req, res) => {
    // get all data
    const { fullName, email, password, username } = req.body

    // validation
    if ([email, password, fullName, password].some(field =>
        (field === undefined || field.trim() === "")
    )) {
        throw new ApiError(400, "All fields are required.")
    }
    // check for existing user
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(400, "Username or Email already exists.")
    }
    // create new user

    const user = await User.create({
        fullName,
        email: email.toLowerCase(),
        password,
        username: username.toLowerCase()
    })
    console.log(user)
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    console.log(createdUser)
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating a user.")
    }
    // send response to user
    res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"))

})

const loginUser = asyncHandler(async (req, res) => {
    // get credentials
    const { username, email, password } = req.body
    // check user using email and password
    if (!(username || email)) {
        throw new ApiError(400, "Username or Email required.");
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "User does not exist.")
    }
    // check password correct
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invlaid credentials.")
    }
    // save refresh token in db
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // return access token and refresh token and also save in cookies
    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                })
        )
}
)
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out.")
        )
})
export {
    registerUser,
    loginUser,
    logoutUser
}