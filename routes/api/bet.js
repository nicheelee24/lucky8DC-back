const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const { getIo } = require('../../socketManager');

const Transaction = require("../../models/Transaction");
const User = require("../../models/User");
const Bet = require("../../models/Bet");

router.get("/mybets", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        console.log("userrrrrrr data"+user.name);
        let myBets=[];
        myBets = await Bet.find({
            userId: user.name,
           
        }).sort({date:-1});
       // console.log("my bets dataaaa....backend log"+myBets);
        res.json({ status: "0000",myBets });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
router.get("/promote", async (req, res) => {
    try {
        let myBets = await Bet.find({
            userId: "am7000877",
           
        }).limit(50);
        res.json({ status: "0000", myBets });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
