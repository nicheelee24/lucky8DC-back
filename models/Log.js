const mongoose = require("mongoose");

const logsSchema = new mongoose.Schema({
    action: {
        type: String,
    },
    code: {
        type: String,
    },
    response: {
        type: String,
    },
    responseEN: {
        type: String,
    },
    method: {
        type: String,
    },
    originalUrl: {
        type: String,
    },
    query: {
        type: Object,
    },
    ip: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("logs", logsSchema);
