const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    photo: {
        type: String,
    },
    title: {
        type: String,
    },
    details: {
        type: String,
    },
    promoCode: {
        type: String,
    },
    expDate: {
        type: String,
    },
   
    // bonusType: {
    //     type: String,
    // },
    percentBonus: {
        type: Number,
    },
    depositAmnt: {
        type: Number,
    },
    bonusAmnt: {
        type: Number,
    },
    turnover: {
        type: Number,
    },
    highestPercent: {
        type: Number,
    },
    permissions: {
        type: Array,
    },
    agentname: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("promotions", promotionSchema);
