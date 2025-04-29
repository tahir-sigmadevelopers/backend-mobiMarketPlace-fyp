import mongoose from "mongoose";


const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, "Please Enter Coupon Code"],
        unique: true
    },
    amount: {
        type: Number,
        required: [true, "Please Enter Amount"]
    },


}, {
    timestamps: true
})


export const Coupon = mongoose.model('Coupon', couponSchema);

