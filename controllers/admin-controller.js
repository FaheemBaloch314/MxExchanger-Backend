import asyncHandler from "../middlewares/catchAsyncError.js";
import { Deposit } from "../models/deposit.js";
import { Rates } from "../models/rates.js";
import { User } from "../models/user.js";
import { addCurrencyToUser, calculateBalance } from "../utils/addCurrancyToUser.js";
import ErrorHandler from "../utils/errorHandler.js";
import { Withdraw } from '../models/withdraw.js'
import { ActivityType } from "../models/activityType.js";
import { Contact } from "../models/contact.js";
import { Accounts } from "../models/accounts.js";


export const rates = asyncHandler(async (req, res, next) => {
    const rates = await Rates.findOne(); // Get latest or only one record

    if (!rates) {
        return res.status(404).json({ success: false, message: "Rates not found" });
    }

    res.json({
        success: true,
        data: {
            buying: rates.buying,
            selling: rates.selling
        }
    });
});


export const updateRates = asyncHandler(async (req, res, next) => {
    let { buying, selling } = req.body;

    // Check if either value is undefined or null
    if (buying === undefined || selling === undefined || buying === null || selling === null) {
        return next(new ErrorHandler("Both buying and selling rates are required.", 400));
    }

    // Convert to numbers
    buying = Number(buying);
    selling = Number(selling);

    // Validate that the values are valid numbers
    if (isNaN(buying) || isNaN(selling)) {
        return next(new ErrorHandler("Buying and Selling must be valid numbers.", 400));
    }

    // Validate that values are not strings (like "abc") and not negative
    if (typeof buying !== "number" || typeof selling !== "number" || buying < 0 || selling < 0) {
        return next(new ErrorHandler("Buying and Selling must be non-negative numbers.", 400));
    }

    // Update or create rates
    await Rates.findOneAndUpdate(
        {},
        { buying, selling },
        { new: true, upsert: true }
    );

    res.json({
        success: true,
        message: "Rates have been updated successfully."
    });
});



export const users = asyncHandler(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users,
    });
});



export const deleteUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) return next(new ErrorHandler("User ID required", 400));
    if (req.user._id.toString() === id) {
        return next(new ErrorHandler("You cannot delete your own account", 403));
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
        return next(new ErrorHandler("User not found", 404));
    }

    res.json({ success: true, message: "User deleted successfully" });
});


export const deposit = asyncHandler(async (req, res, next) => {

    const allDeposits = await Deposit.find({ status: "panding" })
    res.json(allDeposits)
})


export const cancalRequest = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const reject = await Deposit.findOneAndUpdate({ _id: id }, { $set: { status: 'reject' } })
    if (!reject) return next(new ErrorHandler("Order Not Found", 404))

    await ActivityType.findOneAndUpdate({ userId: id }, { $set: { status: 'reject' } })


    res.json({
        success: true,
        message: "Reject Successfully"
    })
})




export const acceptRequest = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // 🛑 Input validation


    // ✅ Update deposit status
    const deposit = await Deposit.findByIdAndUpdate(id, { status: 'accept' });

    const AccountMumber = deposit.AccountMumber
    const currancy = deposit.currancy
    const amount = deposit.amount



    if (!deposit) {
        return next(new ErrorHandler("Order Not Found", 404));
    }



    // ✅ Add currency to user balance
    try {
        await addCurrencyToUser(AccountMumber, currancy, amount);
    } catch (error) {
        console.log(error)
        return next(new ErrorHandler("Currency update failed: ", 500));
    }


    await ActivityType.findOneAndUpdate({ userId: id }, { $set: { status: 'accept' } })
    res.json({
        success: true,
        message: 'Order Completed Successfully',
    });
});




export const adminDashBord = asyncHandler(async (req, res, next) => {
    try {
        // Run all counts in parallel using Promise.all
        const [totalUsers, totalDeposits, totalWithdraws, resultPkr, resultUsd] = await Promise.all([
            User.countDocuments(),
            Deposit.countDocuments(),
            Withdraw.countDocuments(),
            User.aggregate([
                { $group: { _id: null, totalPkr: { $sum: "$PkrAmount" } } }
            ]),
            User.aggregate([
                { $group: { _id: null, totalUsd: { $sum: "$UsdAmount" } } }
            ]),
        ]);

        const pkrTotal = resultPkr[0]?.totalPkr || 0;
        const usdTotal = resultUsd[0]?.totalUsd || 0;

        return res.status(200).json({
            success: true,
            totalUsers,
            totalDeposits,
            totalWithdraws,
            pkrTotal,
            usdTotal,
        });
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        return next(new ErrorHandler("Failed to fetch admin dashboard data", 500));
    }
});



export const withdraw = asyncHandler(async (req, res, next) => {

    const allWithdraw = await Withdraw.find({ status: 'panding' })
    res.json(allWithdraw)

})


export const cancalRequestWithdraw = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const reject = await Withdraw.findOneAndUpdate({ _id: id }, { $set: { status: 'reject' } })
    if (!reject) return next(new ErrorHandler("Order Not Found", 404))

    await ActivityType.findOneAndUpdate({ userId: id }, { $set: { status: 'reject' } })


    res.json({
        success: true,
        message: "Reject Successfully"
    })
})


export const acceptRequestWithdraw = asyncHandler(async (req, res, next) => {
    const { id } = req.params;





    // ✅ Update deposit status
    const withdraw = await Withdraw.findByIdAndUpdate(id, { status: 'accept' });




    if (!withdraw) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    const totalAmount = withdraw.totalAmount
    const gateway = withdraw.gateway
    const AccountMumber = withdraw.AccountMumber

    const checkBalance = await User.findOne({ AccountMumber })

    // ✅ remove currency to user balance
    // calculateBalance(checkBalance, gateway)

    // return res.json({ success: true, message: 'wait' })
    const amountToWithdraw = parseFloat(totalAmount);


    await calculateBalance(checkBalance, gateway, amountToWithdraw, next, withdraw, res, id)



});


export const alllWithdraws = asyncHandler(async (req, res, next) => {

    const alllWithdraws = await Withdraw.find({})

    res.json(alllWithdraws)
})

export const allDeposits = asyncHandler(async (req, res, next) => {

    const allDeposits = await Deposit.find({})

    res.json(allDeposits)
})

export const deleteWithdraw = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) return next(new ErrorHandler('Id Not Found', 400));

    try {
        const deletedWithdraw = await Withdraw.findByIdAndDelete(id);

        if (!deletedWithdraw) {
            return next(new ErrorHandler('Withdraw not found', 404));
        }

        res.json({
            success: true,
            message: "Withdraw deleted successfully",
        });
    } catch (error) {
        return next(new ErrorHandler('Invalid Id', 400));
    }
});



export const deleteDeposit = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return next(new ErrorHandler('ID is required', 400));
    }

    try {
        const deleted = await Deposit.findByIdAndDelete(id);

        if (!deleted) {
            return next(new ErrorHandler('Deposit not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Deposit deleted successfully',
        });
    } catch (error) {
        return next(new ErrorHandler('Invalid ID format', 400));
    }
});




export const messaages = asyncHandler(async (req, res, next) => {

    const messaages = await Contact.find()

    res.json(messaages)
})


export const isAdmin = asyncHandler(async (req, res, next) => {

    res.json({
        success: true,
        message: 'you can vist this page'
    })
})

export const accounts = asyncHandler(async (req, res, next) => {
    const account = await Accounts.findOne(); // ✅ findOne instead of find
    if (!account) {
        return res.status(404).json({ message: "No account found" });
    }
    res.status(200).json(account); // ✅ Always use .json()
});


export const AccountsOpration = asyncHandler(async (req, res, next) => {
    const {
        easypasa,
        easypasaHolderName,
        jazzcash,
        jazzcashHolderName,
        bank,
        bankHolderName,
        perfactMoney,
        USDT,
        TRX,
        payneer
    } = req.body;

    // Proper validation
    if (
        !easypasa ||
        !easypasaHolderName ||
        !jazzcash ||
        !jazzcashHolderName ||
        !bank ||
        !bankHolderName ||
        !perfactMoney ||
        !USDT ||
        !TRX ||
        !payneer
    ) {
        return next(new ErrorHandler('All fields are required', 400));
    }

    // Assuming single account record (singleton pattern)
    let account = await Accounts.findOne();

    if (account) {
        // Update existing
        account.easypasa = easypasa;
        account.easypasaHolderName = easypasaHolderName;
        account.jazzcash = jazzcash;
        account.jazzcashHolderName = jazzcashHolderName;
        account.bank = bank;
        account.bankHolderName = bankHolderName;
        account.perfactMoney = perfactMoney;
        account.USDT = USDT;
        account.TRX = TRX;
        account.payneer = payneer;

        await account.save();
    } else {
        // Create new
        account = await Accounts.create({
            easypasa,
            easypasaHolderName,
            jazzcash,
            jazzcashHolderName,
            bank,
            bankHolderName,
            perfactMoney,
            USDT,
            TRX,
            payneer,
        });
    }

    res.status(200).json({
        success: true,
        message: 'Account information saved successfully',
        account,
    });
});
