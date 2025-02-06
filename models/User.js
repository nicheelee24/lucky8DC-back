const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    rpwd: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    avatar: { type: String },
    balance: {
        type: Number,
        default: 0,
    },
    bban: {
        // bank account number
        type: String,
    },
    bbun: {
        // bank user name
        type: String,
    },
    bbn: {
        // bank name
        type: String,
    },
    platform: {
        // luckygao, dotbet, bandai ....
        type: String,
    },
    deptime: {
        // the time during the first deposit time
        type: Number,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    status: {
        // luckygao, dotbet, bandai ....
        type: String,
    },
    promotionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'promotions',
        required: false
    },
    turnovers: {
        type: Number,
        default: 0,
    },
    turnoverAmt: {
        type: Number,
        default: 0,
    },
});
module.exports = mongoose.model("users", userSchema);
