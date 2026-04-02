import Razorpay from 'razorpay';
import crypto from 'crypto';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        if (!amount) {
            return res.status(400).json(new ApiError(400, 'Amount is required'));
        }

        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).json(ApiError.internal('Failed to create order'));
        }

        return res.status(200).json(
            ApiResponse.success(order, 'Order created successfully')
        );
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        return res.status(500).json(ApiError.internal(error.message || 'Internal server error'));
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json(ApiError.badRequest('All payment details are required'));
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            return res.status(200).json(
                ApiResponse.success({ verified: true }, 'Payment verified successfully')
            );
        } else {
            return res.status(400).json(ApiError.badRequest('Invalid signature, payment verification failed'));
        }
    } catch (error) {
        console.error('Razorpay Verify Payment Error:', error);
        return res.status(500).json(ApiError.internal(error.message || 'Internal server error'));
    }
};
