import asyncHandler from "../utils/asyncHandler.js"
import APIError from "../utils/APIError.js";
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';


export const verifyJWT = asyncHandler(async (req, res, next) => {
    //get token from req header or cookie 
    const authHeader = req.header('Authorization');
    const token = req.cookies?.accessToken || (authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null);
    // console.log("Authorization Header:", authHeader);
    // console.log("Access Token from Cookie:", req.cookies?.accessToken);
    // console.log("Final Token:", token);
    if (!token) {
        throw new APIError(401, 'Unauthorized access');
    }
    try {
        //verify token and get user data  
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
        // console.log("Decoded Token:", decoded);
        const user = await User.findById(decoded?.id).select('-password -refreshToken');
        if (!user) {
            throw new APIError(401, 'Unauthorized access');
        }
        //set user data to req.user 
        req.user = user;
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        throw new APIError(401, 'Unauthorized access');
    }

});