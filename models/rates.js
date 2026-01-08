import mongoose from "mongoose";


const ratesSchema = new mongoose.Schema({

    selling: {
        type: Number,
        required: true
    },
    buying: {
        type: Number,
        required: true
    }
})

export const Rates = new mongoose.model('rates', ratesSchema)