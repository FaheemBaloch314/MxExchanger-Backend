import mongoose from "mongoose";

const depositSchema = ({

    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },

    paymentMethod: {
        type: String,
        required: true,
    },
    currancy: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        default: "panding"
    },
    data: {
        type: Date,
        default: Date.now()
    },
    activitytype: {
        type: String,
        default: "deposit"
    },
    transitionId: {
        type: String,
        required: true
    },
    AccountMumber: {
        type: String,
        required: true
    }

})


export const Deposit = new mongoose.model('deposit', depositSchema)