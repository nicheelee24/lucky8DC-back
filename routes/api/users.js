const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const normalize = require("normalize-url");
const axios = require("axios");

const User = require("../../models/User");
const Agent = require("../../models/Agent");
const auth = require("../../middleware/auth");

// @route    POST api/users
// @desc     Register User to AWC
// @access   Public
router.post(
    "/",
    // check('name', 'Name is required').notEmpty(),
    // check('email', 'Please include a valid email').isEmail(),
    check("phone", "Please include a valid phone").isMobilePhone(),
    check(
        "password",
        "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { phone, password, bban, bbun, bbn, platform, promotionId } = req.body;
        console.log("phone.."+phone);
        console.log("platform.."+platform);
        try {
            // Check existing in the local database
            console.log("checking user..");
            let user = await User.findOne({ phone });

            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: "User already exists" }] });
            }

            const avatar = normalize(
                gravatar.url(phone, {
                    s: "200",
                    r: "pg",
                    d: "mm",
                }),
                { forceHttps: true }
            );

            // user = new User({
            //     name: email.split("@")[0],
            //     email,
            //     avatar,
            //     password
            // });

            const agent = await Agent.findOne({ agentid: platform }).select(
                "prefix"
            );
            console.log("prefix data..");
            console.log("agents data.."+agent);
            console.log(agent["prefix"]);
            console.log("after prefix data..");
            let isPromotionId = (promotionId == "") ? null : promotionId;
            user = new User({
                name: agent["prefix"] + phone.replace(/\s+/g, ""),
                isPromotionId,
                phone,
                avatar,
                password,
                rpwd: password,
                bban,
                bbun,
                bbn,
                platform, // dotbet, luckygao lucky888 ... ... ...
                origin: "web",
                deptime: 0,
                status:"Active"
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
console.log("user password.."+user.password);
            var options = {
                method: "POST",
                url: process.env.AWC_HOST + "/wallet/createMember",
                headers: {
                    "content-type": "application/x-www-form-urlencoded",
                },
                data: {
                    cert: process.env.AWC_CERT,
                    agentId: process.env.AWC_AGENT_ID,
                    userId: user.name,
                    currency: "THB",
                    betLimit: JSON.stringify({
                        // "BG": {
                        //     "LIVE": {
                        //         "limitId": ["H4","J4","H7","N1","I"]
                        //     }
                        // },
                        HORSEBOOK: {
                            LIVE: {
                                minbet: 50,
                                maxbet: 5000,
                                maxBetSumPerHorse: 30000,
                                minorMinbet: 50,
                                minorMaxbet: 5000,
                                minorMaxBetSumPerHorse: 15000,
                                fare: 50,
                            },
                        },
                        // "HOTROAD": {
                        //     "LIVE": {
                        //         "limitId": [900006,900007]
                        //     }
                        // },
                        PP: {
                            LIVE: {
                                limitId: ["G1"],
                            },
                        },
                        SEXYBCRT: {
                            LIVE: {
                                limitId: [280901, 280903, 280904], // [110901,110902]
                            },
                        },
                        SV388: {
                            LIVE: {
                                maxbet: 10000, // 1000,
                                minbet: 1,
                                mindraw: 1,
                                matchlimit: 20000, // 1000,
                                maxdraw: 4000, // 100
                            },
                        },
                        // VENUS: {
                        //     LIVE: {
                        //         limitId: [280902, 280903], // [110901,110902]
                        //     },
                        // },
                    }),
                    language: "en",
                    userName: user.name,
                },
            };
            // console.log('options: ' + options.url)
            axios
                .request(options)
                .then(async (response) => {
                    if (response.data.status == "0000") {
                        await user.save();
                        res.json({ status: "0000", desc: response.data.desc });
                    } else {
                        res.json({
                            status: response.data.status,
                            desc: response.data.desc,
                        });
                    }
                })
                .catch(function (error) {
                    console.log("error.."+error);
                });
        } catch (err) {
            console.log("error.."+err.message);
            res.status(500).send("Server error");
        }
    }
);

router.post("/change-password", auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    console.log(req.body);
    try {
        // Get the user from the database
        const user = await User.findById(req.user.id);

        // Check if the current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password in the database
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "An error occurred while changing the password",
        });
    }
});

module.exports = router;
