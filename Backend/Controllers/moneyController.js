const path = require('path');
const userDb = require('../Models/userModel');
const moneyData = require('../Models/moneyModel');
const XLSX = require('xlsx');
const { uploadToS3 } = require('../services/S3Services');
const DurlDb = require('../Models/filesDownloadUrlModel');
const yearlyReportDb = require('../Models/YearlyReportModel');
exports.getExpenseMainHomePage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'Frontend', "Views", "mainHome.html"));
};

exports.getExpenseMainPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'Frontend', 'Views', "expenseMain.html"));
};

exports.addExpense = async (req, res) => {
    const t = await sequelize.transaction();
    const body = req.body;
    const id = req.user.id;
    const Amount = parseInt(body.Amount);
    const description = body.Desc;
    const sourceType = body.Type;
    const Etype = body.Etype;
    const date = formatDate(new Date().toLocaleDateString());
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const formattedDate = `${currentMonth.toString().padStart(2, '0')}-${currentYear}`;
    try {
        const result = await userDb.findByPk(id, { attributes: ['totalExpense', 'totalIncome'], transaction: t });
        const Yearlyresult = await yearlyReportDb.findAll({ where: { userDatumId: id, year: formattedDate.toString() }, attributes: ['TotalExpense', 'TotalIncomme', 'year'], transaction: t });
        const totalExpense = parseInt(result.totalExpense);
        const totalIncome = parseInt(result.totalIncome);
        let MonthlyTotalExpense = 0;
        let MonthlyTotalIncome = 0;
        if (Yearlyresult.length > 0) {
            MonthlyTotalExpense = parseInt(Yearlyresult[0].TotalExpense);
            MonthlyTotalIncome = parseInt(Yearlyresult[0].TotalIncomme);
        }
        await moneyData.create({
            Amount: Amount,
            date: date,
            description: description,
            sourceType: sourceType,
            type: Etype,
            userDatumId: id
        }, { transaction: t });
        if (Etype == 'Expense') {
            if (Yearlyresult && Yearlyresult.length > 0) {
                if (Yearlyresult[0].year == formattedDate) {
                    await yearlyReportDb.update({ TotalExpense: MonthlyTotalExpense + Amount }, { where: { userDatumId: id, year: formattedDate }, transaction: t });
                }
            }
            else {
                await yearlyReportDb.create({ year: formattedDate, TotalExpense: Amount, userDatumId: id }, { transaction: t })
            }
            await userDb.update({ date: date, totalExpense: totalExpense + Amount }, { where: { id: id }, transaction: t });
            await calculateAndUpdateSavings(id, t);
            await calculateAndUpdateYearlySavings(id, formattedDate, t);
        }
        else {
            if (Yearlyresult && Yearlyresult.length > 0) {
                if (Yearlyresult[0].year == formattedDate) {
                    await yearlyReportDb.update({ TotalIncomme: MonthlyTotalIncome + Amount }, { where: { userDatumId: id, year: formattedDate }, transaction: t });
                }
            }
            else {
                await yearlyReportDb.create({ year: formattedDate, TotalIncomme: Amount, userDatumId: id }, { transaction: t })
            }
            await userDb.update({ date: date, totalIncome: totalIncome + Amount }, { where: { id: id }, transaction: t });
            await calculateAndUpdateSavings(id, t);
            await calculateAndUpdateYearlySavings(id, formattedDate, t);
        }

        await t.commit();
        res.status(201).json({ message: 'Data Added Successfully' });
    } catch (err) {
        console.log(err);
        await t.rollback();
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getExpensesViewPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'Frontend', 'Views', "viewExpenses.html"));
};

exports.getExpensesData = async (req, res) => {
    const limit = +req.query.rows || 5;
    let totalItems;
    try {
        const page = +req.query.page || 1;
        const id = req.user.id;
        totalItems = await moneyData.count({ where: { userDatumId: id } });
        const result = await moneyData.findAll({ where: { userDatumId: id }, offset: (page - 1) * limit, limit: limit });
        res.status(200).json({
            result,
            currentPage: page,
            hasNextPage: limit * page < totalItems,
            nextPage: page + 1,
            hasPreviousPage: page > 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
        console.log(err);
    }
};

exports.getYearlyExpensesData = async (req, res) => {
    try {
        const id = req.user.id;
        const result = await yearlyReportDb.findAll({ where: { userDatumId: id } });
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ data: err });
        console.log(err);
    }
}

exports.getDownloadUrl = async (req, res) => {
    try {
        const id = req.user.id;
        const result = await DurlDb.findAll({ where: { userDatumId: id } });
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
        console.log(err);
    }
}

exports.deleteExpenseData = async (req, res) => {
    const t = await sequelize.transaction();
    const date = formatDate(new Date().toLocaleDateString());
    try {
        const id = req.body.id;
        const userid = req.user.id;
        const Amount = parseInt(req.body.Amount);
        const Etype = req.body.Etype;
        const moneyDataRecord = await moneyData.findOne({ where: { id: id, userDatumId: userid } });
        const { updatedAt } = moneyDataRecord;
        const currentMonth = updatedAt.getMonth() + 1;
        const currentYear = updatedAt.getFullYear();
        const formattedDate = `${currentMonth.toString().padStart(2, '0')}-${currentYear}`;

        const yearlyResult = await yearlyReportDb.findOne({ where: { userDatumId: userid, year: formattedDate }, transaction: t });
        if (!yearlyResult) {
            throw new Error('Yearly report not found for the specified month and year.');
        }

        const YearlytotalExpense = parseInt(yearlyResult.TotalExpense);
        const YearlytotalIncome = parseInt(yearlyResult.TotalIncomme);
        const savings = parseInt(yearlyResult.Savings);

        const result = await userDb.findByPk(userid, { attributes: ['totalExpense', 'totalIncome', 'Savings'], transaction: t });
        const totalExpense = parseInt(result.totalExpense);
        const totalIncome = parseInt(result.totalIncome);
        const totalSavings = parseInt(result.Savings);

        await moneyData.destroy({ where: { id: id, userDatumId: userid }, transaction: t });

        if (Etype === 'Expense') {
            await yearlyReportDb.update({ TotalExpense: YearlytotalExpense - Amount, Savings: savings + Amount }, { where: { userDatumId: userid, year: formattedDate }, transaction: t });
            await userDb.update({ date: date, totalExpense: totalExpense - Amount, Savings: totalSavings + Amount }, { where: { id: userid }, transaction: t });
        } else {
            await yearlyReportDb.update({ TotalIncomme: YearlytotalIncome - Amount, Savings: savings - Amount }, { where: { userDatumId: userid, year: formattedDate }, transaction: t });
            await userDb.update({ date: date, totalIncome: totalIncome - Amount, Savings: totalSavings + Amount }, { where: { id: userid }, transaction: t });
        }

        await t.commit();
        res.redirect('/expense/viewExpenses');
    } catch (err) {
        console.log(err);
        await t.rollback();
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateExpense = async (req, res) => {
    const t = await sequelize.transaction();
    const date = formatDate(new Date().toLocaleDateString());
    try {
        const body = req.body;
        const id = body.id;
        const Etype = body.Etype;
        const userid = req.user.id;
        const newExpenseAmount = parseInt(body.data.Amount);
        const newDescription = body.data.Desc;
        const newExpenseType = body.data.Type;
        const moneyDatavalue = await moneyData.findOne({ where: { id: id, userDatumId: userid }, transaction: t });
        const oldExpenseAmount = parseInt(moneyDatavalue.Amount);
        const updatedAt = moneyDatavalue.updatedAt;
        const currentMonth = updatedAt.getMonth() + 1;
        const currentYear = updatedAt.getFullYear();
        const formattedDate = `${currentMonth.toString().padStart(2, '0')}-${currentYear}`;
        moneyDatavalue.date = date;
        moneyDatavalue.Amount = parseInt(newExpenseAmount);
        moneyDatavalue.description = newDescription;
        moneyDatavalue.sourceType = newExpenseType;

        await moneyDatavalue.save({ transaction: t });


        const result = await userDb.findByPk(userid, { attributes: ['totalExpense', 'totalIncome', 'Savings'], transaction: t });
        const totalExpense = parseInt(result.totalExpense);
        const totalIncome = parseInt(result.totalIncome);
        const totalSavings = parseInt(result.Savings);
        const expenseAmountDifference = oldExpenseAmount - newExpenseAmount;

        const yearlyResult = await yearlyReportDb.findOne({ where: { userDatumId: userid, year: formattedDate }, transaction: t });
        const YearlytotalExpense = parseInt(yearlyResult.TotalExpense);
        const YearlytotalIncome = parseInt(yearlyResult.TotalIncomme);
        const Yearltysavings = parseInt(yearlyResult.Savings);
        const TotalexpenseAmountDifference = parseInt(oldExpenseAmount - newExpenseAmount);

        if (Etype == 'Expense') {
            await yearlyReportDb.update({ TotalExpense: YearlytotalExpense - TotalexpenseAmountDifference, Savings: Yearltysavings + TotalexpenseAmountDifference }, { where: { userDatumId: userid, year: formattedDate }, transaction: t });
            await userDb.update({ date: date, totalExpense: totalExpense - expenseAmountDifference, Savings: totalSavings + TotalexpenseAmountDifference }, { where: { id: userid }, transaction: t });
        } else {
            await yearlyReportDb.update({ TotalIncomme: YearlytotalIncome - TotalexpenseAmountDifference, Savings: Yearltysavings - TotalexpenseAmountDifference }, { where: { userDatumId: userid, year: formattedDate }, transaction: t });
            await userDb.update({ date: date, totalIncome: totalIncome - expenseAmountDifference, Savings: totalSavings - TotalexpenseAmountDifference }, { where: { id: userid }, transaction: t });
        }

        await t.commit();
        res.status(200).json({ message: 'Expense Updated Successfully!' });
    } catch (err) {
        console.log(err);
        await t.rollback();
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getLeaderBoardPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'Frontend', "Views", "expenseLeaderBoard.html"));
};

exports.getLeaderBoardData = async (req, res) => {
    try {
        const LeaderBoardData = await userDb.findAll({
            attributes: [
                'name',
                'totalExpense',
                'totalIncome',
                'Savings'
            ],
            order: [
                [sequelize.col('Savings'), 'DESC']
            ]
        });
        res.status(200).json(LeaderBoardData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getViewMonetaryPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'Frontend', "Views", "viewMonetaryData.html"));
}

exports.downloadExpense = async (req, res) => {
    const t = await sequelize.transaction();
    const userId = req.user.id;
    const date = new Date().toLocaleString().replace(/\//g, '-');
    const downloadType = req.body.downloadType;
    let buffer;
    let fileName;
    if (downloadType == 'Report') {
        const { dailyData, weeklyData, monthlyData, yearlyData, totalSavingData } = req.body;
        function createDataArrayWithSection(data) {
            return data.map(item => [item.date, item.amount, item.sourceType, item.description, item.type]);
        }

        function createDataArrayWithYearlySection(data) {
            return data.map(item => [item.monthYear, item.totalIncome, item.totalExpense, item.savings]);
        }

        function createDataArrayWithSavingsSection(data) {
            return data.map(item => [item.TotalIncome, item.TotalExpense, item.TotalSaving]);
        }
        const allData = [
            [' ', ' ', 'Daily Data', ' ', ' '],
            ['Date', 'Amount', 'SourceType', 'Description', 'Type'],
            ...createDataArrayWithSection(dailyData),
            [],
            [' ', ' ', 'Weekly Data', ' ', ' '],
            ['Date', 'Amount', 'SourceType', 'Description', 'Type'],
            ...createDataArrayWithSection(weeklyData),
            [],
            [' ', ' ', 'Monthly Data', ' ', ' '],
            ['Date', 'Amount', 'SourceType', 'Description', 'Type'],
            ...createDataArrayWithSection(monthlyData),
            [],
            [' ', 'Yearly Data', ' '],
            ['MonthYear', 'Total Income', 'Total Expense', 'Savings'],
            ...createDataArrayWithYearlySection(yearlyData),
            [],
            [' ', 'Total Savings', ' '],
            ['Total Income', 'Total Expense', 'Total Savings'],
            ...createDataArrayWithSavingsSection(totalSavingData)
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(allData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Combined Data');
        buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        fileName = `expense${userId}/Report_date-${date}.xlsx`;
    }
    else if (downloadType == 'All') {
        const result = await moneyData.findAll({ where: { userDatumId: userId } });

        function createDataArrayWithAllData(data) {
            return data.map(item => [item.date, item.Amount, item.sourceType, item.description, item.type]);
        }

        const allData = [
            ['All Data'],
            ['Date', 'Amount', 'SourceType', 'Description', 'Type'],
            ...createDataArrayWithAllData(result)
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(allData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'All Data');
        buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        fileName = `expense${userId}/All_Data_date-${date}.xlsx`;
    }
    if (buffer != null && fileName != null) {
        await uploadToS3('mynewexpensebucket', buffer, fileName)
            .then(async (fileUrl) => {
                res.setHeader('Content-Disposition', 'attachment; filename=expense.xlsx');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                await DurlDb.create({
                    date: date,
                    fileUrl: fileUrl,
                    type: downloadType,
                    userDatumId: userId
                }, { transaction: t });
                await t.commit()
                res.status(200).json({ fileUrl, success: true });
            })
            .catch(async (error) => {
                console.error(error);
                await t.rollback()
                res.status(500).json({ message: 'Internal Server Error' });
            });
    }
}

module.exports.viewReportExpensesData = async (req, res) => {
    try {
        const id = req.user.id;
        const result = await moneyData.findAll({ where: { userDatumId: id } });
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
        console.log(err);
    }
}

module.exports.getExpenseGraph = async (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'Frontend', 'Views', 'GraphView.html'))
}

async function calculateAndUpdateYearlySavings(id, formattedDate, t) {
    try {
        const yearlyResult = await yearlyReportDb.findOne({ where: { userDatumId: id, year: formattedDate }, transaction: t });
        if (yearlyResult) {
            const totalExpense = parseInt(yearlyResult.TotalExpense);
            const totalIncome = parseInt(yearlyResult.TotalIncomme);
            const savings = parseInt(totalIncome - totalExpense);
            await yearlyReportDb.update({ Savings: savings }, { where: { userDatumId: id, year: formattedDate }, transaction: t });
            return savings;
        }
        return 0;
    } catch (error) {
        console.log(error);
        return 0;
    }
}
async function calculateAndUpdateSavings(id, t) {
    try {
        const Result = await userDb.findOne({ where: { id: id }, transaction: t });
        if (Result) {
            const totalExpense = parseInt(Result.totalExpense);
            const totalIncome = parseInt(Result.totalIncome);
            const savings = parseInt(totalIncome - totalExpense);
            await userDb.update({ Savings: savings }, { where: { id: id }, transaction: t });
            return savings;
        }
        return 0;
    } catch (error) {
        console.log(error);
        return 0;
    }
}

function formatDate(currentDate) {
    const [month, day, year] = currentDate.split('/');
    const formattedDate = `${day}/${month}/${year}`;
    return formattedDate;
}