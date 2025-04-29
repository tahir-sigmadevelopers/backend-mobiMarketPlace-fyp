import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

    title: {
        type: String,
        required: [true, "Please Enter Name"]
    },

    image: {
        type: String,
        required: [true, "Please Add Image"]
    },
    price: {
        type: Number,
        required: [true, "Please Add Price"]
    },
    stock: {
        type: Number,
        required: [true, "Please Add Stock"]
    },
    ratings: {
        type: Number,
        default: 0,
    },
    numOfReviews: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            user: {
                type: String,
                ref: "User",
            },
            name: {
                type: String,
                // required: [true, "Please Enter Product Name"],
            },
            comment: {
                type: String,
                required: [true, "Please Enter Comment"],
            },
            rating: {
                type: Number,
                required: [true, "Please Enter Rating"],
            },
        },
    ],

    category: {
        type: String,
        required: [true, "Please Add Category"],
        trim: true
    },

}, {
    timestamps: true
})



export const Product = mongoose.model('Product', productSchema);

