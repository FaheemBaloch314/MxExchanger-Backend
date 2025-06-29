
import nodemailer from 'nodemailer'
import { User } from '../models/user.js';
import bcrypt from 'bcryptjs';
import sendToken from './sendToken.js';
const otpStore = {}; // In-memory store: email => { otp, expiry }

export function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

    return otp;

}

export const sendOtp = async (email) => {
    try {
        const otp = generateOTP(); // e.g., returns a 6-digit number
        const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity

        const user = await User.findOne({ email });
        if (!user) {
            return { success: false, error: "Invalid Email Addrease." };
        }

        // Rate limiting logic (max 8 requests per 24 hours)
        const now = Date.now();
        const resetWindow = 24 * 60 * 60 * 1000;

        if (user.otpRequestTimestamp && now - new Date(user.otpRequestTimestamp).getTime() < resetWindow) {
            if (user.otpRequestCount >= 8) {
                return {
                    success: false,
                    error: "OTP request limit exceeded. Try again after 24 hours."
                };
            } else {
                user.otpRequestCount += 1;
            }
        } else {
            // Reset counter and timestamp
            user.otpRequestCount = 1;
            user.otpRequestTimestamp = new Date();
        }

        // Save OTP in user document
        user.otp = JSON.stringify({ code: otp, expiry });
        await user.save();

        // Email transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const mailOptions = {
            from: `"MxExchanger" <${process.env.SMTP_MAIL}>`,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return { success: true, message: "OTP sent successfully" };

    } catch (error) {
        console.error("sendOtp error:", error);
        return {
            success: false,
            error: "Failed to send OTP. Please try again later."
        };
    }
};


export const verifyOTP = async (email, enteredOtp, newPassword) => {
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.otp) {
        return { success: false, error: "Invalid OTP " };
    }

    let record;
    try {
        record = JSON.parse(user.otp);
    } catch (err) {
        return { success: false, error: "Invalid OTP format." };
    }

    const now = Date.now();
    const attemptWindow = 24 * 60 * 60 * 1000; // 24 hours

    // Limit OTP verification attempts
    if (user.otpAttemptTimestamp && now - user.otpAttemptTimestamp.getTime() < attemptWindow) {
        if (user.otpAttempts >= 8) {
            user.otp = undefined;
            await user.save();
            return { success: false, error: "Too many wrong attempts. OTP expired." };
        }
    } else {
        // Reset attempts if 24 hours passed
        user.otpAttempts = 0;
        user.otpAttemptTimestamp = new Date();
    }

    // Check expiry
    if (Date.now() > record.expiry) {
        user.otp = undefined;
        await user.save();
        return { success: false, error: "OTP expired." };
    }

    // Check OTP match
    let records
    try {
        records = JSON.parse(user.otp); // Parse JSON string
    } catch (err) {
        return { success: false, error: "Invalid OTP format." };
    }

    if (records.code !== enteredOtp) {
        user.otpAttempts += 1;
        user.otpAttemptTimestamp = new Date();
        await user.save();
        return { success: false, error: "Incorrect OTP." };
    }

    // ✅ OTP is correct, hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Reset OTP fields
    user.otp = undefined;
    user.otpAttempts = 0;
    user.otpAttemptTimestamp = null;

    await user.save();

    return { success: true, message: "OTP verified and password updated successfully!" };
};


export const verifyNewUser = async (email, enteredOtp, res) => {
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.otp) {
        return res.json({ success: false, error: "Invalid OTP " });
    }

    let record;
    try {
        record = JSON.parse(user.otp);
    } catch (err) {
        return res.json({ success: false, error: "Invalid OTP format." });
    }

    const now = Date.now();
    const attemptWindow = 24 * 60 * 60 * 1000; // 24 hours

    // Limit OTP verification attempts
    if (user.otpAttemptTimestamp && now - user.otpAttemptTimestamp.getTime() < attemptWindow) {
        if (user.otpAttempts >= 8) {
            user.otp = undefined;
            await user.save();
            return res.json({ success: false, error: "Too many wrong attempts. OTP expired." });
        }
    } else {
        // Reset attempts if 24 hours passed
        user.otpAttempts = 0;
        user.otpAttemptTimestamp = new Date();
    }

    // Check expiry
    if (Date.now() > record.expiry) {
        user.otp = undefined;
        await user.save();
        return res.json({ success: false, error: "OTP expired." });
    }

    // Check OTP match
    let records
    try {
        records = JSON.parse(user.otp); // Parse JSON string
    } catch (err) {
        return res.json({ success: false, error: "Invalid OTP format." });
    }

    if (records.code !== enteredOtp) {
        user.otpAttempts += 1;
        user.otpAttemptTimestamp = new Date();
        await user.save();
        return res.json({ success: false, error: "Incorrect OTP." });
    }

    // ✅ OTP is correct, hash and update password

    // Reset OTP fields
    user.otp = undefined;
    user.otpAttempts = 0;
    user.otpAttemptTimestamp = null;
    user.isVarified = true

    await user.save();

    return res.json({ success: true, message: "OTP verified and password updated successfully!" });
    // sendToken(email,201,res)
};


export const sendNewUserOtp = async (email) => {
    const otp = generateOTP(); // e.g. "728391"
    const expiry = Date.now() + 5 * 60 * 1000; // 5 mins

    // Find or create a user record just for storing OTP
    let user = await User.findOne({ email });

    if (!user) {
        user = new User({
            email,
            otp: JSON.stringify({ code: otp, expiry }),
            otpRequestCount: 1,
            otpRequestTimestamp: new Date(),
        });
    } else {
        // Rate limiting: 8 OTPs max in 24 hours
        const now = Date.now();
        const resetWindow = 24 * 60 * 60 * 1000;

        if (user.otpRequestTimestamp && now - user.otpRequestTimestamp.getTime() < resetWindow) {
            if (user.otpRequestCount >= 8) {
                return {
                    success: false,
                    error: "OTP request limit exceeded. Try again after 24 hours.",
                };
            } else {
                user.otpRequestCount += 1;
            }
        } else {
            // Reset if 24h passed
            user.otpRequestCount = 1;
            user.otpRequestTimestamp = new Date();
        }

        user.otp = JSON.stringify({ code: otp, expiry });
    }

    await user.save();

    // Send Email
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"MxExchanger" <${process.env.SMTP_MAIL}>`,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: "OTP sent successfully." };
};
