// Create Token and saving in cookie

const sendToken = (user, statusCode, res) => {
    const token = user.getJWTToken();

    const options = {
        expires: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // for HTTPS in production
        sameSite: "strict",
    };

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user,
        token,
    });
};

export default sendToken;