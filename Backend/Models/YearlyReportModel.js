const { Sequelize } = require("sequelize");
const sequelize = require("../dbConnection");
const yearlyReportDb = sequelize.define('YearlyReport', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    year: {
        type: Sequelize.STRING,
        allowNull: false
    },
    TotalIncomme: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    TotalExpense: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    Savings: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    }
})
module.exports = yearlyReportDb;