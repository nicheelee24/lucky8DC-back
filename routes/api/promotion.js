const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const { getIo } = require('../../socketManager');

const Promotion = require("../../models/Promotion");
const User = require("../../models/User");

router.get("/getpromotions", async (req, res) => {
    try {
        console.log("req.query", req.query)
        let promotionsList = [];
        if (req.query?.expired == 'false') {
            promotionsList = await Promotion.find({
                $expr: {
                    $gt: [
                        {
                            $dateFromString: {
                                dateString: {
                                    $concat: [
                                        { $substr: ["$expDate", 6, 4] }, "-", // Extract and format year
                                        { $substr: ["$expDate", 0, 2] }, "-", // Extract and format month
                                        { $substr: ["$expDate", 3, 2] } 
                                    ]
                                },
                                format: "%Y-%m-%d",
                                onError: null,
                                onNull: null
                            }
                        },
                        {   
                            $dateFromString: {
                                dateString: {
                                    $dateToString: { format: "%Y-%m-%d", date: new Date() }
                                },
                                format: "%Y-%m-%d"
                            }
                        }
                    ]
                }
            });
        } else {
            promotionsList = await Promotion.find({
                agentname: "luckyama",
            }).limit(50);
        }
       // console.log("data....." + promotionsList)
        res.json({ status: "0000", promotionsList });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
module.exports = router;