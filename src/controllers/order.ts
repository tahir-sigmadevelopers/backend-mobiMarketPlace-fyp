import { NextFunction, Request, Response } from "express";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/order.js";
import { invalidatesCache, reduceStock } from "../utils/features.js";
import { myCache } from "../app.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";


export const newOrder = TryCatch(async (req, res, next) => {

    const { shippingInfo, orderItems, discount, shippingCharges, subtotal, total, user } = req.body;


    // if (!shippingInfo || !orderItems || !discount || !shippingCharges || !subtotal || !user || !total) {
    //     return res.status(400).json({
    //         success: false,
    //         message: "All fields are required"
    //     })
    // }

    const order = await Order.create({
        shippingInfo, orderItems, discount, shippingCharges, subtotal, total, user
    })

    await reduceStock(orderItems)


    invalidatesCache({ order: true, product: true, admin: true, userId: user, productId: order.orderItems.map(i => String(i.productId)) })

    return res.status(201).json({
        success: true,
        message: `Order Placed Successfully `,
    });
}
)


export const myOrders = TryCatch(async (req, res, next) => {


    // get user from req.query 
    const { id: userId } = req.query

    const key = `userOrders_${userId}`

    let orders = []

    if (myCache.has(key)) {
        orders = JSON.parse(myCache.get(key)!)
    } else {
        orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).populate('user', 'name');
        myCache.set(key, JSON.stringify(orders));
        orders = JSON.parse(myCache.get(key)!)
        // invalidate cache after 5 minutes
        setTimeout(() => {
            myCache.del(key);
        }, 300000);
    }

    return res.status(200).json({
        success: true,
        orders,
    });

}
)


export const allOrders = TryCatch(async (req, res, next) => {

    const key = `all-orders`

    let orders = []

    if (myCache.has(key)) {
        orders = JSON.parse(myCache.get(key)!)
    } else {
        orders = await Order.find({}).populate("user", "name")
        myCache.set(key, JSON.stringify(orders));
        orders = JSON.parse(myCache.get(key)!)
    }

    return res.status(200).json({
        success: true,
        orders,
    });
}
)

export const getSingleOrder = TryCatch(async (req, res, next) => {

    const { id } = req.params;

    const key = `order-${id}`

    let order;

    if (myCache.has(key)) {
        order = JSON.parse(myCache.get(key)!)
    } else {
        order = await Order.findById(id)
        console.log(`main hoon order ${order}`);

        if (!order) return next(new Error(`Order ${key} not found`))
        myCache.set(key, JSON.stringify(order));
        order = JSON.parse(myCache.get(key)!)
    }

    return res.status(200).json({
        success: true,
        order,
    });
})


export const processOrder = TryCatch(async (req, res, next) => {

    const { id } = req.params;

    let order = await Order.findById(id)

    if (!order) return next(new Error(`Order not found`))

    switch (order.status) {
        case "Processing":
            order.status = "Shipped"
            break;

        case "Shipped":
            order.status = "Delivered"
            break;

        default:
            order.status = "Delivered"
            break;
    }


    await order.save()

    invalidatesCache({ product: true, order: true, admin: true, userId: order.user, orderId: String(order._id) })


    return res.status(200).json({
        success: true,
        message: "Order Processed Successfully"
    });

})

export const deleteOrder = TryCatch(async (req, res, next) => {

    const { id } = req.params;

    let order = await Order.findById(id)

    if (!order) return next(new ErrorHandler(`Order not found`, 404))

    await order.deleteOne()

    invalidatesCache({ product: true, order: true, admin: true, userId: order.user, orderId: String(order._id) })


    return res.status(200).json({
        success: true,
        message: "Order Deleted Successfully"
    });

}
)


