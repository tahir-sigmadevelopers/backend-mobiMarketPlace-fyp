import express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import { newCoupon, applyDiscount, allCoupons, deleteCoupon, createPaymentIntent } from '../controllers/payment.js';

const app = express.Router();


// Route /payment/create
app.post('/create', createPaymentIntent)

// Route /payment/discount
app.get('/discount', applyDiscount)


// Route /payment/coupon/new
app.post('/coupon/new', adminOnly, newCoupon)


// Route /payment/coupon/all
app.get('/coupon/all', adminOnly, allCoupons)

// Route /payment/coupon/:id
app.delete('/coupon/:id', adminOnly, deleteCoupon)


// app.route('/:id').get(getUserDetail).delete(adminOnly, deleteUser);


export default app