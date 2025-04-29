

// -------------------------- Routes ------------------------------


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

config({
    path: './config.env'
});

connectDB();

const port = process.env.PORT || 5000;
const stripeSecret = process.env.STRIPE_SECRET || "";

export const stripe = new Stripe(stripeSecret);
export const myCache = new NodeCache();


const app = express();



app.use(express.json());
app.use(morgan("dev"));
app.use(cors());


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

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
