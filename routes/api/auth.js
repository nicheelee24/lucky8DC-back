const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const auth = require("../../middleware/auth");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const axios = require("axios");

const User = require("../../models/User");

// @route    GET api/auth
// @desc     Get user by token
// @access   Private
router.get("/",auth, async (req, res) => {
    try {
        console.log("auth function called.....");
        const user = await User.findById(req.user.id).select("-password -rpwd");
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// No router
// Member function
async function loginToAWC(user) {
    var options = {
        method: "POST",
        url: process.env.AWC_HOST + "/wallet/login",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        data: {
            cert: process.env.AWC_CERT,
            agentId: process.env.AWC_AGENT_ID,
            userId: user.name,
            isMobileLogin: "false",
            externalURL: process.env.FRONTEND_URL,
            platform: "RT", // 'SEXYBCRT'
            gameType: "SLOT", // 'LIVE'
            gameForbidden: { JDB: { FH: ["ALL"] } },
            language: "en",
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
            autoBetMode: "1",
        },
    };

    try {
        const response = await axios.request(options);

        console.log("user name..."+user.name);
        console.log("agent id..."+process.env.AWC_AGENT_ID);
        if (response.data.status == "0000") {
            const payload = {
                user: {
                    id: user.id,
                },
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "5 days",
            });

            return { status: "0000", token, login_url: response.data.url };
        } else {
            return { status: response.data.status, desc: response.data.desc };
        }
    } catch (error) {
        console.error("auth~~~request~~~: " + error);
        throw error; // or return an error object
    }
}

async function registerToSBO(username, platform) {
    var options = {
        method: "POST",
        url:
            process.env.SBO_BASE_URL +
            "web-root/restricted/player/register-player.aspx",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        data: {
            Username: username,
            UserGroup: "a",
            Agent: platform,
            CompanyKey: process.env.SBO_COMPANY_KEY,
            ServerId: "create-new-player-under-luckygaoagent",
        },
    };

    try {
        const response = await axios.request(options);
        console.log("sbo response-", response.data);
        return response.data;
    } catch (error) {
        console.error("auth~~~requesttttttt~~~: " + error);
        throw error; // or return an error object
    }
}

// @route    POST api/auth
// @desc     Authenticate user & get token
// @access   Public
router.post(
    "/",
    // check('email', 'Please include a valid email').isEmail(),
    check("phone", "Please include a valid phone").isMobilePhone(),
    check("password", "Password is required").exists(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { phone, password } = req.body;

        try {
            let user = await User.findOne({ phone}).populate('promotionId');

            if (!user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: "Invalid Credentials1" }] });
            }
           

           
            const isMatch = await bcrypt.compare(password, user.password);
           // console.log(password, user.password);
            if (!isMatch) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: "Invalid Credentials2" }] });
            }
            const payload = {
                user: {
                    id: user.id,
                },
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "5 days",
            });
            const user_phone=user.phone;

            const promotionData = {};
           
            if (user?.promotionId) {
               // promotionData = user?.promotionId;
            }

            if(user.status!='Active')
                {
                   
                        res.json({ status: "300",msg: "This account has been Restricted. Please contact support." });
                }
                else
                {
                    res.json({ status: "0000", token, user_phn: user_phone, promotion_data: promotionData });
                }

           
            //res.json({ status: "0000", msg: "Login successfully!" });

            // user.platform

            // AWC Login

           // const resp_awc = await loginToAWC(user);
//console.log("after awc response..");

            // register SBO
           await registerToSBO(user.name, 'luckygaoagent');

           // console.log(resp_awc);
           // console.log("after console..log..");

          //  res.json(resp_awc);

            // SBO Login
            // ... ... ...
        } catch (err) {
            console.error("auth~~~tryyyyy~~~: " + err.message);
            res.status(500).send("Server error");
        }
    }
);

// @route    POST api/auth/change-password
// @desc     Change Password
// @access   Private
router.post("/change-password", auth, async (req, res) => {
    const { curPwd, newPwd } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
        return res
            .status(400)
            .json({ errors: [{ msg: "User doesn't exist." }] });
    }

    const isMatch = await bcrypt.compare(curPwd, user.password);
    console.log(curPwd, user.password);
    if (!isMatch) {
        return res
            .status(400)
            .json({ errors: [{ msg: "Current password is incorrect." }] });
    }

    // If curPwd is correct,
    // Update curPwd with newPwd
    try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPwd, salt);
        await user.save();

        res.json({ status: "0000", msg: "Password is updated successfully!" });
    } catch (err) {
        console.log(err);
        return res
            .status(400)
            .json({ errors: [{ msg: "Operation is failed." }] });
    }
});

router.post("/cricket_auth",async(req,res)=>{
    var project_key = 'RS_P_1903421301486391315'
var api_key = 'RS5:6a777955dd8a7fb0490fcd4e3a972c91'
var request = require('request')
var options = {
method: 'POST',
url: `https://api.sports.roanuz.com/v5/core/${project_key}/auth/`,
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify({
api_key: `${api_key}`
})
}
request(options, function (error, response) {
if (error) throw new Error(error)
console.log(response.body)
})

}

)

module.exports = router;
