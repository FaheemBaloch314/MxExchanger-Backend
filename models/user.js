import mongoose from "mongoose";
import validator from 'validator'
import jwt from 'jsonwebtoken'




const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name"],
        maxLength: [30, "Name Cannot exceed 30 characters"],
        minLength: [4, "Name Should have more then 4 charecters"]
    },
    email: {
        type: String,
        required: [true, "Please Enter Your Email"],
        unique: true,
        validator: [validator.isEmail, "Please Enter a Valid Email"]
    },
    password: {
        type: String,
        required: [true, "Please Enter Your Password"],
        minLength: [5, "Password Should have more then 4 Charecters"],
        maxLength: [100, , "Password cannot exceed more then 100 charecters"],
        select: false

    },
    country: {
        type: String,
        required: [true, "Please Enter Your  Country"]
    },
    role: {
        type: String,
        default: "user"
    },
    createAt: {
        type: Date,
        default: Date.now
    },
    AccountMumber: {
        type: String,
        required: true,
        unique: true,

    },
    UsdAmount: {
        type: Number,
        default: 0
    },
    PkrAmount: {
        type: Number,
        default: 0
    },
    isVarified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        default: null
    },
    otpRequestCount: {
        type: Number,
        default: 0
    },
    otpRequestTimestamp: {
        type: Date,
        default: null
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpAttemptTimestamp: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    loginAttemptTimestamp: {
        type: Date
    },
})




// JWT TOKEN
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: '2d'
    });
};



export const User = new mongoose.model('user', userSchema)