const mongoose = require("mongoose");
const gameSchema = new mongoose.Schema({
    platform: {
        type: String,
        required: true,
    },
    gameType: {
        type: String,
        required: true,
    },
    gameCode: {
        type: String,
        required: true,
    },
    gameName: {
        type: String,
        required: true,
    },
    img: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("games", gameSchema);
