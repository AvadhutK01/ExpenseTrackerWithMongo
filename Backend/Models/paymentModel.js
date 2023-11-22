const { default: mongoose } = require("mongoose");
const Schema = mongoose.Schema;
const OrderSchema = new Schema({
    paymentid: String,
    orderid: String,
    status: String,
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    }
}
)
module.exports = mongoose.model('OrderData', OrderSchema);