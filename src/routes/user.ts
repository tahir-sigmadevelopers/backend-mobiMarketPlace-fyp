import express from 'express';
import { deleteUser, getAllUsers, getUserDetail, newUser } from '../controllers/user.js';
import { adminOnly } from '../middlewares/auth.js';

const app = express.Router();

// Route /user/new
app.post('/new', newUser)

// Route /user/all
app.get('/all', adminOnly, getAllUsers);

// // Route /user/dynamicURL
// app.get('/:id', getUserDetail);

// // Route /user/dynamicURL
// app.delete('/:id', deleteUser);

app.route('/:id').get(getUserDetail).delete(adminOnly, deleteUser);


export default app