const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
    agentid: {
        type: String,
        unique: true,
    },
    url: {
        type: String,
    },
    platform: {
        type: String,
    },
    percentage: {
        type: Number,
    },
    userid: {
        type: String,
        unique: true,
    },
    pwd: {
        type: String,
    },
    parent: {
        type: String, // agentid
    },
    prefix: {
        type: String, // LK9
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("agents", agentSchema);
