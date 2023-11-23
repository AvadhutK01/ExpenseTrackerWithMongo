const { default: mongoose } = require("mongoose");
const Schema = mongoose.Schema;
const moneySchema = new Schema(
    {
        date: {
            type: String,
            required: true
        },
        Amount: {
            type: Schema.Types.Decimal128,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        sourceType: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Users',
            required: true
        }
    }
)
module.exports = mongoose.model('moneyData', moneySchema);