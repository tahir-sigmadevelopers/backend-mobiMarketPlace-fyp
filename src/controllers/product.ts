import { NextFunction, Request, Response } from "express";
import { baseQuery, NewProductRequestBody, NewUserRequestBody, searchRequestQuery } from "../types/types.js";
import { Product } from "../models/product.js";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const newProduct = TryCatch(async (req, res, next) => {
    const { title, price, stock, category, description } = req.body;
    let image = req.file;

   

    if (!title || !price || !image || !stock || !category) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    // console.log("File received:", image);
    
    try {
        // Upload image to Cloudinary
        const cloudinaryResult = await uploadOnCloudinary(image.path);
        // console.log("Cloudinary result:", cloudinaryResult);

        // Prepare description with fallback
        const productDescription = description || "";
        // console.log("Product description to save:", productDescription);

        // Create product with image data
        const product = await Product.create({
            title,
            price,
            stock,
            category: category.toLowerCase(),
            description: productDescription,
            images: [{
                public_id: cloudinaryResult.public_id,
                url: cloudinaryResult.url
            }]
        });

        // console.log("Product created successfully:", product);
        console.log("Saved description:", product.description);
        
        invalidatesCache({ product: true, admin: true });

        return res.status(201).json({
            success: true,
            message: `Product Added Successfully`,
        });
    } catch (error: unknown) {
        console.error("Error in product creation:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return next(new ErrorHandler(`Error creating product: ${errorMessage}`, 500));
    }
});

const addUserReview = TryCatch(async (req, res, next) => {
    const { rating, comment, id, user } = req.body;

    if (!rating || !comment || !id || !user) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }

    console.log("Adding review:", { rating, comment, productId: id, userId: user });

    const review = {
        user,
        rating: Number(rating),
        comment,
    };

    const product = await Product.findById(id).populate("reviews.user");

    if (!product) {
        return next(new ErrorHandler("Product does not exist", 404));
    }

    // Check if user has already reviewed this product
    const isReviewed = product.reviews.find((rev) => {
        if (rev.user && typeof rev.user === 'object' && '_id' in rev.user) {
            const userObj = rev.user as { _id: string };
            return userObj._id.toString() === user.toString();
        }
        return false;
    });

    // Update existing review or add new one
    if (isReviewed) {
        product.reviews.forEach((rev) => {
            if (rev.user && typeof rev.user === 'object' && '_id' in rev.user) {
                const userObj = rev.user as { _id: string };
                if (userObj._id.toString() === user.toString()) {
                    rev.rating = Number(rating);
                    rev.comment = comment;
                }
            }
        });
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    // Calculate average rating
    let avg = 0;
    product.reviews.forEach((rev) => {
        avg += rev.rating;
    });
    product.ratings = avg / product.reviews.length;

    // Save product and invalidate cache
    await product.save({ validateBeforeSave: false });
    invalidatesCache({ product: true, productId: String(product._id) });

    return res.status(200).json({
        success: true,
        message: "Review added successfully"
    });
});

// Revalidate on New, Update, Delete & on New Order
const getLatestProducts = async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
) => {
    try {

        let products

        // Always fetch fresh products to ensure we get 12 products
        products = await Product.find().sort({ createdAt: -1 }).limit(12)
        
        // Update the cache with the latest 12 products
        myCache.set("latest-products", JSON.stringify(products));

        return res.status(200).json({
            success: true,
            message: `All Products`,
            products
        });
    } catch (error: unknown) {
        console.log(error);
        const processedError = error instanceof Error ? error : new Error("Unknown error occurred");
        return next(processedError);
    }
}


const getAdminProducts = async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
) => {
    try {
        let products;

        if (myCache.has("all-products")) {
            // get all products from cache
            products = JSON.parse(myCache.get("all-products")!)
        } else {
            // get all products from server
            products = await Product.find()
            myCache.set("all-products", JSON.stringify(products));
        }

        return res.status(200).json({
            success: true,
            message: `All Products`,
            products
        });
    } catch (error: unknown) {
        const processedError = error instanceof Error ? error : new Error("Unknown error occurred");
        return next(processedError);
    }
}


const getProductDetail = async (
    req: Request<{ id: string }, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = req.params.id;
        let product;
        
        if (myCache.has(`product-${id}`)) {
            // Get product from cache
            product = JSON.parse(myCache.get(`product-${id}`)!);
            
            // Check if it's the right product and has populated reviews
            if (product._id == id) {
                // If the product has reviews but they might not be populated properly,
                // we'll check and re-populate if needed
                if (product.reviews && product.reviews.length > 0 && 
                    (!product.reviews[0].user || typeof product.reviews[0].user === 'string')) {
                    console.log("Re-populating reviews for cached product");
                    // Reviews need to be re-populated
                    product = await Product.findById(id).populate({
                        path: "reviews.user",
                        select: "name email image"
                    });
                    
                    // Update cache with populated reviews
                    myCache.set(`product-${id}`, JSON.stringify(product));
                }
                
                return res.status(200).json({
                    success: true,
                    message: `Product Detail`,
                    product
                });
            }
        }
        
        // Get product from database with fully populated reviews
        product = await Product.findById(id).populate({
            path: "reviews.user",
            select: "name email image"
        });

        if (!product) {
            return res.status(404).json({ 
                success: false,
                message: "Product not found" 
            });
        }

        // Update cache
        myCache.set(`product-${id}`, JSON.stringify(product));

        return res.status(200).json({
            success: true,
            message: `Product Detail`,
            product
        });
    } catch (error: unknown) {
        console.error("Error fetching product details:", error);
        const processedError = error instanceof Error ? error : new Error("Unknown error occurred");
        return next(processedError);
    }
}


// update product details
// validate inputs
// remove existing image if image upload
// save product
// return updated product details

const updateProduct = TryCatch(async (req, res, next) => {
    const { title, price, stock, category, description } = req.body;
    const id = req.params.id;
    
    console.log("Update product request for ID:", id);
    console.log("Complete request body:", req.body);
    console.log("Description received in update:", description);
    console.log("Description type:", typeof description);
    
    if (req.file) {
        console.log("File received for update:", req.file);
    }
    
    let product = await Product.findById(id);

    if (!product) {
        return res.status(404).json({ message: "Product not found", success: false });
    }

    console.log("Original product description:", product.description);

    if (req.file) {
        try {
            // Delete old image from Cloudinary if it exists
            if (product.images && product.images.length > 0) {
                const oldImage = product.images[0];
                if (oldImage.public_id) {
                    console.log("Deleting old image:", oldImage.public_id);
                    const { deleteFromCloudinary } = await import("../utils/cloudinary.js");
                    await deleteFromCloudinary(oldImage.public_id);
                }
            }

            // Upload new image to Cloudinary
            console.log("Uploading new image to Cloudinary");
            const cloudinaryResult = await uploadOnCloudinary(req.file.path);
            console.log("Cloudinary result:", cloudinaryResult);
            
            // Set the images field using mongoose set()
            product.set({
                images: [{
                    public_id: cloudinaryResult.public_id,
                    url: cloudinaryResult.url
                }]
            });
        } catch (error: unknown) {
            console.error("Error handling image update:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return next(new ErrorHandler(`Error updating product image: ${errorMessage}`, 500));
        }
    }

    if (title) {
        product.title = title;
    }
    if (price) {
        product.price = price;
    }
    if (stock) {
        product.stock = stock;
    }
    if (category) {
        product.category = category.toLowerCase();
    }

    // Always update description, even if it's empty
    console.log("Setting new description:", description);
    product.description = description !== undefined ? description : "";

    console.log("Updated product before saving:", JSON.stringify(product));
    await product.save();
    
    // Verify description was saved by fetching the product again
    const updatedProduct = await Product.findById(id);
    console.log("Product after save. Final description:", updatedProduct?.description);
    
    invalidatesCache({ product: true, productId: String(product._id), admin: true });

    return res.status(200).json({
        success: true,
        message: `Product updated successfully`,
    });
});


// New controller specifically for updating product details (no file handling)
const updateProductDetails = TryCatch(async (req, res, next) => {
    const { title, price, stock, category, description } = req.body;
    const id = req.params.id;
    
    console.log("Update product details for ID:", id);
    console.log("Request body for details update:", req.body);
    console.log("Description received in details update:", description);
    console.log("Description type:", typeof description);
    
    let product = await Product.findById(id);

    if (!product) {
        return res.status(404).json({ 
            message: "Product not found", 
            success: false 
        });
    }

    console.log("Original product description:", product.description);

    // Update fields if provided
    if (title) product.title = title;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (category) product.category = category.toLowerCase();
    
    // Always update description
    product.description = description !== undefined ? description : "";
    console.log("Setting description to:", product.description);

    await product.save();
    
    // Verify description was saved
    const updatedProduct = await Product.findById(id);
    console.log("Product after save. Description:", updatedProduct?.description);
    
    invalidatesCache({ product: true, productId: String(product._id), admin: true });

    return res.status(200).json({
        success: true,
        message: `Product details updated successfully`,
    });
});



// delete product API, also delete image of product

const deleteProduct = TryCatch(async (req, res, next) => {
    const id = req.params.id;
    let product = await Product.findById(id);

    if (!product) {
        return res.status(404).json({ message: "Product not found", success: false });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
        const { deleteFromCloudinary } = await import("../utils/cloudinary.js");
        for (const image of product.images) {
            if (image.public_id) {
                await deleteFromCloudinary(image.public_id);
            }
        }
    }

    await product.deleteOne();
    invalidatesCache({ product: true, productId: String(product._id), admin: true });

    return res.status(200).json({
        success: true,
        message: `Product Deleted Successfully`
    });
});


// Revalidate on New, Update, Delete & on New Order
// get all categories products by distinct category
const getAllCategories = async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
) => {
    try {

        let categories;

        if (myCache.has("categories")) {
            categories = JSON.parse(myCache.get("categories")!);
        } else {
            categories = await Product.distinct('category')
            myCache.set('categories', JSON.stringify(categories));
        }


        return res.status(200).json({
            success: true,
            message: `All Categories`,
            categories
        });
    } catch (error: unknown) {
        const processedError = error instanceof Error ? error : new Error("Unknown error occurred");
        return next(processedError);
    }
}



const getAllProducts = async (
    req: Request<{}, {}, {}, searchRequestQuery>,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log("Search request received with URL:", req.originalUrl);
        console.log("Query parameters:", req.query);

        // Clear cache for fresh results
        invalidatesCache({ product: true });

        const { category, price, search } = req.query;
        
        const page = Number(req.query.page) || 1;
        const limit = Number(process.env.Product_Per_Page) || 9;
        const skip = limit * (page - 1);

        const baseQuery: baseQuery = {};

        if (search) baseQuery.title = {
            $regex: search,
            $options: "i",
        };

        if (price) baseQuery.price = {
            $lte: Number(price)
        };

        if (category) baseQuery.category = category;

        // Get products without sorting 
        const products = await Product.find(baseQuery)
            .limit(limit)
            .skip(skip)
            .lean();
        
        // Get total count for pagination
        const totalCount = await Product.countDocuments(baseQuery);
        const totalPages = Math.ceil(totalCount / limit);

        // Set cache headers to prevent caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.status(200).json({
            success: true,
            message: `All Products`,
            products: products,
            totalPages
        });
    } catch (error: unknown) {
        const processedError = error instanceof Error ? error : new Error("Unknown error occurred");
        return next(processedError);
    }
}

// New controller for creating product with details
const createProductWithDetails = TryCatch(async (req, res, next) => {
    const { title, price, stock, category, description, imageUrl, imagePublicId } = req.body;
    
    console.log("Create product with details - Request body:", req.body);
    console.log("Description received:", description);
    console.log("Description type:", typeof description);

    if (!title || !price || !stock || !category || !imageUrl || !imagePublicId) {
        return res.status(400).json({
            success: false,
            message: "All required fields must be provided"
        });
    }
    
    try {
        // Create product with image data
        const product = await Product.create({
            title,
            price,
            stock,
            category: category.toLowerCase(),
            description: description || "",
            images: [{
                public_id: imagePublicId,
                url: imageUrl
            }]
        });

        console.log("Product created successfully with details:", product);
        console.log("Saved description:", product.description);
        
        invalidatesCache({ product: true, admin: true });

        return res.status(201).json({
            success: true,
            message: `Product Added Successfully`,
        });
    } catch (error: unknown) {
        console.error("Error in product creation:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return next(new ErrorHandler(`Error creating product: ${errorMessage}`, 500));
    }
});

export { 
    newProduct, 
    getLatestProducts, 
    getAllProducts, 
    getProductDetail, 
    updateProduct,
    updateProductDetails,
    deleteProduct, 
    getAllCategories, 
    getAdminProducts,
    addUserReview,
    createProductWithDetails
}