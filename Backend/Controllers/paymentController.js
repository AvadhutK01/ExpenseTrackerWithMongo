const Razorpay = require("razorpay");
const OrderData = require("../Models/paymentModel");
const userDb = require("../Models/userModel");

module.exports.purchasePremium = async (req, res) => {
    try {
        const rzp = new Razorpay({
            key_id: process.env.RAZORPAYKEYID,
            key_secret: process.env.RAZORPAYSECRET
        });
        const amount = 2000;

        const result = await rzp.orders.create({ amount, currency: 'INR' });
        const order = new OrderData({ orderid: result.id, status: 'PENDING', userId: req.user._id });
        const response = await order.save();
        if (response) {
            return res.status(201).json({ result, key_id: rzp.key_id });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error!" });
    }
};

module.exports.updateTransaction = async (req, res) => {
    try {
        const orderid = req.body.order_id;
        if (req.body.payment_id) {
            const { payment_id, order_id } = req.body;
            const orderResponse = await OrderData.findOne({ orderid: order_id });
            const userUpdate = await req.user.updateOne({ isPremium: true });
            await Promise.all([orderResponse, userUpdate]);
            const response = await OrderData.findOne({ orderid: order_id });
            await response.updateOne({ paymentid: payment_id, status: 'SUCCESSFUL' });
            return res.status(202).json({ success: true, message: "TRANSACTION SUCCESSFUL" });
        } else {
            const response = await OrderData.findOne({
                orderid: orderid
            });
            await response.updateOne({ status: 'FAILED' });
            return res.status(401).json({ success: false, message: "TRANSACTION FAILED" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
};

module.exports.checkPremium = async (req, res) => {
    try {
        const userid = req.user._id;
        const premiumCheck = await userDb.findOne(
            {
                _id: userid,
                isPremium: 1
            });
        if (premiumCheck) {
            res.json({ result: 'true' });
        } else {
            res.json({ result: 'false' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
};
