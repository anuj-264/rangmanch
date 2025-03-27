import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        maxlegth: [40, 'An username  must have less or equal then 40 characters'],
        minlegth: [5, 'An username  must have more or equal then 5 characters']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
        trim: true,
        maxlegth: [40, 'An username email name must have less or equal then 40 characters'],
        minlegth: [10, 'An email name must have more or equal then 10 characters']
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true,
        minlegth: [5, 'A fullname name must have more or equal then 10 characters']
    },
    avatar: {
        type: String, //cloudinary 
        required: true,
    },
    coverImage: {
        type: String, //cloudinary
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        trim: true
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Video'
        }
    ],
    refreshToken: {
        type: String

    },

}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

//called to validate password when req like during login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};


//called to generate access token 
userSchema.methods.generateAccessToken =  function () {
    return   jwt.sign(
        {
            id: this._id,
            username: this.username,
            email: this.email,
            fullname: this.fullname


        }, process.env.ACCESS_SECRET_KEY, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIREY
    });
};

//called to generate refresh token
userSchema.methods.generateRefreshToken = async function () {
    return   jwt.sign(
        {
            id: this._id,

        }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIREY
    });
 };









export const User = mongoose.model('User', userSchema);