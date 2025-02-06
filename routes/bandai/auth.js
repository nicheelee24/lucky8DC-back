const express = require("express");
const Agent = require("../../models/Agent");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.get("/test", async (req, res) => {
    res.json("success");
});

router.post("/signin", async (req, res) => {
    const { username, password } = req.body;

    const agent = await Agent.findOne({
        userid: username,
        pwd: password,
    });

    let payload = {};

    if (agent) {
        payload = {
            user: {
                id: agent.userid,
                username: agent.agentid,
                agentid: agent.agentid,
                platform: agent.platform,
                percentage: agent.percentage,
                parent: agent.parent,
            },
        };
    }

    const token = jwt.sign(payload, '123123123333', {
        expiresIn: "5 days",
    });

    const role = "admin";

    const result = {
        token: token,
        id: agent.userid,
        agentid: agent.agentid,
        platform: agent.platform,
        percentage: agent.percentage,
        parent: agent.parent,
        username: username,
        role: "admin",
    };

    if (agent) res.json({ status: true, result });
    else res.status(404).json({ status: false, message: "Sign In Failed." });
});

router.post("/signout", async (req, res) => {
    res.json({ status: true, result: { token: "123123123" } });
});

module.exports = router;
