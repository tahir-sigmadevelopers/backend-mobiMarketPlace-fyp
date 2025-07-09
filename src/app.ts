import userRoute from './routes/user.js';
import productRoute from './routes/product.js';
import orderRoute from './routes/order.js';
import paymentRoute from './routes/payments.js';
import dashboardRoute from './routes/stats.js';

import express from 'express';
import { connectDB } from './utils/features.js';
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from 'node-cache';
import { config } from 'dotenv';
import morgan from 'morgan';
import Stripe from 'stripe';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';

config({
    path: './config.env'
});

connectDB();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.cloud_name || '',
  api_key: process.env.CLOUDINARY_API_KEY || process.env.api_key || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.api_secret || '',
});


const port = process.env.PORT || 5000;
const stripeSecret = process.env.STRIPE_SECRET || "";

export const stripe = new Stripe(stripeSecret);
export const myCache = new NodeCache();


const app = express();



app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan("dev"));
app.use(cors({
    origin: ["https://mobimarketplace.vercel.app","http://localhost:5173","https://tahir-mobi-market-place-fyp.vercel.app"],
}));


app.get("/", (req, res) => {
    res.send(`Backend is Running`);
});

// Register routes
app.use("/user", userRoute);
app.use("/product", productRoute);
app.use("/order", orderRoute);
app.use("/payment", paymentRoute);
app.use("/dashboard", dashboardRoute);


app.use("/uploads", express.static("uploads"));

// Add error middleware at the end, without a path
app.use(errorMiddleware);

// Clear specific caches on server start to ensure fresh data
myCache.del(["latest-products"]);
console.log("Cleared latest-products cache on server start");

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
