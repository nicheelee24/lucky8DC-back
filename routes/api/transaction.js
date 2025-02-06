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

router.get("/history/all", async (req, res) => {
    try {
        const transactions = await Transaction.find().populate("userid");
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.get("/history", auth, async (req, res) => {
    // { id: '65ccdcaeba7e58649cb60b07' }
    console.log(req.user.id);
    try {
        const transactions = await Transaction.find({ userid: req.user.id });
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.get("/history/:type", auth, async (req, res) => {
    // { id: '65ccdcaeba7e58649cb60b07' }

    let filter = { userid: req.user.id };
    filter.status = "PAID";
    if (req.params.type == "deposit") {
        filter.type = "deposit";
    } else if (req.params.type == "withdraw") {
        filter.type = "withdraw";
    }

    try {
        const transactions = await Transaction.find(filter).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.get("/total_amount/:type/:agent", async (req, res) => {
    let filter = { platform: req.params.agent, type: req.params.type };

    let totalAmount = 0;

    try {
        const transactions = await Transaction.find(filter);

        transactions.map((transaction, index) => {
            if (transaction.status == "PAID")
                totalAmount += transaction.payAmount;
        });

        res.json({
            agent: req.params.agent,
            type: req.params.type,
            amount: totalAmount,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
