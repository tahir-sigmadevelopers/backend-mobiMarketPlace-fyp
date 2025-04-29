import { NextFunction, Request, Response } from "express"


export interface NewUserRequestBody {
    name: string,
    email: string,
    image: string,
    gender: string,
    _id: string,
    dob: Date,
}


export interface NewProductRequestBody {
    title: string,
    price: number,
    image: string,
    stock: number,
    category: string,
    _id: string,
}

export interface searchRequestQuery {
    price?: string,
    search?: string,
    category?: string,
    sort?: string,
    page?: string
}

export interface baseQuery {
    title?: {
        $regex: string,
        $options: string
    },
    price?: {
        $lte: number
    },
    category?: string,
    sort?: string,
    page?: string

}

export type invalidatesCacheProps = {
    product?: boolean;
    order?: boolean;
    admin?: boolean;
    userId?: string;
    orderId?: string;
    productId?: string | string[];

}


export type OrderItemType = {
    productId: string,
    quantity: number,
    price: number,
    title: string,
    image: string,
}

export type ShippingInfoType = {
    address: string,
    city: string,
    state: string,
    country: string,
    postalCode: number,
}


export interface NewOrderRequestBody {
    shippingInfo: ShippingInfoType,
    orderItems: OrderItemType[],
    user: string,
    subtotal: number,
    shippingCharges: number,
    total: number,
    discount: number,
    tax: number,
}

export interface NewCouponBody {
    coupon: string,
    amount: number,
}


export type ControllerType = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;