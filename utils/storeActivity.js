import asyncHandler from "../middlewares/catchAsyncError.js";
import { ActivityType } from '../models/activityType.js';

export const storeActivity = async (AccountNumber, activityType, Amount, status, userId, user) => {
    await ActivityType.create({
        AccountNumber,
        ActivityType: activityType,
        Amount,
        status,
        userId,
        user,
    });
};


