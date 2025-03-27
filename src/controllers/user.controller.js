import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import APIResponse from "../utils/APIResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user details 
    const { fullname, email, password, username } = req.body;
    console.log(email);
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
    return res.status(201).json(APIResponse(201, CreatedUser,'User created successfully'));



});

export { registerUser }