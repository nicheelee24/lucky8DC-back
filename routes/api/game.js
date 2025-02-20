const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { platform } = require("os");

const User = require("../../models/User");
const Game = require("../../models/Game");

const upload = multer({
    dest: "upload/",
    // you might also want to set some limits: https://github.com/expressjs/multer#limits
});

router.post("/addNewGame", async (req, res) => {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
		const date = new Date();
		const todayDateTime = formatter.format(date).replace(/\//g, '');
       
            const { gameCode, gameType, platform, gameName } = req.body;
            let game = new Game({
                gameCode,
                gameType,
                gameName,
                platform,
                img: gameCode+'.png',
               date:date
            });
            game.save()
                .then((res) => {
                    console.log(res);
                })
                .catch((err) => {
                    console.log(err);
                });
            res.json({ status: "0000", game });
        }
     catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
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

        const brand_id=process.env.BRAND_ID;
        const brand_uid=user.name;
        const api_key=process.env.KEY_ID;
        const HASH = brand_id+brand_uid+api_key;
        const hashh = require('crypto').createHash('md5').update(HASH).digest('hex').toString().toUpperCase();
       
        console.log(game.platform);
        console.log("playyyyyyyyyyyyyyy//iddd");

        if (game.platform == "NetEnt" || game.platform == "Red Tiger" || game.platform == "Blueprint" || game.platform == "Thunder Kick" || game.platform == "BGaming" || game.platform == "Ezugi" || game.platform == "Yolted" || game.platform == "Win Fast" || game.platform == "SA Gaming" || game.platform == "Evolution" || game.platform == "7Mojos" || game.platform == "AvatarUX" || game.platform=="Peter Sons" || game.platform=="FunTa Gaming" || game.platform=="Evoplay" || game.platform == "Hacksaw Gaming" || game.platform == "Nolimit City" ||  game.platform == "Relax Gaming" || game.platform == "Slotmill" || game.platform == "Yggdrasil Gaming" || game.platform=="Play'n GO" || game.platform=="Turbo Games (Asia)" || game.platform=="SmartSoft") {
            
            var options = {
                method: "POST",
                url: process.env.DCT_BASE_URL + "/dct/loginGame",
                headers: { "content-type": "application/json" },
                data: {
                    brand_id: brand_id,
                    sign: hashh,
                    brand_uid: brand_uid,
                    game_id: game.gameCode,
                    currency: 'THB',
                    language: "en",
                    channel: 'pc',
                    country_code:'TH'
                   
                },
            };
    
            console.log(options.data);

            await axios
            .request(options)
            .then(function (response) {
                console.log("DCT response.data===", response.data);
                console.log("DCT response.code===", response.data.data);
                if (response.data.code == "1000") {
                    res.json({
                        status: "0000",
                        session_url: response.data.data.game_url,
                    });
                } else {
                    res.json({
                        status: response.data.code,
                        desc: response.data.msg,
                    });
                }
            })
            .catch(function (error) {
                console.error(error);
            });





          
            
          
           
            
                       

            
        }
    }
        
     catch (err) {
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
        if(platform!='yg')
        {
           
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
        }
       
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error in game play");
    }

});

module.exports = router;
