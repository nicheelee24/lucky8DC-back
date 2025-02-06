const express = require("express");
const {
    getNewEnteringCustomers,
    getWinLoseByPlayerPhone,
} = require("../../module/player");
const Transaction = require("../../models/Transaction");
const router = express.Router();
const auth = require("../../middleware/bandai-auth");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");

router.post("/new-player", auth, async (req, res) => {
    const { startDate, endDate } = req.body;
    const agent = req.user.platform;

    const newCustomers = await getNewEnteringCustomers(
        agent,
        startDate,
        endDate
    );
    // '_id', 'phone', 'balance', 'agent', 'date'
    res.json({ status: true, result: newCustomers });
});

router.get("/player-stats", auth, async (req, res) => {
    const { startDate, endDate } = req.body;
    const agent = req.user.platform;
    console.log("player-stats", agent);
    // startDate = '2023-01-01';
    // endDate = '2024-12-31';

    try {
        const playerStats = await Transaction.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                    // Add other filtering conditions here if necessary
                },
            },
            {
                $group: {
                    _id: "$userid",
                    totalDepositAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$type", "deposit"] },
                                "$payAmount",
                                0,
                            ],
                        },
                    },
                    totalWithdrawalAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$type", "withdraw"] },
                                "$payAmount",
                                0,
                            ],
                        },
                    },
                    totalDepositTimes: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "deposit"] }, 1, 0],
                        },
                    },
                    totalWithdrawalTimes: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "withdraw"] }, 1, 0],
                        },
                    },
                    totalDepositTrxIDs: {
                        $push: {
                            $cond: [
                                { $eq: ["$type", "deposit"] },
                                "$trxNo",
                                "$noval",
                            ],
                        },
                    },
                    totalWithdrawalTrxIDs: {
                        $push: {
                            $cond: [
                                { $eq: ["$type", "withdraw"] },
                                "$trxNo",
                                "$noval",
                            ],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            {
                $unwind: {
                    path: "$userDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    userName: "$userDetails.name", // Adjust based on your user schema
                    agent: "$userDetails.platform",
                    date: "$userDetails.date",
                    origin: "$userDetails.origin",
                    totalDepositAmount: 1,
                    totalWithdrawalAmount: 1,
                    totalDepositTimes: 1,
                    totalWithdrawalTimes: 1,
                    totalDepositTrxIDs: {
                        $filter: {
                            input: "$totalDepositTrxIDs",
                            as: "item",
                            cond: { $ne: ["$$item", "$noval"] },
                        },
                    },
                    totalWithdrawalTrxIDs: {
                        $filter: {
                            input: "$totalWithdrawalTrxIDs",
                            as: "item",
                            cond: { $ne: ["$$item", "$noval"] },
                        },
                    },
                },
            },
            {
                $match: {
                    agent: agent,
                    // Add other filtering conditions here if necessary
                },
            },
        ]);

        for (let playerStat of playerStats) {
            // Fetch deposit transaction details
            playerStat.totalDepositTransactions = await Transaction.find({
                trxNo: {
                    $in: playerStat.totalDepositTrxIDs.filter(
                        (trxNo) => trxNo !== "$noval"
                    ),
                },
            });

            // Fetch withdrawal transaction details
            playerStat.totalWithdrawalTransactions = await Transaction.find({
                trxNo: {
                    $in: playerStat.totalWithdrawalTrxIDs.filter(
                        (trxNo) => trxNo !== "$noval"
                    ),
                },
            });
        }

        console.log(JSON.stringify(playerStats, null, 2));

        await Promise.all(
            playerStats.map(async (playerStat, index) => {
                // playerStat.winlose = await getWinLoseByPlayerPhone(agent, startDate, endDate, playerStat.userName);
                playerStat.winlose = await getWinLoseByPlayerPhone(
                    agent,
                    startDate,
                    endDate,
                    playerStat.userName
                );

                // playerStat.totalDepositTrxIDs = ["qweqweqwe"];
                // playerStat.totalWithdrawalTrxIDs = ["234234234234"];

                console.log(playerStat.winlose);
            })
        );

        res.json({ status: true, result: playerStats });
    } catch (error) {
        console.error("Failed to fetch player stats:", error);
        res.status(400).json({ status: false });
        throw error;
    }
});

router.get("/members", async (req, res) => {
    const agent = process.env.AWC_AGENT_ID;
    const members = await User.find({ platform: agent });

    res.json({ status: true, result: members });
});

router.post("/change-password", auth, async (req, res) => {
    try {
        const agent = req.user.platform; // Get the platform of the authenticated user (assuming it's the agent)
        const { selectedPlayerId, newPassword } = req.body; // Extract selectedPlayerId and newPassword from request body
        // Update the password for the selected player

        const salt = await bcrypt.genSalt(10);
        const updatedPassword = await bcrypt.hash(newPassword, salt);

        console.log({ updatedPassword, newPassword });

        const player = await User.findByIdAndUpdate(
            selectedPlayerId,
            {
                rpwd: newPassword,
                password: updatedPassword,
            },
            { new: true }
        );

        if (!player) {
            res.json({ status: false });
        }

        res.json({ status: true });
    } catch (error) {
        console.error("Error changing password:", error);
        res.json({ status: false });
    }
});

module.exports = router;
