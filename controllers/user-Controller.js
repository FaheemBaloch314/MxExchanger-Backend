import asyncHandler from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import validator from "validator";
import xss from "xss";
import { v4 as uuidv4 } from 'uuid';
import { User } from "../models/user.js";
import sendToken from "../utils/sendToken.js";
import bcrypt from "bcryptjs";
import { Deposit } from "../models/deposit.js";
import { Contact } from "../models/contact.js";
import { Withdraw } from "../models/withdraw.js";
import { Transaction } from "../models/transaction.js";
import { storeActivity } from '../utils/storeActivity.js'
import { ActivityType } from "../models/activityType.js";
import { generateOTP, sendNewUserOtp, sendOtp, verifyNewUser, verifyOTP } from "../utils/sendOtp.js";
import { Rates } from "../models/rates.js";



export const register = asyncHandler(async (req, res, next) => {
    let { name, email, country, password } = req.body;

    // Trim and sanitize input
    name = xss(name?.trim());
    email = xss(email?.trim().toLowerCase());
    country = xss(country?.trim());
    password = xss(password?.trim());

    // Basic required field check
    if (!name || !email || !country || !password) {
        return next(new ErrorHandler("All fields are required", 400));
    }

    // Email format check
    if (!validator.isEmail(email)) {
        return next(new ErrorHandler("Invalid email format", 400));
    }

    // Password strength
    if (password.length < 5) {
        return next(new ErrorHandler("Password must be at least 6 characters", 400));
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new ErrorHandler("Email is Already Registered", 401));
    }

    // Generate unique 8-digit account number
    function generateUnique8DigitId() {
        const uuid = uuidv4().replace(/-/g, '');
        const hash = parseInt(uuid.slice(0, 12), 16);
        const id = hash % 100000000;
        return id.toString().padStart(8, '0');
    }
    const AccountMumber = generateUnique8DigitId();

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
        name,
        email,
        country,
        password: hashPassword,
        AccountMumber,
    });

    // Attach to req for later use if needed
    req.user = user;

    // Send OTP
    await sendNewUserOtp(email);

    // ✅ Important: Respond to frontend
    res.status(201).json({
        success: true,
        message: "OTP sent to email",
    });
});



export const newUserVeify = asyncHandler(async (req, res, next) => {

    const { email, enteredOtp } = req.body
    verifyNewUser(email, enteredOtp, res)
})

export const verifyOtpController = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    await verifyOTP(email, otp, newPassword, res);
});

export const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) return next(new ErrorHandler("Invalid Email or Password", 401));

    const now = Date.now();
    const attemptWindow = 24 * 60 * 60 * 1000; // 24 hours

    // Check if user is blocked
    if (user.loginAttemptTimestamp && now - user.loginAttemptTimestamp.getTime() < attemptWindow) {
        if (user.loginAttempts >= 8) {
            return next(new ErrorHandler("Too many failed login attempts. Try again later.", 429));
        }
    } else {
        // Reset counter if 24 hours passed
        user.loginAttempts = 0;
        user.loginAttemptTimestamp = new Date();
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        user.loginAttempts += 1;
        user.loginAttemptTimestamp = new Date();
        await user.save();
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    // ✅ Login success — reset attempt counter
    user.loginAttempts = 0;
    user.loginAttemptTimestamp = null;
    await user.save();

    req.user = user;
    sendToken(user, 200, res);
});


export const dashbord = asyncHandler(async (req, res, next) => {
    const user = req.user

    res.json({
        UsdAmount: user.UsdAmount,
        PkrAmount: user.PkrAmount,
        AccountMumber: user.AccountMumber
    })
})


// Helper function to handle currency balance update


// Controller
export const deposit = asyncHandler(async (req, res, next) => {

    const { user } = req.user

    // userIsVarified(user._id, next)

    const { currancy, paymentMethod, amount, transitionId } = req.body;
    const { AccountMumber, name, email } = req.user;

    if (!currancy || !paymentMethod || !amount || !transitionId) {
        return next(new ErrorHandler("All Fields Are Required", 400));
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        return next(new ErrorHandler("Invalid amount", 400));
    }

    try {
        const user = await User.findOne({ AccountMumber });
        if (!user) {
            return res.status(401).json({ success: false, message: "User Not Found" });
        }

        // ✅ Use helper function to add currency


        // ✅ Create deposit record
        const userDeposit = await Deposit.create({
            currancy,
            paymentMethod,
            amount: numericAmount,
            transitionId,
            AccountMumber,
            name,
            email,
        });

        await storeActivity(AccountMumber, `Deposit ${currancy} To Your Account`, numericAmount, 'Panding', userDeposit._id, req.user._id);


        res.json({ success: true, message: "Deposit Successful, wait for verification" });
    } catch (error) {
        if (error.message === "Invalid currency type") {
            return next(new ErrorHandler("Invalid currency type", 400));
        }

        console.error("Deposit Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});





export const sendmoney = asyncHandler(async (req, res, next) => {
    const { amount, account, desc, currancy } = req.body;
    const user = req.user;

    if (!amount || !account || !currancy) {
        return next(new ErrorHandler("Please fill all input fields", 400));
    }

    if (account === user.AccountMumber) {
        return next(new ErrorHandler("You Can't Send Money to You"))
    }
    if (amount <= 0) {
        return res.json({ success: false, message: "Please enter a positive number" });
    }

    let targetUser = await User.findOne({ AccountMumber: account });
    if (!targetUser) {
        return res.json({ success: false, message: "Invalid account number" });
    }

    let amountInt = parseInt(amount);
    let senderId = user._id;



    if (currancy === 'PKR') {
        if (user.PkrAmount < amountInt) {
            return res.json({ success: false, message: `Insufficient balance. Your balance is ${user.PkrAmount}` });
        }

        // Update sender balance
        await User.findByIdAndUpdate(senderId, {
            $inc: { PkrAmount: -amountInt }
        });

        // Update receiver balance
        await User.findOneAndUpdate(
            { AccountMumber: account },
            { $inc: { PkrAmount: amountInt } }
        );

        // After updating balances
        const transition = await Transaction.create({
            senderAccount: user.AccountMumber,
            receiverAccount: account,
            senderName: user.name,
            receiverName: targetUser.name,
            amount: amountInt,
            currency: currancy,
            description: desc || "",
        });

        await storeActivity(user.AccountMumber, `Send ${currancy} to ${targetUser.AccountMumber}`, amountInt, 'complete', transition._id, req.user._id);


        return res.json({
            success: true,
            message: "Money sent successfully"
        });
    }

    if (currancy === 'USD') {
        if (user.UsdAmount < amountInt) {
            return res.json({ success: false, message: `Insufficient balance. Your balance is ${user.UsdAmount}` });
        }

        // Update sender balance
        await User.findByIdAndUpdate(senderId, {
            $inc: { UsdAmount: -amountInt }
        });

        // Update receiver balance
        await User.findOneAndUpdate(
            { AccountMumber: account },
            { $inc: { UsdAmount: amountInt } }
        );

        // After updating balances
        const transition = await Transaction.create({
            senderAccount: user.AccountMumber,
            receiverAccount: account,
            senderName: user.name,
            receiverName: targetUser.name,
            amount: amountInt,
            currency: currancy,
            description: desc || "",
        });

        await storeActivity(user.AccountMumber, `Send ${currancy} to ${targetUser.AccountMumber}`, amountInt, 'complete', transition._id, req.user._id);

        return res.json({
            success: true,
            message: "Money sent successfully"
        });

    }

    // Unsupported currency
    return res.json({
        success: false,
        message: "Currency not supported"
    });
});


export const contact = asyncHandler(async (req, res, next) => {
    const { message } = req.body
    const { name, email } = req.user

    if (!message) return next(new ErrorHandler("Please Enter You Message", 400))


    await Contact.create({
        name, email, message
    })

    res.json({
        success: true, message: "We Recived Your Message We  Will Respond you as soon "
    })



})




export const exchange = asyncHandler(async (req, res, next) => {
    try {
        let { fromCurrency, toCurrency, amount } = req.body;
        const user = req.user;

        // Convert amount to number explicitly
        amount = Number(amount);

        // 1. Validate input
        if (!fromCurrency || !toCurrency || isNaN(amount)) {
            return next(new ErrorHandler('Please provide fromCurrency, toCurrency, and amount', 400));
        }

        if (amount <= 0) {
            return next(new ErrorHandler('Amount must be a positive number', 400));
        }

        const allowed = ['USD', 'PKR'];
        if (!allowed.includes(fromCurrency) || !allowed.includes(toCurrency)) {
            return next(new ErrorHandler('Currency not available. Only USD and PKR are supported.', 400));
        }

        if (fromCurrency === toCurrency) {
            return next(new ErrorHandler('From and To currencies must be different', 400));
        }

        const rates = await Rates.findOne({});
        if (!rates) {
            return next(new ErrorHandler('Exchange rates not found', 500));
        }

        // ========== PKR to USD ==========
        if (fromCurrency === 'PKR') {

            if (user.PkrAmount < amount) {
                return next(new ErrorHandler('Insufficient PKR Balance', 400));
            }

            const convertedAmount = parseFloat((amount / rates.selling).toFixed(3));

            user.PkrAmount = parseFloat((user.PkrAmount - amount).toFixed(3));
            user.UsdAmount = parseFloat((user.UsdAmount + convertedAmount).toFixed(3));
            await user.save();

            return res.json({
                success: true,
                message: `Converted ${amount} PKR to ${convertedAmount} USD`,
                convertedAmount,
                newPkrBalance: user.PkrAmount,
                newUsdBalance: user.UsdAmount
            });
        }

        // ========== USD to PKR ==========
        if (fromCurrency === 'USD') {

            if (user.UsdAmount < amount) {
                return next(new ErrorHandler('Insufficient USD Balance', 400));
            }

            const convertedAmount = parseFloat((amount * rates.buying).toFixed(3));

            user.UsdAmount = parseFloat((user.UsdAmount - amount).toFixed(3));
            user.PkrAmount = parseFloat((user.PkrAmount + convertedAmount).toFixed(3));
            await user.save();

            return res.json({
                success: true,
                message: `Converted ${amount} USD to ${convertedAmount} PKR`,
                convertedAmount,
                newUsdBalance: user.UsdAmount,
                newPkrBalance: user.PkrAmount
            });
        }

    } catch (error) {
        console.error("Exchange error:", error);
        return next(new ErrorHandler('Something went wrong during currency exchange', 500));
    }
});


export const profile = asyncHandler(async (req, res, next) => {
    const user = req.user

    if (!user) return next(new ErrorHandler('Please Login First', 401))
    res.json({
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        account: user.AccountMumber

    })


})




export const update = asyncHandler(async (req, res, next) => {
    const { name, email, country } = req.body;

    if (!name || !email || !country) {
        return next(new ErrorHandler('Please fill all fields', 400));
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // Email change logic
    if (email !== user.email) {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return next(
                new ErrorHandler(
                    'Unable to update profile at the moment. Please verify your details and try again.',
                    400
                )
            );
        }

        // If the existing user has role "admin", allow only if the same admin is updating their own email
        if (existingUser?.role === "admin" && existingUser._id.toString() !== userId.toString()) {
            return next(new ErrorHandler("Only the admin can change their own email.", 403));
        }
    }

    user.name = name;
    user.email = email;
    user.country = country;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully'
    });
});





export const passwordchange = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return next(new ErrorHandler('Both old and new passwords are required.', 400));
    }

    if (newPassword.length <= 5) return next(new ErrorHandler('Please Enter Strong Password', 400))

    const user = await User.findById(userId).select('+password');
    if (!user) {
        return next(new ErrorHandler('User not found. Please re-login.', 404));
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        return next(new ErrorHandler('The current password you entered is incorrect.', 400));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password changed successfully.',
    });
});





export const withdraw = asyncHandler(async (req, res, next) => {
    const { gateway, totalAmount, amount, account, accountHolderName, bankName } = req.body;
    const user = req.user;

    // === Input Validation ===
    if (!gateway || !totalAmount || !amount || !account) {
        return next(new ErrorHandler('All Fields are required', 400))
    }

    // Prevent negative or zero withdrawal
    const parsedAmount = parseFloat(amount);
    const parsedTotal = parseFloat(totalAmount);

    if (isNaN(parsedAmount) || isNaN(parsedTotal) || parsedAmount <= 0 || parsedTotal <= 0) {
        return next(new ErrorHandler('Number Must be a Postive', 400))
    }

    // === Validate Gateway ===
    const PKRS = ['JazzCash', 'easypasa', 'Bank', 'AddCash'];
    const USDS = ['payeer', 'perfactmoney', 'trx', 'dogecoin'];
    const ALL_GATEWAYS = [...PKRS, ...USDS];

    if (!ALL_GATEWAYS.includes(gateway)) {
        return next(new ErrorHandler('Invalid Payment Gatway', 400))
    }

    // === Fetch User and Check Balance ===
    const checkBalance = await User.findById(user._id);
    if (!checkBalance) {
        return next(new ErrorHandler('User Not Found', 400))
    }

    const userBalance = PKRS.includes(gateway)
        ? checkBalance.PkrAmount
        : USDS.includes(gateway)
            ? checkBalance.UsdAmount
            : 0;

    if (userBalance < parsedTotal) {
        return next(new ErrorHandler('Insfficant Balance', 400))
    }

    // === Withdrawal Fee Calculation ===
    const calculateWithdrawalFee = (amount) => {
        const debited = 1 + (amount * 2) / 100;
        const total = amount - debited;
        return total > 0 ? total : 0;
    };

    const debitedAmount = calculateWithdrawalFee(parsedTotal);

    // === Create Withdrawal Object ===
    const withdrawalData = {
        gateway,
        totalAmount: parsedTotal,
        amount: gateway === 'JazzCash' || gateway === 'easypasa' ? debitedAmount : parsedAmount,
        account,
        name: user.name,
        email: user.email,
        AccountMumber: user.AccountMumber,
        PkrAmount: user.PkrAmount,
        UsdAmount: user.UsdAmount
    };

    if (gateway === 'Bank') {
        if (!accountHolderName || !bankName) {
            return next(new ErrorHandler('Bank Details are Required', 400))
        }
        withdrawalData.accountHolderName = accountHolderName;
        withdrawalData.bankName = bankName;
    }

    // === Save to DB ===
    const userWithdraw = await Withdraw.create(withdrawalData);

    await storeActivity(user.AccountMumber, `Withdraw ${amount} from Your Account`, amount, 'Panding', userWithdraw._id, req.user._id);


    res.status(200).json({
        success: true,
        message: 'Withdraw request submitted successfully. Please wait for verification.',
    });
});


export const Activity = asyncHandler(async (req, res, next) => {
    const { _id } = req.user

    if (!_id) return next(new ErrorHandler('Invalid Id', 400))

    try {
        const activitys = await ActivityType.find({ user: _id })
        res.json(activitys)
    } catch (error) {
        return next(new ErrorHandler('Invalid Id', 400))
    }

})


export const forgot = asyncHandler(async (req, res, next) => {

    const { email } = req.body

    if (!email) return next(new ErrorHandler('Enter Your Email', 400))

    const findUser = await User.findOne({ email })

    if (!findUser) return res.json({ success: true, message: "Otp Sent Successfully" })

    const result = await sendOtp(email)

    res.json(result)

})


export const verifyOtp = asyncHandler(async (req, res, next) => {

    const { email, otp, newPassword } = req.body

    if (!email) return next(new ErrorHandler('Please Fill Email'))
    if (!otp) return next(new ErrorHandler('Otp Is Required'))
    if (!newPassword) return next(new ErrorHandler('New Password is Required'))
    const result = await verifyOTP(email, otp, newPassword)


    res.json(result)

})


export const isLoginUser = asyncHandler(async (req, res, next) => {
    res.json({ success: true, message: "User Login" })
})



export const logout = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
        sameSite: 'lax',
    });

    return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};