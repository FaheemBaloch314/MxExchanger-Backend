import asyncHandler from './catchAsyncError.js'
import { User } from "../models/user.js";
import ErrorHandler from '../utils/errorHandler.js';
import jwt from 'jsonwebtoken'


export const isAuthenticatedUser = asyncHandler(async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler("Please Login to access this resource", 401));
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decodedData.id);
    } catch (error) {
        return next(new ErrorHandler("Invalid Token ", 403))
    }

    next();
});



export const isAuthenticatedAdmin = asyncHandler(async (req, res, next) => {

    const { token } = req.cookies
    if (!token) return next(new ErrorHandler('Token Not Found', 404))

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET)


        const isAdmin = await User.findById(decodedData.id)


        if (!isAdmin.role === 'admin') return next(new ErrorHandler(`Role ${isAdmin.role} is not allowd to access this resource`, 403))

        // 
        next()

    } catch (error) {
        console.log(error)
        return next(new ErrorHandler('Invalid Token', 400))
    }

})
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorHandler(
                    `Role: ${req.user.role} is not allowed to access this resource`,
                    403
                )
            );
        }

        next();
    };
};
