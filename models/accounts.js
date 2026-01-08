import mongoose from "mongoose";

const accountsSchema = new mongoose.Schema({


    easypasa: {
        type: String,
        required: true,
    },
    easypasaHolderName: {
        type: String,
        required: true,
    },

    jazzcash: {
        type: String,
        required: true,
    },
    jazzcashHolderName: {
        type: String,
        required: true,
    },

    bank: {
        type: String,
        required: true,
    },
    bankHolderName: {
        type: String,
        required: true,
    },

    perfactMoney: {
        type: String,
        required: true,
    },

    USDT: {
        type: String,
        required: true,
    },

    TRX: {
        type: String,
        required: true,
    },
    payneer: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now()
    },
})

export const Accounts = new mongoose.model('account', accountsSchema)