const { default: mongoose } = require("mongoose");
const Schema = mongoose.Schema;
const forgetPasswordSchema = new Schema({
    isactive: {
        type: Boolean,
        default: true,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    }
})
module.exports = mongoose.model('ForgetPassword', forgetPasswordSchema);