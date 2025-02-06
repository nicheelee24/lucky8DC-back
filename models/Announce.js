const mongoose = require("mongoose");

const announceSchema = new mongoose.Schema({
    agent: {
        type: String,
    },
    desc: {
        type: String,
    },
    isDelete: {
        type: Boolean,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("announces", announceSchema);
