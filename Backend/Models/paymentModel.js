const { Sequelize } = require("sequelize");
const sequelize = require("../dbConnection");

const OrderData = sequelize.define('orderData', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    paymentid: Sequelize.STRING,
    orderid: Sequelize.STRING,
    status: Sequelize.STRING
})
module.exports = OrderData;