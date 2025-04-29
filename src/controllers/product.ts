import { NextFunction, Request, Response } from "express";
import { baseQuery, NewProductRequestBody, NewUserRequestBody, searchRequestQuery } from "../types/types.js";
import { Product } from "../models/product.js";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const newProduct = TryCatch(async (req, res, next) => {
    const { title, price, stock, category } = req.body;
    let image = req.file;

    if (!title || !price || !image || !stock || !category) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    console.log("File received:", image);
    
    try {
        // Upload image to Cloudinary
        const cloudinaryResult = await uploadOnCloudinary(image.path);
        console.log("Cloudinary result:", cloudinaryResult);

        // Create product with image data
        const product = await Product.create({
            title,
            price,
            stock,
            category: category.toLowerCase(),
            images: [{
                public_id: cloudinaryResult.public_id,
                url: cloudinaryResult.url
            }]
        });

        console.log("Product created:", product);
        
        invalidatesCache({ product: true, admin: true });

        return res.status(201).json({
            success: true,
            message: `Product Added Successfully`,
        });
    } catch (error) {
        console.error("Error in product creation:", error);
        return next(new ErrorHandler(`Error creating product: ${error.message}`, 500));
    }
});

export const addUserReview = TryCatch(
    async (req, res, next) => {

        const { rating, comment, id, user } = req.body;

        console.log(req.body);

        const review = {
            user,
            name: user?._name,
            rating: Number(rating),
            comment,

        };

        const product = await Product.findById(id).populate("reviews.user");

        // console.log(`product hoon main`, product);


        if (!product) return next(new ErrorHandler(`Product Does Not Exists`, 400));


        // Adding Review Functionality
        const isReviewed = product.reviews.find((rev) => {
            // Check if rev.user is an object with an _id property
            if (rev.user && typeof rev.user === 'object' && '_id' in rev.user) {
                const userObj = rev.user as { _id: string }; // Assert the type safely
                return userObj._id === user; // Perform comparison
            }
            return false; // In case rev.user is not an object, return false
        });






        if (isReviewed) {
            product.reviews.forEach((rev) => {
                // Check if rev.user is an object with an _id property
                if (rev.user && typeof rev.user === 'object' && '_id' in rev.user) {
                    const userObj = rev.user as { _id: string }; // Now safe to assert the type

                    if (userObj._id.toString().trim() === user.toString().trim()) {
                        rev.rating = rating;
                        rev.comment = comment;
                    }
                }
            });
        } else {
            product.reviews.push(review);
            product.numOfReviews = product.reviews.length;
        }

        let avg = 0;

        product.reviews.forEach((rev) => {
            avg += rev.rating;
        });

        product.ratings = avg / product.reviews.length;

        await product.save({ validateBeforeSave: false });
        return res.status(200).json({
            success: true,
            message: "Review Added Successfully",
        });
    })


// Revalidate on New, Update, Delete & on New Order
export const getLatestProducts = async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
) => {
    try {

        let products

        if (myCache.has("latest-products")) {
            // get latest products from cache
            products = JSON.parse(myCache.get("latest-products")!)
        }
        else {
            // get latest products from server 
            products = await Product.find().sort({ createdAt: -1 }).limit(6)

            myCache.set("latest-products", JSON.stringify(products));
        }

        return res.status(200).json({
            success: true,
            message: `All Products`,
            products
        });
    } catch (error: any) {
        console.log(error);

        return next(error)
    }
}


export const getAdminProducts = async (
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
    } catch (error: any) {
        return next(error)
    }
}


export const getProductDetail = async (
    req: Request<{ id: string }, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
) => {
    try {

        let product;
        let id = req.params.id
        if (myCache.has(`product-${id}`)) {
            // get product from cache
            product = JSON.parse(myCache.get(`product-${id}`)!)
            if (product._id == id) {
                return res.status(200).json({
                    success: true,
                    message: `Product Detail`,
                    product
                });
            }
        }
        else {
            // get product from server

            product = await Product.findById(id).populate("reviews.user")

            if (!product) {
                return res.status(404).json({ message: "Product not found", success: false })
            }

            myCache.set(`product-${id}`, JSON.stringify(product));
        }

        return res.status(200).json({
            success: true,
            message: `User Detail ${product}`,
            product
        });
    } catch (error: any) {
        return next(error)
    }
}


// update product details
// validate inputs
// remove existing image if image upload
// save product
// return updated product details

export const updateProduct = TryCatch(async (req, res, next) => {
    const { title, price, stock, category } = req.body;
    const id = req.params.id;
    
    console.log("Update product request for ID:", id);
    console.log("Request body:", req.body);
    if (req.file) {
        console.log("File received for update:", req.file);
    }
    
    let product = await Product.findById(id);

    if (!product) {
        return res.status(404).json({ message: "Product not found", success: false });
    }

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
            
            // Update product images array
            product.images = [{
                public_id: cloudinaryResult.public_id,
                url: cloudinaryResult.url
            }];
        } catch (error) {
            console.error("Error handling image update:", error);
            return next(new ErrorHandler(`Error updating product image: ${error.message}`, 500));
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

    console.log("Saving updated product:", product);
    await product.save();
    
    invalidatesCache({ product: true, productId: String(product._id), admin: true });

    return res.status(200).json({
        success: true,
        message: `Product updated successfully`,
    });
});





// delete product API, also delete image of product

export const deleteProduct = TryCatch(async (req, res, next) => {
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
export const getAllCategories = async (
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
    } catch (error: any) {
        return next(error)
    }
}



export const getAllProducts = async (
    req: Request<{}, {}, {}, searchRequestQuery>,
    res: Response,
    next: NextFunction
) => {
    try {

        const { category, price, search, sort } = req.query

        const page = Number(req.query.page) || 1

        const limit = Number(process.env.Product_Per_Page) || 8

        const skip = limit * (page - 1)

        const baseQuery: baseQuery = {}

        if (search) baseQuery.title = {
            $regex: search,
            $options: "i",
        }

        if (price) baseQuery.price = {
            $lte: Number(price)
        }

        if (category) baseQuery.category = category

        const productsPromise = Product.find(baseQuery).sort(sort && { price: sort === "asc" ? 1 : -1 }).limit(limit).skip(skip)

        const [products, filteredOnlyProducts] = await Promise.all([
            productsPromise, Product.find(baseQuery)
        ])


        let totalPages = Math.ceil(filteredOnlyProducts.length / limit);

        return res.status(200).json({
            success: true,
            message: `All Products`,
            products,
            totalPages
        });
    } catch (error: any) {
        return next(error)
    }
}