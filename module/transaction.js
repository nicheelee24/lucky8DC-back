const Transaction = require("../models/Transaction");
const { getNewEnteringCustomers } = require("./player");

const getTotalTransactionSummary = async (
    allowedPlatforms,
    startDate,
    endDate
) => {
    // Build the match condition
    const matchCondition = {
        status: "PAID",
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }, // Include date range condition
    };

    console.log({ allowedPlatforms });
    // Include platform condition only if allowedPlatforms is not empty
    if (allowedPlatforms.length > 0) {
        matchCondition.platform = { $in: allowedPlatforms };
    }

    // Aggregation query
    return await Transaction.aggregate([
        {
            $match: matchCondition,
        },
        {
            $group: {
                _id: {}, // _id: { platform: '$platform' },
                totalDeposit: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "deposit"] }, "$payAmount", 0],
                    },
                },
                totalWithdraw: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "withdraw"] },
                            "$payAmount",
                            0,
                        ],
                    },
                },
            },
        },
    ])
        .then((result) => {
            // console.log(result);
            if (result.length === 0) {
                return { _id: {}, totalDeposit: 0, totalWithdraw: 0 };
            }

            return result[0];
        })
        .catch((err) => {
            // console.error(err);
            return err;
        });
};

const getNewEnteringCustomersSummary = async (agentid, startDate, endDate) => {
    const newUsers = await getNewEnteringCustomers(agentid, startDate, endDate);
    const newUserIds = newUsers.map((user) => user._id);

    // Step 2: Count users who made their first deposit within the same date range
    const firstDepositCount = await Transaction.aggregate([
        {
            $match: {
                userid: { $in: newUserIds },
                type: "deposit",
                date: { $gte: new Date(startDate), $lte: new Date(endDate) },
            },
        },
        { $group: { _id: "$userid", firstDepositDate: { $min: "$date" } } },
        {
            $match: {
                firstDepositDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            },
        },
        { $count: "firstDepositCount" },
    ]);

    return {
        newEnteringCustomersCount: newUsers.length,
        firstDepositNewCustomersCount:
            firstDepositCount.length > 0
                ? firstDepositCount[0].firstDepositCount
                : 0,
    };
};

const getTodayTransactionSummary = async (allowedPlatforms) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    console.log(startOfToday, endOfToday);

    // Build the match condition
    const matchCondition = {
        status: "PAID",
        date: { $gte: startOfToday, $lte: endOfToday }, // Filter for today's transactions
    };

    // Include platform condition only if allowedPlatforms is not empty
    if (allowedPlatforms.length > 0) {
        matchCondition.platform = { $in: allowedPlatforms };
    }

    // Aggregation query
    return await Transaction.aggregate([
        {
            $match: matchCondition,
        },
        {
            $group: {
                _id: {}, // _id: { platform: '$platform' },
                totalDeposit: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "deposit"] }, "$payAmount", 0],
                    },
                },
                totalWithdraw: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "withdraw"] },
                            "$payAmount",
                            0,
                        ],
                    },
                },
            },
        },
    ])
        .then((result) => {
            // console.log(result);
            if (result.length === 0) {
                return { _id: {}, totalDeposit: 0, totalWithdraw: 0 };
            }

            return result[0];
        })
        .catch((err) => {
            // console.error(err);
            return err;
        });
};

const getTransactionsSummaryByDate = async (
    allowedPlatforms,
    startDate,
    endDate
) => {
    const summary = await Transaction.aggregate([
        {
            $match: {
                platform: { $in: allowedPlatforms },
                status: "PAID",
                date: { $gte: new Date(startDate), $lte: new Date(endDate) },
            },
        },
        {
            $group: {
                _id: {
                    date: {
                        $dateToString: { format: "%Y-%m-%d", date: "$date" },
                    },
                    type: "$type",
                },
                totalAmount: { $sum: "$payAmount" },
            },
        },
        {
            $group: {
                _id: "$_id.date",
                transactions: {
                    $push: {
                        type: "$_id.type",
                        totalAmount: "$totalAmount",
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
                name: "$_id",
                deposit: {
                    $reduce: {
                        input: "$transactions",
                        initialValue: 0,
                        in: {
                            $cond: [
                                { $eq: ["$$this.type", "deposit"] },
                                { $add: ["$$value", "$$this.totalAmount"] },
                                "$$value",
                            ],
                        },
                    },
                },
                withdrawl: {
                    $reduce: {
                        input: "$transactions",
                        initialValue: 0,
                        in: {
                            $cond: [
                                { $eq: ["$$this.type", "withdraw"] },
                                { $add: ["$$value", "$$this.totalAmount"] },
                                "$$value",
                            ],
                        },
                    },
                },
            },
        },
    ]);

    return summary;
};

module.exports = {
    getTotalTransactionSummary,
    getTodayTransactionSummary,
    getTransactionsSummaryByDate,
    getNewEnteringCustomersSummary,
};
