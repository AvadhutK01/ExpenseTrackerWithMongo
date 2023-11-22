const Razorpay = require("razorpay");
const OrderData = require("../Models/paymentModel");
const userDb = require("../Models/userModel");

module.exports.purchasePremium = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const rzp = new Razorpay({
            key_id: process.env.RAZORPAYKEYID,
            key_secret: process.env.RAZORPAYSECRET
        });
        const amount = 2000;

        const result = await rzp.orders.create({ amount, currency: 'INR' });
        const response = await OrderData.create({ orderid: result.id, status: 'PENDING', userDatumId: req.user.id }, { transaction: t });
        if (response) {
            await t.commit();
            return res.status(201).json({ result, key_id: rzp.key_id });
        }
    } catch (error) {
        await t.rollback();
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error!" });
    }
};

module.exports.updateTransaction = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const orderid = req.body.order_id;
        if (req.body.payment_id) {
            const { payment_id, order_id } = req.body;
            const orderResponse = await OrderData.findOne({ where: { orderid: order_id }, transaction: t });
            const userUpdate = await req.user.update({ isPremium: true }, { transaction: t });
            await Promise.all([orderResponse, userUpdate]);
            const response = await OrderData.findOne({ where: { orderid: order_id }, transaction: t });
            await response.update({ paymentid: payment_id, status: 'SUCCESSFUL' }, { transaction: t });
            await t.commit();
            return res.status(202).json({ success: true, message: "TRANSACTION SUCCESSFUL" });
        } else {
            const response = await OrderData.findOne({
                where: {
                    orderid: orderid
                }
            }, { transaction: t });
            await response.update({ status: 'FAILED' }, { transaction: t });
            await t.commit();
            return res.status(401).json({ success: false, message: "TRANSACTION FAILED" });
        }
    } catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
};

module.exports.checkPremium = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userid = req.user.id;
        const premiumCheck = await userDb.findOne({
            where: {
                id: userid,
                isPremium: 1
            }
        }, { transaction: t });
        await t.commit();
        if (premiumCheck) {
            res.json({ result: 'true' });
        } else {
            res.json({ result: 'false' });
        }
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
};
