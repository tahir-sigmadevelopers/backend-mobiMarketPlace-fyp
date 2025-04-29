
import express from 'express';
import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, processOrder } from '../controllers/order.js';
import { adminOnly } from '../middlewares/auth.js';

const app = express.Router();

// Route /order/new
app.post('/new', newOrder)

// Route /order/my
app.get('/my', myOrders)


// Route /order/all
app.get('/all', adminOnly, allOrders)


// Route /order/:id
app.route('/:id').get(getSingleOrder).put(adminOnly, processOrder).delete(adminOnly, deleteOrder)





export default app