import express, { Request, Response, NextFunction } from 'express';
import { adminOnly } from '../middlewares/auth.js';
import { addUserReview, deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getLatestProducts, getProductDetail, newProduct, updateProduct, updateProductDetails, createProductWithDetails } from '../controllers/product.js';
import { singleUpload } from '../middlewares/multer.js';

const app = express.Router();

// Debug middleware
const debugFormData = (req: Request, res: Response, next: NextFunction) => {
  console.log("Request body BEFORE multer:", req.body);
  next();
};

const afterMulter = (req: Request, res: Response, next: NextFunction) => {
  console.log("Request body AFTER multer:", req.body);
  next();
};

// Route /product/review
app.put('/review', addUserReview)

// Route /product/new
app.post('/new', adminOnly, debugFormData, singleUpload, afterMulter, newProduct)

// Route /product/admin-products
app.get('/admin-products', adminOnly, getAdminProducts);

// Route /product/latest
app.get('/latest', getLatestProducts);

// Route /product/categories
app.get('/categories', getAllCategories);

// Route /product/all with filters
app.get('/all', getAllProducts);

// Route for creating product with details
app.post('/create-with-details', adminOnly, (req, res, next) => {
  console.log("Create with details route - Request body:", req.body);
  next();
}, createProductWithDetails);

// Route for updating product details only (no file upload)
app.patch('/:id/details', adminOnly, (req, res, next) => {
  console.log("Details update route - Request body:", req.body);
  next();
}, updateProductDetails);

// DYNAMIC ROUTES AFTER SPECIFIC ROUTES
app.route('/:id')
   .get(getProductDetail)
   .put(adminOnly, debugFormData, singleUpload, afterMulter, updateProduct)
   .delete(adminOnly, deleteProduct);

export default app