const express = require('express');
const authnticateUser = require('../MiddleWares/auth');
const payRoute = express.Router();
const paymentController = require('../Controllers/paymentController');
payRoute.get("/premiummember", authnticateUser, paymentController.purchasePremium);
payRoute.post("/updateTransacation", authnticateUser, paymentController.updateTransaction);
payRoute.get('/checkPremium', authnticateUser, paymentController.checkPremium);
module.exports = payRoute;