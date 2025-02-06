const mongoose = require("mongoose");

const betSchema = new mongoose.Schema({
    action: {
        type: String,
    },
    userId: {
        type: String,
    },
    agentId: {
        type: String,
    },
    gameType: {
        type: String,
    },
    gameName: {
        type: String,
    },
    gameCode: {
        type: String,
    },
    gameType: {
        type: String,
    },
    platform: {
        type: String,
    },
    platformTxId: {
        type: String,
    },
    roundId: {
        type: String,
    },
    betType: {
        type: String,
    },
    currency: {
        type: String,
    },
    betTime: {
        type: Date,
    },
    txTime: {
        type: Date,
    },
    betAmount: {
        type: Number,
    },
    turnover: {
        type: Number,
    },
    winAmount: {
        type: Number,
    },
    updateTime: {
        type: Date,
    },
    gameInfo: {
        type: Object,
    },
    requireAmount: {
        type: Number,
    },
    refPlatformTxId: {
        type: String,
    },
    settleType: {
        type: String,
    },
    amount: {
        type: Number,
    },
    promotionTxId: {
        type: String,
    },
    promotionId: {
        type: String,
    },
    promotionTypeId: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("bets", betSchema);
