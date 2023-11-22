const { Sequelize } = require("sequelize");
const sequelize = require("../dbConnection");
const moneyData = sequelize.define('moneyData', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Amount: {
        type: Sequelize.DECIMAL,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false
    },
    sourceType: {
        type: Sequelize.STRING,
        allowNull: false
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false
    }
})
module.exports = moneyData;