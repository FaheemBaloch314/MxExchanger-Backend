import asyncHandler from "../middlewares/catchAsyncError.js";
import { User } from "../models/user.js";
import ErrorHandler from "./errorHandler.js";

export const userIsVarified = asyncHandler(async (user, next) => {
    try {

        const checkUser = await User.findById(user)
        console.log(checkUser)
        if (!checkUser.isVarified) return next(new ErrorHandler('You Need To verify You Account to perform this action', 403))
    } catch (error) {
        return next(new ErrorHandler('You Need To verify You Account to perform this action', 403))
    }

})

