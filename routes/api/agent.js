const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const { getIo } = require('../../socketManager');
const Agent = require("../../models/Agent");

router.post("/", async (req, res) => {
    const { name, url } = req.body;

    try {
        let agent = new Agent({
            name,
            url,
            platform: name, // Assuming 'platform' is intended to be the same as 'name'
            percentage: 0.0,
        });

        await agent.save();
        res.json(agent);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.get("/", async (req, res) => {
    try {
        const agents = await Agent.find();
        res.json(agents);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.put("/:id", async (req, res) => {
    const { name, url, platform, percentage } = req.body;

    // Build agent object
    const agentFields = {};
    if (name) agentFields.name = name;
    if (url) agentFields.url = url;
    if (platform) agentFields.platform = platform;
    if (percentage) agentFields.percentage = percentage;

    try {
        let agent = await Agent.findById(req.params.id);

        if (!agent) return res.status(404).json({ msg: "Agent not found" });

        agent = await Agent.findByIdAndUpdate(
            req.params.id,
            { $set: agentFields },
            { new: true }
        );

        res.json(agent);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.delete("/:id", async (req, res) => {
    try {
        // Check if the agent exists
        let agent = await Agent.findById(req.params.id);
        if (!agent) return res.status(404).json({ msg: "Agent not found" });

        // Delete the agent
        await Agent.findByIdAndRemove(req.params.id);

        res.json({ msg: "Agent removed" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.put("/revenue-percentage", async (req, res) => {});

module.exports = router;
