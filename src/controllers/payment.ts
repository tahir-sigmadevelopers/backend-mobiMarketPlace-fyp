import { NextFunction, Request, Response } from "express";
import { NewCouponBody } from "../types/types.js";
import { Coupon } from "../models/coupon.js";
import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";


export const createPaymentIntent = async (
    req: Request<{}, {}, NewCouponBody>,
    res: Response,
    next: NextFunction
) => {
    try {

        const { amount } = req.body;


        if (!amount) {
            return res.status(400).json({
                success: false,
                message: "Please Enter Amount"
            })
        }


        // Create a Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Number(amount) * 100, // Amount in smallest currency unit
            currency: "USD",
            // confirm: true, // Automatically confirm the payment

        });

        return res.status(200).json({
            success: true,
            message: "Payment Intent Created Successfully",
            client_secret: paymentIntent.client_secret,
        })


    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Failed to Make Payment.",
            error: error.message
        })
    }
}


export const newCoupon = async (
    req: Request<{}, {}, NewCouponBody>,
    res: Response,
    next: NextFunction
) => {
    try {

        const { coupon, amount } = req.body;


        if (!coupon || !amount) {
            return res.status(400).json({
                success: false,
                message: "Please Enter Both Coupon and Amount"
            })
        }

        await Coupon.create({
            code: coupon, amount
        })

        // await invalidatesCache({})

        return res.status(201).json({
            success: true,
            message: `Coupon ${coupon} Generated Successfully `,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Failed to Generate Coupon Code.",
            error: error.message
        })
    }
}

export const applyDiscount = async (
    req: Request<{}, {}, NewCouponBody>,
    res: Response,
    next: NextFunction
) => {
    try {

        const { coupon } = req.query;

        const discount = await Coupon.findOne({ code: coupon })

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Invalid Coupon Code"
            })
        }
        return res.status(200).json({
            success: true,
            message: `Coupon ${coupon} Applied `,
            discount: discount.amount
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Failed to Apply Discount",
            error: error.message
        })
    }
}


export const allCoupons = async (
    req: Request<{}, {}, NewCouponBody>,
    res: Response,
    next: NextFunction
) => {
    try {

        const coupons = await Coupon.find()

        return res.status(200).json({
            success: true,
            coupons
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Failed to Get Coupons",
            error: error.message
        })
    }
}

export const deleteCoupon = TryCatch(async (req, res, next) => {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));

    return res.status(200).json({
        success: true,
        message: `Coupon ${coupon.code} Deleted Successfully`,
    });
});
