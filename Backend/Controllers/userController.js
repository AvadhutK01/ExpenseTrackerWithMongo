const path = require('path');
const userDb = require('../Models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var SibApiV3Sdk = require('sib-api-v3-sdk');
const { v4: uuidv4 } = require('uuid');
const forgetPasswordModel = require('../Models/forgetPasswordModel');

exports.getRegistrationPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'Frontend', "Views", "RegistrationPage.html"));
};

exports.getLoginPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'Frontend', "Views", "LoginPage.html"));
};

exports.postRegistrationData = async (req, res) => {
    const body = req.body;
    const name = body.nameInput;
    const phoneNo = body.phoneInput;
    const email = body.emailInput;
    const passwordInput = body.passwordInput;
    const date = formatDate(new Date().toLocaleDateString());
    const t = await sequelize.transaction();
    try {
        const passWord = await bcrypt.hash(passwordInput, 10);
        await userDb.create({
            date: date,
            name: name,
            phoneNo: phoneNo,
            email: email,
            passWord: passWord
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'success' });
    } catch (err) {
        await t.rollback();
        if (err.name === 'SequelizeUniqueConstraintError') {
            res.status(409).json({ message: 'exist' });
        } else {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

exports.checkLogin = async (req, res) => {
    const body = req.body;
    const email = body.email;
    const password = body.password;

    const t = await sequelize.transaction();
    try {
        let data = await userDb.findOne({
            where: {
                email: email
            },
            transaction: t
        });

        if (data) {
            const checkLogin = await bcrypt.compare(password, data.passWord);
            if (checkLogin) {
                await t.commit();
                res.status(201).json({ message: 'success', token: generateAccessToken(data.id) });
            } else {
                await t.rollback();
                res.status(401).json({ message: 'Failed' });
            }
        } else {
            await t.rollback();
            res.status(404).json({ message: 'NotExist' });
        }
    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.SendforgetPasswordLink = async (req, res) => {
    try {
        const email = req.body.emailId;
        const id = uuidv4();
        const user = await userDb.findOne({ where: { email: email }, attributes: ['id'] });
        if (user) {
            await forgetPasswordModel.create({
                id: id,
                userDatumId: user.id
            });

            var defaultClient = SibApiV3Sdk.ApiClient.instance;
            var apiKey = defaultClient.authentications['api-key'];
            apiKey.apiKey = process.env.FORGETPASSWORDKEY;
            var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            const sender = { email: "kelaskaravadhut11@gmail.com" };
            const receivers = [{ email: `${email}` }];
            apiInstance.sendTransacEmail({
                sender,
                to: receivers,
                subject: "Reset Password",
                textContent: `click on given one time link to reset the password:  ${process.env.FORGET_LINK}user/forgetPassword/${id}`
            }).then(() => {
                res.status(202).json({ message: 'success' });
            });
        } else {
            res.status(404).json({ message: 'User Not Found Check email address!' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getForgetPasswordPage = async (req, res) => {
    try {
        const id = req.params.id;
        const response = await forgetPasswordModel.findOne({ where: { id: id, isactive: 1 } });
        if (response) {
            const t = await sequelize.transaction();
            try {
                await response.update({ isactive: 0 }, { transaction: t });
                await t.commit();
                res.sendFile(path.join(__dirname, '..', '..', 'Frontend', "Views", "forgetPasswordPage.html"));
            } catch (error) {
                await t.rollback();
                console.log(error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        } else {
            res.status(404).json({ message: 'Url Not Exist Check Url' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updatePasswordData = async (req, res) => {
    const id = req.body.id;
    const password = req.body.password;
    const date = formatDate(new Date().toLocaleDateString());
    const t = await sequelize.transaction();
    try {
        const response = await forgetPasswordModel.findOne({ where: { id: id }, attributes: ['userDatumId'], transaction: t });
        const userId = response.userDatumId;
        const passWordHashed = await bcrypt.hash(password, 10);
        await userDb.update({ date: date, passWord: passWordHashed }, { where: { id: userId }, transaction: t });
        await t.commit();
        res.status(200).json({ message: 'Password updated successfully!' });
    } catch (error) {
        await t.rollback();
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

function generateAccessToken(id) {
    return jwt.sign({ userid: id }, process.env.SECRETKEY);
}

function formatDate(currentDate) {
    const [month, day, year] = currentDate.split('/');
    const formattedDate = `${day}/${month}/${year}`;

    return formattedDate;
}