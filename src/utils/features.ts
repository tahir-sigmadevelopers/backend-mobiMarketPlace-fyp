import mongoose, { Document } from 'mongoose'
import { invalidatesCacheProps, OrderItemType } from '../types/types.js';
import { myCache } from '../app.js';
import { Product } from '../models/product.js';

export const connectDB = async () => {
    try {
        let conn = await mongoose.connect(process.env.MONGO_URL || "mongodb+srv://tahir:_isHacked@cluster0.z2sch.mongodb.net", {
            dbName: "Final_Year_ECommerce"
        })

        console.log(`Connected to ${conn.connection.host}`);

    } catch (error) {
        console.log(`Error connecting to DB`, error);
    }
}

export const invalidatesCache = ({ product, order, admin, userId, orderId, productId }: invalidatesCacheProps) => {
    if (product) {
        const productKeys: string[] = ["latest-products", "categories", "all-products", `product-${productId}`]

        if (typeof productId === "string") productKeys.push(`product-${productId}`)
        if (typeof productId === "object") productId.forEach((i) => productKeys.push(`product-${i


            }`))
        myCache.del(productKeys)
    }
    if (order) {
        const orderKeys: string[] = ["all-orders", `userOrders_${userId}`, `order - ${orderId}`]

        myCache.del(orderKeys)

    }
    if (admin) {
        myCache.del(["admin-stats", "admin-pie-charts", "admin-bar-charts", "admin-line-charts"])
    }

}


export const reduceStock = async (orderItems: OrderItemType[]) => {
    for (let index = 0; index < orderItems.length; index++) {
        const order = orderItems[index];
        const product = await Product.findById(order.productId)
        if (!product) {
            throw new Error(`Product not found with id ${order.productId} `)
        }

        product.stock -= order.quantity
        await product.save()
    }
}



export const percentageCalculate = (thisMonth: number, lastMonth: number) => {
    if (lastMonth === 0) return thisMonth * 100;
    return ((thisMonth / lastMonth) * 100).toFixed(0);
}


export const getCategories = async ({ categories, productCount }: { categories: string[], productCount: number }) => {
    const categoriesCountPromise = categories.map((category) => Product.countDocuments({ category }))

    const categoriesCount = await Promise.all(categoriesCountPromise)

    const categoryCount: Record<string, number>[] = []

    categories.forEach((category, index) => {
        categoryCount.push({
            [category]: Math.round(categoriesCount[index] / productCount * 100)
        })
    })

    return categoryCount
}


interface MyDocument extends Document {
    createdAt: Date;
    discount?: number;
    total?: number;
}

type FuncProps = {
    length: number;
    docArr?: MyDocument[];
    today: Date;
    property?: "discount" | "total";
};


export const getChartsData = ({
    length,
    docArr,
    today,
    property,
}: FuncProps) => {
    const data: number[] = new Array(length).fill(0);

    docArr?.forEach((i) => {
        const creationDate = i.createdAt;
        const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

        if (monthDiff < length) {
            if (property) {
                data[length - monthDiff - 1] += i[property]!;
            } else {
                data[length - monthDiff - 1] += 1;
            }
        }
    });

    return data;
};