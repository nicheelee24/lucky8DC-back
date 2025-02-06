const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");

const User = require("../../models/User");
const Announce = require("../../models/Announce");
const Transaction = require("../../models/Transaction");
const Bet = require("../../models/Bet");

// Announce
// Method POST
// Middleware auth
router.post("/announce", auth, async (req, res) => {
    const user = await User.findById(req.user.id);
    const filter = { agent: user.platform, isDelete: false };
    const ans = await Announce.find(filter);

    res.json(ans);
});

// Financial Report
// Method POST
// Middleware auth
router.post("/financial-report", auth, async (req, res) => {
    console.log("financial report called....");
    const { fromDate, toDate } = req.body;
    
    console.log(fromDate, toDate);
    const user = await User.findById(req.user.id);
    const phone = user.phone;

    const transactions = await Transaction.aggregate([
        {
            $group: {
                _id: {
                    date: {
                        $dateToString: { format: "%Y-%m-%d", date: "$date" },
                    },
                    type: "$type",
                },
                totalPayAmount: { $sum: "$payAmount" },
            },
        },
        {
            $sort: {
                "_id.date": 1,
                "_id.type": 1,
            },
        },
        {
            $match: {
                "_id.date": {
                    $gte: fromDate,
                    $lte: toDate,
                },
            },
        },
    ])
        .then((result) => {
            return result;
            //   The sample of result
            //   [
            //     { _id: { date: '2024-02-14', type: 'deposit' }, totalPayAmount: 200 }
            //   ]
        })
        .catch((err) => {
            return err;
        });

    //   Bet History
    const fDate = new Date(fromDate);
    const tDate = new Date(toDate);

    let filter = {
        userId: phone,
        txTime: {
            $gte: fDate,
            $lte: tDate,
        },
    };

    const bets = await Bet.aggregate([
        {
            $match: filter,
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$betTime" },
                },
                totalBetAmount: { $sum: "$betAmount" },
                totalWinAmount: { $sum: "$winAmount" },
            },
        },
        {
            $sort: {
                _id: 1,
            },
        },
    ])
        .then((result) => {
            return result;
            // [ { _id: '2024-02-23', totalBetAmount: 50, totalWinAmount: 14.8 } ]
        })
        .catch((err) => {
            console.error(err);
            return err;
        });

    const response = [];

    bets.map((bet, key) => {
        response.push({
            DATE: bet._id,
            CATEGORY: "bet",
            ALLCOMPUTERS: [
                bet.totalBetAmount.toFixed(2),
                bet.totalWinAmount.toFixed(2),
            ],
            TOTALAMOUNT: user.balance.toFixed(2),
        });
    });

    transactions.map((transaction, key) => {
        response.push({
            DATE: transaction._id.date,
            CATEGORY: transaction._id.type,
            ALLCOMPUTERS: [transaction.totalPayAmount.toFixed(2)],
            TOTALAMOUNT: user.balance.toFixed(2),
        });
    });

    console.log(response);

    // console.log(bets)
    res.json(response);
    // bet amount
    // transaction
});

// My Bet List
// Method POST
// Middleware auth
// router.post("/my-bet", async (req, res) => {
//     console.log("my bets function called..");
//     const user = await User.findById(1);
//     const { gameType } = req.body;

//     let filter = {
//         userId: user.name,
//         betTime: { $gte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }, // 5 days in milliseconds
//     };

//     // Only add gameType to the filter if it's provided and not equal to "All"
//     if (gameType && gameType !== "All") {
//         filter.gameType = gameType;
//     }

//     const bets = await Bet.find(filter).sort( { date: -1 } );
//     //console.log(bets);
//     res.json(bets);
// });

module.exports = router;
