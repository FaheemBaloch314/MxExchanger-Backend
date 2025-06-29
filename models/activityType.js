import mongoose from "mongoose";

const activityTypeSchema = new mongoose.Schema({
    AccountNumber: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    ActivityType: {
        type: String,
        required: true,
    },
    Amount: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
});

export const ActivityType = mongoose.model('activityType', activityTypeSchema);
