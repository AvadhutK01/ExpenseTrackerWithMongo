const { default: mongoose } = require("mongoose");
const Schema = mongoose.Schema;
const yearlyReportSchema = new Schema({
    year: {
        type: String,
        required: true
    },
    TotalIncomme: {
        type: Schema.Types.Decimal128,
        required: true,
        default: 0
    },
    TotalExpense: {
        type: Schema.Types.Decimal128,
        required: true,
        default: 0
    },
    Savings: {
        type: Schema.Types.Decimal128,
        required: true,
        default: 0
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    }
})
module.exports = mongoose.model('yearlyReport', yearlyReportSchema);