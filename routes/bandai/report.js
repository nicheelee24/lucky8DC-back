const express = require("express");
const {
    getTotalTransactionSummary,
    getTodayTransactionSummary,
    getTransactionsSummaryByDate,
    getNewEnteringCustomersSummary,
} = require("../../module/transaction");
const {
    getTotalAgentsCount,
    getTotalPlayersCount,
} = require("../../module/player");
const bandaiAuth = require("../../middleware/bandai-auth");
const {
    getRegistrationAndFirstDepositCounts,
    getSourcesByOriginAndDate,
    getWinLossData,
} = require("../../module/report");
const Bet = require("../../models/Bet");
const Agent = require("../../models/Agent");
const router = express.Router();
// const todayDepositAmount = require('../../module/transaction');

/*
In Dashboard
Today Deposit Amount
Today Withdrawl Amount
Total Deposit Amount
Total Withdrawl Amount

Total Players
Total Agents

Number of Agents
Agents
*/
router.post("/overview", bandaiAuth, async (req, res) => {
    const { startDate, endDate } = req.body;
    const agent = req.user.platform; // agentid

    // const filter = {};

    // if (agent != "master") {
    //     filter.parent = agent;
    // }

    const agents = await Agent.find({ parent: agent })
        .sort({
            date: -1,
        })
        .select("agentid -_id");

    // ["master", "luckygaoagent", "lucky888"]
    const allowedPlatforms = agents.map((agent) => agent.agentid);
    console.log("allowedPlatforms", allowedPlatforms);
    // allowedPlatforms.push({ agentid: agent });
    allowedPlatforms.push(agent);

    // Total Deposit Amount
    // Total Withdrawl Amount
    const totalSummary = await getTotalTransactionSummary(
        allowedPlatforms,
        startDate,
        endDate
    );

    console.log("totalSummary-----", totalSummary);

    const newEnteringCustomersSummary = await getNewEnteringCustomersSummary(
        agent,
        startDate,
        endDate
    );
    // Total Players
    // Total Agents
    // const totalPlayerCount = await getTotalPlayersCount(agent);
    // const totalAgentCount = await getTotalAgentsCount(agent);
    // totalPlayerCount,
    // totalAgentCount,
    res.json({
        status: true,
        result: {
            newEnteringCustomersCount:
                newEnteringCustomersSummary["newEnteringCustomersCount"],
            firstDepositNewCustomersCount:
                newEnteringCustomersSummary["firstDepositNewCustomersCount"],
            totalDeposit: totalSummary["totalDeposit"],
            totalWithdraw: totalSummary["totalWithdraw"],
            totalProfit:
                Number(totalSummary["totalDeposit"]) -
                Number(totalSummary["totalWithdraw"]),
        },
    });

    // Total new entering customers count
    // First time deposit customers count

    // Total Deposit
    // Total Withdrawl
    // Total Profit = deposit - withdrawl
});

router.post("/player-apply", bandaiAuth, async (req, res) => {
    const agent = req.user.platform;
    const { startDate, endDate } = req.body;

    const result = await getRegistrationAndFirstDepositCounts(
        agent,
        startDate,
        endDate
    );

    res.json({ status: true, result: result });
    // res.json({
    //     status: true,
    //     result: [
    //         {
    //             name: "2024-03-05",
    //             Registered: 10,
    //             "First Deposit": 30,
    //         },
    //     ],
    // });
});

router.post("/source-by-registered", bandaiAuth, async (req, res) => {
    const agent = req.user.platform;
    const { startDate, endDate } = req.body;

    const result = await getSourcesByOriginAndDate(agent, startDate, endDate);

    // console.log(result);

    res.json({
        status: true,
        result: result,
    });
});

router.post("/timeline", bandaiAuth, async (req, res) => {
    // const allowedPlatforms = ["master", "luckygaoagent", "lucky888"];
    const agent = req.user.platform; // agentid
    const agents = await Agent.find({ parent: agent }).select("agentid");

    // ["master", "luckygaoagent", "lucky888"]
    const allowedPlatforms = agents;
    allowedPlatforms.push(agent);

    const { startDate, endDate } = req.body;

    const transactionsByDate = await getTransactionsSummaryByDate(
        allowedPlatforms,
        startDate,
        endDate
    );
    res.json({ status: true, result: transactionsByDate });
});

router.post("/win-loss", async (req, res) => {
    // return value
    /* 
        userid
        username
        platform
        type
        location
        betCount
        validTurnover
        betAmount
        totalBet
        
        playerWinLoss
        playerAdjustment
        playerTotalPL
        playerMargin

        agentPTWinLoss
        agentAdjustment
        agentTotalPL

        masterAgentPTWinLoss
        masterAgentAdjustment
        masterAgentTotalPL

        companyTotalPL
    */

    // In case of master
    // In case of sub agent
    // There are 2 options

    const agent = req.user.platform;
    const { startDate, endDate } = req.body;

    const result = await getWinLossData(agent, startDate, endDate);

    // Destructure the _id field and the rest of the properties
    // const {
    //     _id: { userid, platform, type },
    //     ...rest
    // } = result;

    const newResult = [];
    result.map((item, index) => {
        const {
            _id: { userid, platform, type },
            ...rest
        } = item;

        const modifiedResult = { userid, platform, type, ...rest };

        modifiedResult.playerMargin = (
            modifiedResult.playerTotalPL / modifiedResult.validTurnover
        ).toFixed(2);

        const percentages = 1;

        modifiedResult.agentPTWinLoss =
            modifiedResult.playerWinLoss * percentages;
        modifiedResult.agentAdjustment = 0;
        modifiedResult.agentTotalPL =
            modifiedResult.playerWinLoss * percentages;
        modifiedResult.masterAgentPTWinLoss = 0;
        modifiedResult.masterAgentAdjustment = 0;
        modifiedResult.masterAgentTotalPL = 0;
        modifiedResult.companyTotalPL = 0;
        newResult.push(modifiedResult);
    });

    return res.json({
        status: true,
        result: newResult,
    });
});

router.post("/history/bets", bandaiAuth, async (req, res) => {
    const agent = req.user.platform;
    const { startDate, endDate } = req.body;

    const filter = {
        action: {
            $in: ["betNSettle", "settle"],
        },
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };

    const bets = await Bet.find(filter);

    // userId
    // gameType
    // gameName
    // gameCode
    // platform
    // currency
    // betTime
    // txTime
    // betAmount
    // turnover
    // winAmount
    // action
    // refPlatformTxId
    // settleType

    res.json({ status: true, result: bets });
});

module.exports = router;
