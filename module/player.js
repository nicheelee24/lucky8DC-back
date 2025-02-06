const Agent = require("../models/Agent");
const Bet = require("../models/Bet");
const User = require("../models/User");
const mongoose = require("mongoose");

const getTotalPlayersCount = async (agentid) => {
    const totalPlayerCount = await User.count({ platform: agentid });
    return totalPlayerCount;
};

const getTotalAgentsCount = async (agentid) => {
    const totalAgentCount = await Agent.count({ parent: agentid });
    return totalAgentCount;
};

const getNewEnteringCustomers = async (agentid, startDate, endDate) => {
    const newUsers = await User.find({
        platform: agentid,
        date: { $gte: startDate, $lte: endDate },
    }).select([
        "_id",
        "name",
        "phone",
        "balance",
        "platform",
        "deptime",
        "origin",
        "date",
    ]);

    return newUsers;
};

const getWinLoseByPlayerPhone = async (agentid, startDate, endDate, phone) => {
    try {
        const results = await Bet.aggregate([
            {
                $match: {
                    // platform: mongoose.Types.ObjectId(agentid), // Assuming agent is stored as ObjectId
                    userId: phone, // Assuming phone is the correct identifier for userId
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                },
            },
            {
                $group: {
                    _id: "$userId",
                    totalWinLose: {
                        $sum: {
                            $subtract: ["$betAmount", "$winAmount"],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    totalWinLose: 1,
                },
            },
        ]);

        // Assuming you want to return the result for a single phone,
        // and results array will have one element since we group by userId
        if (results.length > 0) {
            return results[0].totalWinLose;
        } else {
            return 0; // Return 0 if no records found
        }
    } catch (error) {
        console.error("Error in getWinLoseByPlayerPhone: ", error);
        throw error; // Propagate the error
    }
};

module.exports = {
    getTotalPlayersCount,
    getTotalAgentsCount,
    getNewEnteringCustomers,
    getWinLoseByPlayerPhone,
};
