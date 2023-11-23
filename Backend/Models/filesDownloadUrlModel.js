const { default: mongoose } = require("mongoose");
const Schema = mongoose.Schema;
const UrlSchema = new Schema({
    date: {
        type: String,
        requried: true
    },
    type: {
        type: String,
        requried: true
    },
    fileUrl: {
        type: String,
        allowNull: false
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    }
})
module.exports = mongoose.model('UrlData', UrlSchema)