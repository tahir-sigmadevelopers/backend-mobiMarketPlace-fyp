import express from 'express';
import { createPaymentIntent } from '../controllers/payment.js';

const app = express.Router();

// Route /payment/create
app.post('/create', createPaymentIntent)

export default app