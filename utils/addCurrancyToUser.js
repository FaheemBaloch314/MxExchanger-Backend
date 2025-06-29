import { ActivityType } from "../models/activityType.js";
import { User } from "../models/user.js";
import ErrorHandler from "./errorHandler.js";
export const addCurrencyToUser = async (AccountMumber, currancy, amount) => {

    const fieldMap = {
        PKR: 'PkrAmount',
        USD: 'UsdAmount',
    };

    const fieldToUpdate = fieldMap[currancy?.toUpperCase()];

    if (!fieldToUpdate) {
        throw new Error("Invalid currency type");
    }

    await User.findOneAndUpdate(
        { AccountMumber },
        { $inc: { [fieldToUpdate]: amount } },
        { new: true }
    );
};


export const calculateBalance = async (checkBalance, gateway, amountToWithdraw, next, withdraw, res, id) => {
    const PKRS = ['JazzCash', 'easypasa', 'Bank', 'AddCash'];
    const USDS = ['payeer', 'perfactmoney', 'trx', 'dogecoin'];

    const isPKRGateway = PKRS.includes(gateway);
    const isUSDGateway = USDS.includes(gateway);

    if (isPKRGateway) {
        if (checkBalance.PkrAmount < amountToWithdraw) {
            withdraw.status = 'reject'
            await withdraw.save()
            return next(new ErrorHandler('insafficant balance'))
        }
    }
    if (isUSDGateway) {
        if (checkBalance.UsdAmount < amountToWithdraw) {
            withdraw.status = 'reject'
            await withdraw.save()
            return next(new ErrorHandler('insafficant balance'))
        }
    }

    if (isPKRGateway) {
        checkBalance.PkrAmount -= amountToWithdraw;
    } else if (isUSDGateway) {
        checkBalance.UsdAmount -= amountToWithdraw;
    }

    // Save updated balance
    await checkBalance.save();

    await ActivityType.findOneAndUpdate({ userId: id }, { $set: { status: 'accept' } })


    res.json({
        success: true,
        message: 'Order Completed Successfully',
    });
}

