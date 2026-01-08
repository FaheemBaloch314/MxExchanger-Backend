import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    senderAccount: {
        type: String,
        required: true,
    },
    receiverAccount: {
        type: String,
        required: true,
    },
    senderName: {
        type: String,
        required: true,
    },
    receiverName: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        enum: ["USD", "PKR"],
        required: true,
    },
    description: {
        type: String,
        default: ""
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

export const Transaction = mongoose.model("Transaction", transactionSchema);
