import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    shippingInfo: {
        address: {
            type: String,
            required: [true, "Please Enter Address"]
        },

        city: {
            type: String,
            required: [true, "Please Enter City"]
        },
        state: {
            type: String,
            required: [true, "Please Enter State"]
        },
        country: {
            type: String,
            required: [true, "Please Enter Country"]
        },
        postalCode: {
            type: Number,
            required: [true, "Please Enter Postal Code"]
        },
    },
    user: {
        type: String,
        ref: "User",
        required: [true, "Please Enter User ID"]
    },
    subtotal: {
        type: Number,
        required: [true, "Please Enter Sub-Total"]
    },
    tax: {
        type: Number,
    },
    total: {
        type: Number,
        required: [true, "Please Enter Total"]
    },
    shippingCharges: {
        type: Number,
        required: [true, "Please Enter Shipping Charges"],
        default: 0
    },
    discount: {
        type: Number,
        required: [true, "Please Enter Discount"],
        default: 0
    },
    status: {
        type: String,
        required: ["Processing", "Shipped", "Delivered"],
        default: "Processing"
    },
    orderItems: [
        {
            title: String,
            image: String,
            price: Number,
            quantity: Number,
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            }
        }
    ]

}, {
    timestamps: true
})



export const Order = mongoose.model('Order', orderSchema);

