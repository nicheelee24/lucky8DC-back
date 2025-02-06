const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("../../models/User");
const Game = require("../../models/Game");

const upload = multer({
    dest: "upload/",
    // you might also want to set some limits: https://github.com/expressjs/multer#limits
});

// @route    POST api/game
// @desc     Save a new Game
// @access   Private
router.post("/", [upload.single("file")], async (req, res) => {
    try {
        console.log(req.file.path);
        const tempPath = req.file.path;
        // const tempPath = path.join(__dirname, "../../" + req.file.path);
        const targetPath = path.join(
            __dirname,
            "../../public/images/" + req.file.originalname
        );
        fs.rename(tempPath, targetPath, async (err) => {
            if (err) {
                console.log(err);
                return res
                    .status(500)
                    .contentType("text/plain")
                    .end("Oops! Something went wrong!");
            }
            const { gameCode, gameType, platform, gameName } = req.body;
            let game = new Game({
                gameCode,
                gameType,
                gameName,
                platform,
                img: req.file.originalname,
                isDelete: false,
            });
            game.save()
                .then((res) => {
                    console.log(res);
                })
                .catch((err) => {
                    console.log(err);
                });
            res.json({ status: "0000", game });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    GET api/game
// @desc     Get game list
// @access   Public
router.get("/", async (req, res) => {
    try {
        let games = await Game.find({
            platform: "PG",
            isDelete: { $ne: true },
        }).limit(50);
        res.json({ status: "0000", games });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    GET api/game
// @desc     Get new game list
// @access   Public
router.get("/new", async (req, res) => {
    try {
        let games = await Game.find({
            gameType: "THAI",
            isDelete: { $ne: true },
        })
            .sort({ date: -1, gameCode: 1 })
            .limit(10);
        res.json({ status: "0000", games });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    GET api/game
// @desc     Get game list randomly
// @access   Public
router.get("/random", async (req, res) => {
    try {
        const { gameType } = req.query;
        let filterOptions = {
            isDelete: { $ne: true },
        };

        let games = [];

        if (gameType !== "ALL") {
            filterOptions.gameType = gameType;
        }

        if (gameType == "LIVE") filterOptions.platform = "EVOLUTION";

        games = await Game.aggregate([
            { $match: filterOptions },
            { $sample: { size: 10 } },
        ]);

        res.json({ status: "0000", games });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    GET api/game
// @desc     Get game list with gameType and platform
// @access   Public
router.get("/:page", async (req, res) => {
    try {
        const { page } = req.params;
        const { limit, gameType, platform } = req.query;
        let filterOptions = {
            isDelete: { $ne: true },
        };

        if (gameType !== "ALL") filterOptions.gameType = gameType;
        if (platform !== "ALL") filterOptions.platform = platform;

        let games = await Game.find(filterOptions)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec(); // Added exec() for better practice

        res.json({ status: "0000", games });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    GET api/game/:gameType/:platform
// @desc     Get game list by gameType and platform
// @access   Public
// router.get('/filter/:gameType/:platform', async (req, res) => {
//     try {
//         const games = await Game.find({gameType: req.params.gameType, platform: req.params.platform});
//         res.json({status: "0000", games});
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

async function loginToSBO(username) {
    // {
    //     "Username" : "34534534",
    //     "Portfolio" : "SportsBook",
    //     "IsWapSports": false,
    //     "CompanyKey": "BBF0EE16CE064E1891344266F2C06F16",
    //     "ServerId": "login-player"
    // }
    var options = {
        method: "POST",
        url: process.env.SBO_BASE_URL + "web-root/restricted/player/login.aspx",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        data: {
            Username: username,
            Portfolio: "SportsBook",
            IsWapSports: false,
            CompanyKey: process.env.SBO_COMPANY_KEY,
            ServerId: "login-player",
        },
    };

    console.log(options);

    try {
        const response = await axios.request(options);
        console.log("sbo response-", response.data);
        return response.data;
    } catch (error) {
        console.error("auth~~~request~~~: " + error);
        throw error; // or return an error object
    }
}

// @route    GET api/game/play
// @desc     Get session_url by game_code
// @access   Private
router.get("/play/:id", auth, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        const user = await User.findById(req.user.id).select("-password");
        let balance = user.balance;
       
        let betLimit = {};
        let hall = null;
        let autoBetMode = null;
        let enableTable = null;
        let tid = null;

        if (game.platform != "SBO") {
            if (game.platform == "SEXYBCRT") {
                hall = "SEXY";
                autoBetMode = "1";
                enableTable = "true";
                switch (game.gameName.toLowerCase().replace(/\s/g, "")) {
                    case "baccarrtclassic":
                        tid = "1";
                        break;
                    case "baccaratinsurance":
                        tid = "21";
                        break;
                    case "dragontiger":
                        tid = "31";
                        break;
                    case "roulette":
                        tid = "31";
                        break;
                    case "rbsicbo":
                        tid = "56";
                        break;
                    case "thaihi-lo":
                        tid = "121";
                        break;
                    case "thaifishprawncrab":
                        tid = "126";
                        break;
                    case "extraandarbahar":
                        tid = "101";
                        break;
                    case "extrasicbo":
                        tid = "131";
                        break;
                    case "teenpatti2020":
                        tid = "81";
                        break;
                    case "sedie":
                        tid = "151";
                        break;
                    default:
                        break;
                }
            }

            if (game.platform == "VENUS") {
                autoBetMode = "1";
                enableTable = "true";
                switch (game.gameName.toLowerCase().replace(/\s/g, "")) {
                    case "baccaratspeed":
                        tid = "1";
                        break;
                    case "baccaratspeedy":
                        tid = "1";
                        break;
                    case "baccarrtclassic":
                        tid = "2";
                        break;
                    case "baccaratinsurance":
                        tid = "21";
                        break;
                    case "dragontiger":
                        tid = "31";
                        break;
                    case "sicbo":
                        tid = "51";
                        break;
                    case "fishprawncrab":
                        tid = "61";
                        break;
                    case "roulette":
                        tid = "71";
                        break;
                    default:
                        break;
                }
            }

            if (game.platform == "PT" || game.platform == "PP") {
                enableTable = "true";
            }

            if (game.platform == "HORSEBOOK") {
                game.gameType = "LIVE";
                betLimit = {
                    HORSEBOOK: {
                        LIVE: {
                            minorMaxbet: 5000,
                            minorMinbet: 50,
                            minorMaxBetSumPerHorse: 15000,
                            maxbet: 5000,
                            minbet: 50,
                            maxBetSumPerHorse: 30000,
                            fare: 50,
                        },
                    },
                };
            }

            if (game.gameType == "LIVE") {
                if (game.platform == "PP") {
                    betLimit = {
                        PP: {
                            LIVE: {
                                limitId: ["G1"],
                            },
                        },
                    };
                }
                if (game.platform == "SEXYBCRT") {
                    betLimit = {
                        SEXYBCRT: {
                            LIVE: {
                                limitId: [280901, 280903, 280904],
                            },
                        },
                    };
                }
                if (game.platform == "SV388") {
                    betLimit = {
                        SV388: {
                            LIVE: {
                                maxbet: 10000,
                                minbet: 1,
                                mindraw: 1,
                                matchlimit: 20000,
                                maxdraw: 4000,
                            },
                        },
                    };
                }
                if (game.platform == "VENUS") {
                    betLimit = {
                        VENUS: {
                            LIVE: {
                                limitId: [280902, 280903],
                            },
                        },
                    };
                }
            }

            console.log(game.gameName);
            if (game.platform == "SEXYBCRT") {
                switch (game.gameName.toLowerCase().replace(/\s/g, "")) {
                    case "baccarat":
                    case "baccaratclassic":
                        tid = 1;
                        break;
                    case "dragontiger":
                        tid = 31;
                        break;
                    case "roulette":
                        tid = 71;
                        break;
                    case "redblueduel":
                    case "rbsicbo":
                        tid = 56;
                        break;
                    case "thaihilo":
                        tid = 121;
                        break;
                    case "thaifishprawncrab":
                        tid = 126;
                        break;
                    case "extraandarbahar":
                        tid = 101;
                        break;
                    case "extrasicbo":
                        tid = 131;
                        break;
                    case "teenpatti2020":
                        tid = 81;
                        break;
                    case "sedie":
                        tid = 151;
                        break;
                    default:
                        break;
                }
            }

            // console.log("gamename-------", game.gameName.toLowerCase().replace(/\s/g, ""));
            // console.log("platform--------", game.platform)
            // console.log("tid-----------", tid)

            var options = {};

            if (
                game.gameCode == "JILI-SLOT-033" ||
                game.gameCode == "JILI-SLOT-034" ||
                game.gameCode == "JILI-SLOT-035" ||
                game.gameCode == "JILI-SLOT-036"
            ) {
                const updatedGameType =
                    game.gameType === "THAI" &&
                    game.gameCode.startsWith("LUCKYPOKER-")
                        ? "TABLE"
                        : game.gameType === "THAI" &&
                          (game.gameCode.startsWith("DRAGOONSOFT-") ||
                              game.gameCode.startsWith("KM-") ||
                              game.gameCode.startsWith("JDB-") ||
                              game.gameCode.startsWith("PP-") ||
                              game.gameCode.startsWith("PT-") ||
                              game.gameCode.startsWith("YL-"))
                        ? "SLOT"
                        : game.gameType;

                options = {
                    method: "POST",
                    url: process.env.AWC_HOST + "/wallet/login",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                    },
                    data: {
                        cert: process.env.AWC_CERT,
                        agentId: process.env.AWC_AGENT_ID,
                        userId: user.name,
                        isMobileLogin: "false",
                        externalURL: process.env.FRONTEND_URL,
                        platform: game.platform,
                        gameType: updatedGameType,
                        language: "en",
                        betLimit: JSON.stringify(betLimit),
                        autoBetMode,
                    },
                };
            } else {
                const updatedGameType =
                    game.gameType === "THAI" &&
                    game.gameCode.startsWith("LUCKYPOKER-")
                        ? "TABLE"
                        : game.gameType === "THAI" &&
                          (game.gameCode.startsWith("DRAGOONSOFT-") ||
                              game.gameCode.startsWith("KM-") ||
                              game.gameCode.startsWith("JDB-") ||
                              game.gameCode.startsWith("PP-") ||
                              game.gameCode.startsWith("PT-") ||
                              game.gameCode.startsWith("YL-"))
                        ? "SLOT"
                        : game.gameType;
                options = {
                    method: "POST",
                    url: process.env.AWC_HOST + "/wallet/doLoginAndLaunchGame",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                    },
                    data: {
                        cert: process.env.AWC_CERT,
                        agentId: process.env.AWC_AGENT_ID,
                        userId: user.name,
                        isMobileLogin: "false",
                        externalURL: process.env.FRONTEND_URL,
                        platform: game.platform,
                        gameType: updatedGameType,
                        gameCode: game.gameCode,
                        language: "en",
                        hall,
                        betLimit: JSON.stringify(betLimit),
                        autoBetMode,
                        isLaunchGameTable: enableTable,
                        gameTableId: tid,
                    },
                };
            }

            console.log(options.data);

            await axios
                .request(options)
                .then(function (response) {
                    console.log("response.data===", response.data);
                    if (response.data.status == "0000" && balance>0) {
                        res.json({
                            status: "0000",
                            session_url: response.data.url,
                        });
                    } 
                    else if(balance<=0){
                        res.json({
                            status: "-1",
                            desc: "Your Balance is 0. Please make deposit first.",
                        });
                    }
                    else {
                        res.json({
                            status: response.data.status,
                            desc: response.data.desc,
                        });
                    }
                })
                .catch(function (error) {
                    console.error(error);
                });
        } else if (game.platform == "SBO") {
            const user = await User.findById(req.user.id).select("-password");
            const resp_sbo = await loginToSBO(user.name);
            if (resp_sbo.error.msg == "No Error")
                res.json({
                    status: "0000",
                    session_url: resp_sbo.url,
                });
            else
                res.json({
                    status: "0001",
                    desc: resp_sbo.error.msg,
                });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route    POST api/game/play
// @desc     Get session_url by game_code
// @access   Private
router.post("/play", auth, async (req, res) => {
    try {
        const { gameCode, gameType, platform, hall, tid } = req.body;
        const user = await User.findById(req.user.id).select("-password");
        const betLimit = {};
        if (gameType == "LIVE") {
            if (platform == "HORSEBOOK") {
                betLimit = {
                    HORSEBOOK: {
                        LIVE: {
                            minorMaxbet: 5000,
                            minorMinbet: 50,
                            minorMaxBetSumPerHorse: 15000,
                            maxbet: 5000,
                            minbet: 50,
                            maxBetSumPerHorse: 30000,
                            fare: 50,
                        },
                    },
                };
            }
            if (platform == "PP") {
                betLimit = {
                    PP: {
                        LIVE: {
                            limitId: ["G1"],
                        },
                    },
                };
            }
            if (platform == "SEXYBCRT") {
                betLimit = {
                    SEXYBCRT: {
                        LIVE: {
                            limitId: [280901, 280903, 280904],
                        },
                    },
                };
            }
            if (platform == "SV388") {
                betLimit = {
                    SV388: {
                        LIVE: {
                            maxbet: 10000,
                            minbet: 1,
                            mindraw: 1,
                            matchlimit: 20000,
                            maxdraw: 4000,
                        },
                    },
                };
            }
            if (platform == "VENUS") {
                betLimit = {
                    VENUS: {
                        LIVE: {
                            limitId: [280902, 280903],
                        },
                    },
                };
            }
        }
        var options = {
            method: "POST",
            url: process.env.AWC_HOST + "/wallet/doLoginAndLaunchGame",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            data: {
                cert: process.env.AWC_CERT,
                agentId: process.env.AWC_AGENT_ID,
                userId: user.name,
                isMobileLogin: "false",
                externalURL: process.env.FRONTEND_URL,
                platform,
                gameType,
                gameCode,
                language: "en",
                hall: hall,
                betLimit: JSON.stringify(betLimit),
                autoBetMode: "1",
                isLaunchGameTable: "true",
                gameTableId: tid,
            },
        };

        console.log(options.data);

        await axios
            .request(options)
            .then(function (response) {
                console.log("response.data===", response.data);
                if (response.data.status == "0000") {
                    res.json({
                        status: "0000",
                        session_url: response.data.url,
                    });
                } else {
                    res.json({
                        status: response.data.status,
                        desc: response.data.desc,
                    });
                }
            })
            .catch(function (error) {
                console.error(error);
            });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
