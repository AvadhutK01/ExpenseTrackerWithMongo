const { default: mongoose } = require("mongoose");
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    date: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    phoneNo: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isPremium: {
        type: Boolean,
        default: false,
        required: true
    },
    totalExpense: {
        type: Number,
        default: 0,
        required: true
    },
    totalIncome: {
        type: Number,
        default: 0,
        required: true
    },
    Savings: {
        type: Number,
        default: 0,
        required: true
    },
})
module.exports = mongoose.model('Users', UserSchema);