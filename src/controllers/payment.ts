import { NextFunction, Request, Response } from "express";
import { stripe } from "../app.js";


export const createPaymentIntent = async (
    req: Request,
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
