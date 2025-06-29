import mongoose from "mongoose";

const withdrawSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    gateway: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    account: {
        type: String,
        required: true
    },
    UsdAmount: {
        type: Number,
        default: 0
    },
    PkrAmount: {
        type: Number,
        default: 0
    },
    accountHolderName: {
        type: String,
    },
    bankName: {
        type: String,
    },
    AccountMumber: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'panding'
    },
    date: {
        type: Date,
        default: Date.now
    }

})

export const Withdraw = new mongoose.model('withdraw', withdrawSchema)