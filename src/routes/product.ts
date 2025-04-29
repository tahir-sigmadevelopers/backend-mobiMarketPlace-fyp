
import express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import { addUserReview, deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getLatestProducts, getProductDetail, newProduct, updateProduct } from '../controllers/product.js';
import { singleUpload } from '../middlewares/multer.js';

const app = express.Router();

// Route /product/review
app.put('/review', addUserReview)

// Route /product/new
app.post('/new', adminOnly, singleUpload, newProduct)


// Route /product/admin-products
app.get('/admin-products', adminOnly, getAdminProducts);

// Route /product/latest
app.get('/latest', getLatestProducts);

// Route /product/categories
app.get('/categories', getAllCategories);


// Route /product/all with filters
app.get('/all', getAllProducts);
// // Route /product/dynamicURL
// app.get('/:id', getProductDetail);

// // Route /product/dynamicURL
// app.delete('/:id', deleteProduct);

app.route('/:id').get(getProductDetail).put(adminOnly, singleUpload, updateProduct).delete(adminOnly, deleteProduct);



export default app