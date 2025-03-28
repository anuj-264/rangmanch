import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import APIResponse from "../utils/APIResponse.js";


const generateAccessTokenandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;//save refresh token in db for future use 
        await user.save({ validateBeforeSave: false });//to avoid validation error on save of password
        return { accessToken, refreshToken };
    }
    catch {
        throw new APIError(500, 'Failed to generate tokens');
    }
};





const registerUser = asyncHandler(async (req, res) => {
    // get user details 
    const { fullname, email, password, username } = req.body;

    // validation
    const validateFields = (fields) => {
        for (const [key, value] of Object.entries(fields)) {
            if (!value || value.trim() === '') {
                throw new APIError(400, `The field '${key}' is required`);
            }
        }
    };

    validateFields({ fullname, email, password, username });

    // check if user already exists: username ,email
    const userdata = await User.findOne({ $or: [{ email }, { username }] })
    if (userdata) {
        throw new APIError(409, 'User with this email or username already exists');
    }
    //given by multer access to files in req
    const avatarPath = req.files?.avatar?.[0]?.path;
    const coverImagePath = req.files?.coverImage?.[0]?.path;

    //check for images and avatar
    if (!avatarPath) {
        throw new APIError(400, 'Please provide an avatar image');
    }


    //upload to cloudinary,check avatar
    const avatar = await uploadOnCloudinary(avatarPath);
    const coverImage = coverImagePath ? await uploadOnCloudinary(coverImagePath) : null;
    if (!avatar) {
        throw new APIError(500, 'Failed to upload avatar image to Cloudinary');
    } else if (coverImagePath && !coverImage) {
        throw new APIError(500, 'Failed to upload cover image');
    }

    // create user object- create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.secure_url,
        username: username.toLowerCase(),
        email,
        password,
        coverImage: coverImage?.secure_url
    });

    //remove passward and response token from res
    const CreatedUser = await User.findById(user._id).select('-password -refreshToken');

    //check for user creation
    if (!CreatedUser) {
        throw new APIError(500, 'Failed to create user');
    }



    // send response
    return res.status(201).json(new APIResponse(201, CreatedUser, 'User created successfully'));



});



//LOGIN USER//

const loginUser = asyncHandler(async (req, res) => {
    // req body 
    const { username, email, password } = req.body;

    //username or email
    if (!(username || email)) {
        throw new APIError(400, 'Please provide username or email');
    }

    //find the user
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
        throw new APIError(404, 'User not found');
    }

    //pass check
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
        throw new APIError(401, 'Invalid password');
    }

    //access and refresh token generation
    const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    //send res cookie
    const cookieOptions = {
        httpOnly: true, //cookie cannot be accessed or modified by browser only modified by server 
        secure: true, //cookie will be sent only on https

    };
    return res
        .status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json(new APIResponse(200, { loggedInUser, accessToken, refreshToken }, 'User logged in successfully'));




});

const logOutUser = asyncHandler(async (req, res) => {
    //clear cookies
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } },
        { new: true }
    );

    const cookieOptions = {
        httpOnly: true, //cookie cannot be accessed or modified by browser only modified by server 
        secure: true, //cookie will be sent only on https

    }
    return res
        .status(200)
        .clearCookie('accessToken', cookieOptions)
        .clearCookie('refreshToken', cookieOptions)
        .json(new APIResponse(200, {}, 'User logged out successfully'));



});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;//get refresh token from cookie
    if (!refreshToken) {
        throw new APIError(401, 'No refresh token provided');
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
        throw new APIError(401, 'Invalid refresh token');
    }
    if (user.refreshToken !== refreshToken) {
        throw new APIError(401, 'Invalid refresh token');
    }
    const accessToken = await user.generateAccessToken();
    return res.status(200).cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
    }).json(new APIResponse(200, { accessToken }, 'Access token refreshed successfully'));
});



const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
        throw new APIError(404, 'User not found');
    }
    const isValidPassword = await user.comparePassword(oldPassword);
    if (!isValidPassword) {
        throw new APIError(401, 'Invalid old password');
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });//to avoid validation error on save of password
    return res.status(200).json(new APIResponse(200, {}, 'Password changed successfully'));
});
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new APIResponse(200, req.user, 'User fetched successfully'));
});

const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname || !email) {
        throw new APIError(400, 'Please provide fullname and email');
    }
    const userId = req.user._id;
    const user = await User.findByIdAndUpdate(userId,
        {
            $set: { fullname, email }

        }, { new: true , runValidators: true }).select('-password -refreshToken');
    if (!user) {
        throw new APIError(404, 'User not found');
    }


return res.status(200).json(new APIResponse(200, user, 'User details updated successfully'));
});

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarPath = req.file?.avatar?.[0]?.path;
    if (!avatarPath) {
        throw new APIError(400, 'Please provide an avatar image');
    }
    const avatar = await uploadOnCloudinary(avatarPath);
    if (!avatar) {
        throw new APIError(500, 'Failed to upload avatar image to Cloudinary');
    }
    const userId = req.user._id;
    const user = await User.findByIdAndUpdate(userId,
        {
            $set: { avatar: avatar.secure_url }
        }, { new: true }).select('-password -refreshToken');
    if (!user) {
        throw new APIError(404, 'User not found');
    }
    return res.status(200).json(new APIResponse(200, user, 'Avatar updated successfully'));
});


const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImagePath = req.file?.coverImage?.[0]?.path;
    if (!coverImagePath) {
        throw new APIError(400, 'Please provide an cover image');
    }
    const coverImage = await uploadOnCloudinary(coverImagePath);
    if (!coverImage) {
        throw new APIError(500, 'Failed to upload cover image to Cloudinary');
    }
    const userId = req.user._id;
    const user = await User.findByIdAndUpdate(userId,
        {
            $set: { coverImage: coverImage.secure_url }
        }, { new: true }).select('-password -refreshToken');
    if (!user) {
        throw new APIError(404, 'User not found');
    }
    return res.status(200).json(new APIResponse(200, user, 'Cover image updated successfully'));
});

export { registerUser, loginUser, logOutUser, refreshAccessToken, 
    changeCurrentUserPassword, getCurrentUser, updateUserDetails, updateAvatar, updateCoverImage };