const Bet = require("../models/Bet");
const User = require("../models/User");

const getRegistrationAndFirstDepositCounts = async (
    agent,
    startDate,
    endDate
) => {
    return User.aggregate([
        {
            $match: {
                platform: agent, // Only include documents where platform is "agent"
                date: { $gte: new Date(startDate), $lte: new Date(endDate) },
            },
        },
        {
            $lookup: {
                from: "transactions",
                let: { userId: "$_id", registrationDate: "$date" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$userid", "$$userId"] },
                                    { $eq: ["$type", "deposit"] },
                                    { $eq: ["$status", "PAID"] },
                                ],
                            },
                        },
                    },
                    { $sort: { date: 1 } }, // Ensure we're considering the first deposit
                    { $limit: 1 },
                    {
                        $project: {
                            isOnRegistrationDay: {
                                $eq: [
                                    {
                                        $dateToString: {
                                            format: "%Y-%m-%d",
                                            date: "$date",
                                        },
                                    },
                                    {
                                        $dateToString: {
                                            format: "%Y-%m-%d",
                                            date: "$$registrationDate",
                                        },
                                    },
                                ],
                            },
                        },
                    },
                ],
                as: "firstDeposit",
            },
        },
        {
            $project: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                isDepositOnRegistrationDay: {
                    $eq: [
                        {
                            $size: {
                                $filter: {
                                    input: "$firstDeposit",
                                    as: "fd",
                                    cond: "$$fd.isOnRegistrationDay",
                                },
                            },
                        },
                        1,
                    ],
                },
            },
        },
        {
            $group: {
                _id: "$date",
                Registered: { $sum: 1 },
                "First Deposit": {
                    $sum: { $cond: ["$isDepositOnRegistrationDay", 1, 0] },
                },
            },
        },
        {
            $project: {
                _id: 0,
                date: "$_id",
                Registered: 1,
                "First Deposit": 1,
            },
        },
        {
            $sort: { date: 1 },
        },
    ]);
};

const getSourcesByOriginAndDate = async (agent, startDate, endDate) => {
    return User.aggregate([
        {
            $match: {
                platform: agent, // Only include documents where platform is "agent"
                date: { $gte: new Date(startDate), $lte: new Date(endDate) },
            },
        },
        {
            $project: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, // Convert date to string format
                origin: 1, // Keep the origin field for grouping
            },
        },
        {
            $group: {
                _id: "$date",
                web: {
                    $sum: {
                        $cond: [{ $eq: ["$origin", "web"] }, 1, 0],
                    },
                },
                app: {
                    $sum: {
                        $cond: [{ $eq: ["$origin", "app"] }, 1, 0],
                    },
                },
                affiliate: {
                    $sum: {
                        $cond: [{ $eq: ["$origin", "affiliate"] }, 1, 0],
                    },
                },
            },
        },
        {
            $sort: { _id: 1 }, // Sort by date in ascending order
        },
        {
            $project: {
                _id: 0,
                date: "$_id",
                web: 1,
                app: 1,
                affiliate: 1,
            },
        },
    ]);
};

const getWinLossData = async (agent, startDate, endDate) => {
    return Bet.aggregate([
        {
            $match: {
                action: {
                    $in: ["settle", "betNSettle"],
                },
                date: { $gte: new Date(startDate), $lte: new Date(endDate) },
            },
        },
        {
            $group: {
                _id: {
                    userid: "$userId",
                    platform: "$platform",
                    type: "$gameType",
                },
                betCount: {
                    $sum: 1,
                },
                validTurnover: {
                    $sum: "$turnover",
                },
                betAmount: {
                    $sum: "$betAmount",
                },
                totalBet: {
                    $sum: "$betAmount",
                },
                playerWinLoss: {
                    $sum: {
                        $subtract: ["$betAmount", "$winAmount"],
                    },
                },
                playerAdjustment: {
                    // check again
                    $sum: 0,
                },
                playerTotalPL: {
                    // check again --->>>  playerWinLoss + playerAdjustment
                    $sum: {
                        $subtract: ["$betAmount", "$winAmount"],
                    },
                },
            },
        },
    ]);
};

module.exports = {
    getRegistrationAndFirstDepositCounts,
    getSourcesByOriginAndDate,
    getWinLossData,
};
