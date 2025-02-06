const express = require("express");
const Agent = require("../../models/Agent");
const User = require("../../models/User");
const router = express.Router();
const bandaiAuth = require("../../middleware/bandai-auth");
// Add New Agent
router.post("/", async (req, res) => {
    try {
        const agentData = { ...req.body };
        delete agentData.date; // Remove the date key-value pair

        const agent = new Agent(agentData);

        await agent.save();
        res.json({ status: true, agent, message: "Added agent successfully." });
    } catch (err) {
        console.log(err.message);
        res.status(400).json({ status: false, message: err.message });
    }
});

router.post("/sub-agents", bandaiAuth, async (req, res) => {
    const platform = req.user.platform;
    try {
        const agents = await Agent.find({ parent: platform }).sort({
            date: -1,
        });
        res.json({ status: true, result: agents });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ status: false, message: err.message });
    }
});

// Get All Sub Agents
router.get("/:parent", async (req, res) => {
    try {
        const agents = await Agent.find({ parent: req.params.parent }).sort({
            date: -1,
        });
        res.json({ status: true, result: agents });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ status: false, message: err.message });
    }
});

// Update Agent
router.put("/", async (req, res) => {
    const { agentid, ...updatedAgentData } = req.body;

    delete updatedAgentData.date; // Remove the date key-value pair

    try {
        const agent = await Agent.findOneAndUpdate(
            { agentid },
            updatedAgentData,
            {
                new: true,
            }
        );

        if (agent) {
            res.json({ status: true, agent });
        } else {
            res.status(404).json({
                status: false,
                message: "Agent Not Found!",
            });
        }
    } catch (err) {
        console.error(err);
        res.status(400).json({ status: false, message: err.message });
    }
});

module.exports = router;
