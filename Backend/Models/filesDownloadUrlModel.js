const { Sequelize } = require("sequelize");
const sequelize = require("../dbConnection");
const DurlDb = sequelize.define('DurlData', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date: {
        type: Sequelize.STRING,
        allowNull: false
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false
    },
    fileUrl: {
        type: Sequelize.TEXT,
        allowNull: false
    }
});
module.exports = DurlDb;