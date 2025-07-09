import { NextFunction, Request, Response } from "express";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { Order } from "../models/order.js";
import { getCategories, getChartsData, percentageCalculate } from "../utils/features.js";

export const getDashboardStats = async (

    req: Request<{}, {}>,
    res: Response,
    next: NextFunction
) => {
    try {
        let stats = {}

        const key = "admin-stats";

        if (myCache.has(key)) {
            stats = JSON.parse(myCache.get(key)!);
        } else {

            const today = new Date()
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

            // Calculate this month and last month values 

            const thisMonth = {
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: today
            }

            const lastMonth = {
                start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                end: new Date(today.getFullYear(), today.getMonth(), 0)
            }


            // Get the Stats of this month and last month 
            const thisMonthProductsPromise = await Product.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end
                }
            })
            const lastMonthProductsPromise = await Product.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end
                }
            })


            const thisMonthUserPromise = await User.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end
                }
            })
            const lastMonthUserPromise = await User.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end
                }
            })
            const thisMonthOrderPromise = await Order.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end
                }
            })
            const lastMonthOrderPromise = await Order.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end
                }
            })
            const lastSixMonthOrderPromise = await Order.find({
                createdAt: {
                    $gte: sixMonthsAgo,
                    $lte: today
                }
            })

            const latestTransactionsPromise = await Order.find({}).select(["orderItems", "discount", "total", "status"]).limit(4)
            // All Promises 
            const [thisMonthProducts, thisMonthUser, thisMonthOrder, lastMonthProducts, lastMonthUser, lastMonthOrder, productCount, usersCount, allOrders, lastSixMonthOrder, categories, femaleUsersCount, maleUsersCount, latestTransactions] = await Promise.all([thisMonthProductsPromise, thisMonthUserPromise, thisMonthOrderPromise, lastMonthProductsPromise, lastMonthUserPromise, lastMonthOrderPromise, Product.countDocuments(), User.countDocuments(), Order.find({}).select("total"), lastSixMonthOrderPromise, Product.distinct("category"), User.countDocuments({ gender: "female" }), User.countDocuments({ gender: "male" }), latestTransactionsPromise])



            // apply reduce method to calculate this month revenue (on orders)
            const thisMonthRevenue = thisMonthOrder.reduce((total, order) => total + (order.total || 0), 0)
            const lastMonthRevenue = lastMonthOrder.reduce((total, order) => total + (order.total || 0), 0)




            // Calculate Percentage of This Month with Last Month
            const percentChange = {
                revenue: percentageCalculate(thisMonthRevenue, lastMonthRevenue),
                product: percentageCalculate(
                    thisMonthProducts.length,
                    lastMonthProducts.length
                ),
                user: percentageCalculate(thisMonthUser.length, lastMonthUser.length),
                order: percentageCalculate(
                    thisMonthOrder.length,
                    lastMonthOrder.length
                ),
            };


            const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0)



            const count = {
                revenue,
                user: usersCount,
                product: productCount,
                order: allOrders.length
            }


            const orderMonthCounts = new Array(6).fill(0);
            const orderMonthyRevenue = new Array(6).fill(0);



            lastSixMonthOrder.forEach((order) => {
                const creationDate = order.createdAt;
                const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

                if (monthDiff < 6) {
                    orderMonthCounts[6 - monthDiff - 1] += 1;
                    orderMonthyRevenue[6 - monthDiff - 1] += order.total;
                }
            });

            const categoryCount = await getCategories({ categories, productCount })


            const userRatio = {
                male: usersCount - femaleUsersCount,
                female: usersCount - maleUsersCount
            }

            const optimizedLatestTransactions = latestTransactions.map(transaction => ({
                _id: transaction._id,
                discount: transaction.discount,
                amount: transaction.total,
                status: transaction.status,
                quantity: transaction.orderItems.reduce((total, item) => total + (item.quantity || 0), 0)
            }))

            stats = {
                categoryCount,
                percentChange,
                count,
                chart: {
                    order: orderMonthCounts,
                    revenue: orderMonthCounts

                },
                userRatio,
                latestTransactions: optimizedLatestTransactions
            }
            myCache.set(key, JSON.stringify(stats));
        }


        return res.status(200).json({
            success: true,
            stats
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Failed to Apply Discount",
            error: error.message
        })
    }
}

export const getPieCharts = async (

    req: Request<{}, {}>,
    res: Response,
    next: NextFunction
) => {
    try {

        let charts = {}

        const key = "admin-pie-charts"

        if (myCache.has(key)) {
            charts = JSON.parse(myCache.get(key)!);

        } else {

            const allOrdersPromise = await Order.find({}).select(["total", "discount", "subtotal", "tax", "shippingCharges"])

            const [processingOrder, shippedOrder, deliveredOrder, categories, productCount, productsOutOfStock, allOrders, allUsersWithDOB, adminUsers, customerUsers] = await Promise.all([
                Order.countDocuments({ status: "Processing" }),
                Order.countDocuments({ status: "Shipped" }),
                Order.countDocuments({ status: "Delivered" }),
                Product.distinct("category"),
                Product.countDocuments(),
                Product.countDocuments({ stock: { $lte: 0 } }),
                allOrdersPromise,
                User.find({}).select(["dob"]),
                User.countDocuments({ role: "admin" }),
                User.countDocuments({ role: "role" })
            ])

            const orderFullfillment = {
                processing: processingOrder,
                shipped: shippedOrder,
                delivered: deliveredOrder
            }


            const productCategories = await getCategories({ categories, productCount })


            const stockAvailability = {
                inStock: productCount - productsOutOfStock,
                outOfStock: productsOutOfStock,
            }


            const grossIncome = allOrders.reduce((prev, order) => prev + (order.total || 0), 0)
            const discount = allOrders.reduce((prev, order) => prev + (order.discount || 0), 0)
            const productionCost = allOrders.reduce((prev, order) => prev + (order.shippingCharges || 0), 0)
            const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0)
            const marketingCost = Math.round(grossIncome * (30 / 100))
            const netMargin = grossIncome - discount - productionCost - burnt - marketingCost


            const revenueDistribution = {
                netMargin,
                discount,
                productionCost,
                burnt,
                marketingCost,
            }

            const adminCustomers = {
                admin: adminUsers,
                customer: customerUsers
            }


            const calculateAge = (dob: Date): number => {
                const today = new Date();
                const birthDate = new Date(dob);
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();

                // If the user's birthday hasn't occurred yet this year, subtract 1 from the age
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }

                return age;
            };

            const usersAgeGroup = {
                teen: allUsersWithDOB.filter((user) => {
                    const age = calculateAge(user.dob);
                    return age < 20 && age > 12;
                }).length,
                adult: allUsersWithDOB.filter((user) => {
                    const age = calculateAge(user.dob);
                    return age >= 20 && age <= 40;
                }).length,
                old: allUsersWithDOB.filter((user) => {
                    const age = calculateAge(user.dob);
                    return age > 40;
                }).length,
            };

            charts = {
                orderFullfillment,
                productCategories,
                stockAvailability,
                revenueDistribution,
                usersAgeGroup,
                adminCustomers
            }

            myCache.set(key, JSON.stringify(charts))

        }
        return res.status(200).json({
            success: true,
            charts
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}


export const getBarCharts = async (

    req: Request<{}, {}>,
    res: Response,
    next: NextFunction
) => {
    try {
        let charts = {}

        const key = "admin-bar-charts"

        if (myCache.has(key)) {
            charts = JSON.parse(myCache.get(key)!);

        } else {
            const today = new Date()
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

            const tweleveMonthsAgo = new Date()
            tweleveMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 12)


            const lastSixMonthsUsersPromise = await User.find({
                createdAt: {
                    $gte: sixMonthsAgo,
                    $lte: today
                }
            }).select("createdAt")

            const twelveMonthsOrdersPromise = await Order.find({
                createdAt: {
                    $gte: tweleveMonthsAgo,
                    $lte: today
                }
            }).select("createdAt")

            const lastSixMonthsProductsPromise = await Product.find({
                createdAt: {
                    $gte: sixMonthsAgo,
                    $lte: today
                }
            }).select("createdAt")


            const [products, users, orders] = await Promise.all([lastSixMonthsProductsPromise, lastSixMonthsUsersPromise, twelveMonthsOrdersPromise])

            const productsCount = getChartsData({ length: 6, today, docArr: products });
            const usersCount = getChartsData({ length: 6, today, docArr: users });
            const ordersCount = getChartsData({ length: 12, today, docArr: orders });



            charts = {
                users: usersCount,
                product: productsCount,
                order: ordersCount,
            }


            myCache.set(key, JSON.stringify(charts))
        }
        return res.status(200).json({
            success: true,
            charts
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

export const getLineCharts = async (
    req: Request<{}, {}>,
    res: Response,
    next: NextFunction
) => {
    try {
        let charts = {}

        const key = "admin-line-charts"

        if (myCache.has(key)) {
            charts = JSON.parse(myCache.get(key)!);
        } else {
            const today = new Date()

            const twelveMonthsAgo = new Date()
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

            const baseQuery = {
                createdAt: {
                    $gte: twelveMonthsAgo,
                    $lte: today
                }
            }

            const twelveMonthsProductsPromise = await Product.find(baseQuery).select("createdAt");
            const twelveMonthsOrdersPromise = await Order.find(baseQuery).select(["createdAt", "discount", "total"]);  // Corrected fields
            const twelveMonthsUsersPromise = await User.find(baseQuery).select("createdAt");

            const [products, orders, users] = await Promise.all([twelveMonthsProductsPromise, twelveMonthsOrdersPromise, twelveMonthsUsersPromise]);

            const productsCount = getChartsData({ length: 12, today, docArr: products });
            const usersCount = getChartsData({ length: 12, today, docArr: users });
            const discount = getChartsData({
                length: 12,
                today,
                docArr: orders,
                property: "discount",
            });
            const revenue = getChartsData({
                length: 12,
                today,
                docArr: orders,
                property: "total",
            });

            charts = {
                users: usersCount,
                product: productsCount,
                discount,
                revenue
            }

            myCache.set(key, JSON.stringify(charts))
        }

        return res.status(200).json({
            success: true,
            charts
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}
