const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const { getIo } = require('../../socketManager');
// const Agent = require("../../models/Agent");
const User = require("../../models/User");
const Promotion = require("../../models/Promotion");
const Bonus = require("../../models/Bonus");
const Bet = require("../../models/Bet");
const moment = require('moment');

const promotionAllPermissions = ["All","newcust","oldcust","topupBonus","forFirstDeposit","autoBonus","deleteProm","hideProm"];

router.post("/", async (req, res) => {
	const { promotion_id, user_id } = req.body;

	try {
		// Get the user from the database
		const user = await User.findById(user_id);
		//console.log("save promotion user data...."+user);
		if (promotion_id) {
			// get details user current promotion
			const promotionInfo = await Promotion.findById(promotion_id)
			const userPromotionInfo = await Promotion.findById(user.promotionId)

			let promotionPermissions = promotionInfo.permissions;

			// if user have aready promotion 
			if (userPromotionInfo && userPromotionInfo?.expDate) {

				console.log("user has active promotion...");
				const expDateString = userPromotionInfo.expDate;
				const [day, month, year] = expDateString.split('-');
				const formattedDateString = `${year}-${month}-${day}`;

				const expDateTimeStamp = new Date(formattedDateString).getTime();

				const currentDate = new Date();
				const currentDay = String(currentDate.getDate()).padStart(2, '0');  // Ensure day is 2 digits
				const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');  // getMonth() is 0-based
				const currentYear = currentDate.getFullYear();
				const currentFormattedDateString = `${currentYear}-${currentMonth}-${currentDay}`;

				const currentDateTimeStamp = new Date(currentFormattedDateString).getTime();
				checkUserPlanExpire = expDateTimeStamp >= currentDateTimeStamp;

				const expDateStringNewPro = promotionInfo.expDate;
				const [dayNewPro, monthNewPro, yearNewPro] = expDateStringNewPro.split('-');
				const formattedDateStringNewPro = `${yearNewPro}-${monthNewPro}-${dayNewPro}`;

				const expDateTimeStampNewPro = new Date(formattedDateStringNewPro).getTime();
				checkNewPlanExpire = expDateTimeStampNewPro >= currentDateTimeStamp


				console.log("checkUserPlanExpire", checkUserPlanExpire);
				console.log("checkNewPlanExpire", checkNewPlanExpire);

				if (!checkUserPlanExpire && !checkNewPlanExpire) {
					res.json({
						status: 200, res: "warning", msg: "This Promotion Expired", data: {
							"expDate": expDateTimeStampNewPro,
							"currentDate": currentFormattedDateString
						}
					});
				} else {
					if (user.promotionId == promotion_id && checkUserPlanExpire) {
						res.json({
							status: 200, res: "warning", msg: "This Promotion already added In your Account", data: {
								"expDate": expDateTimeStampNewPro,
								"currentDate": currentFormattedDateString
							}
						});
					}
					else if (user.promotionId != promotion_id && checkUserPlanExpire) {
						res.json({
							status: 200, res: "warning", msg: "You have already active Promotion In your Account", data: {
								"expDate": expDateTimeStampNewPro,
								"currentDate": currentFormattedDateString
							}
						});
					}
					else {
						console.log("no promotion added yet.....");
						let highestPercent = promotionInfo.highestPercent;
						let bonusAmnt = promotionInfo.bonusAmnt;
						let depositAmnt = promotionInfo.depositAmnt;
						let userBalance = user.balance;
						let calculateDiscount = 0;
						if (highestPercent && highestPercent > 0) {
							calculateDiscount = depositAmnt * bonusAmnt / 100;
						} else {
							calculateDiscount = bonusAmnt;
						}
						// console.log("check-->",promotionPermissions.includes("forFirstDeposit"));
						if (userBalance >= depositAmnt || (promotionPermissions.includes("forFirstDeposit") || promotionPermissions.includes("autoBonus") || promotionPermissions.includes("deleteProm"))) {
							userBalance = userBalance + calculateDiscount;
							// Update the user's Promotion in the database
							user.promotionId = promotion_id;
							if((!promotionPermissions.includes("forFirstDeposit") && !promotionPermissions.includes("autoBonus"))) {
								// add entry in the bonus table 
								result = await Bet.aggregate([
									{
										$match: {
											userId: user.name,
											// action: { $in: ["bet", "betNSettle"] }, // Filters documents to include only those where action is either 'bet' or 'betNSettle'
										},
									},
									{
										$group: {
											_id: null, // Grouping by null means aggregating all documents together
											totalBetAmount: { $sum: "$turnover" }, // Sums up all betAmount values
										},
									},
								]);
								let totalBetAmount = 0;
								if (result.length > 0) {
									totalBetAmount = result[0].totalBetAmount;
								}
								let bonusEntity = new Bonus({
									username:user.name,
									userid: user._id,
									promotionId: promotion_id,
									//bonusType: promotionInfo.bonusType,
									quantity: 1,
									topUp: calculateDiscount,
									cashBalanceFirst: user.balance,
									cashBalanceAfter: userBalance,
									turnover:totalBetAmount - promotionInfo.depositAmnt
								});
								bonusEntity.save();
								// end code 
								user.balance = userBalance;
							}
							await user.save();
							res.json({
								status: 200, res: "sucess", msg: "That promotion applied successfully!", data: {
									"promotionInfo": promotionInfo,
									"expDate": expDateTimeStampNewPro,
									"currentDate": currentFormattedDateString
								}
							});
						} else {
							res.json({
								status: 200, res: "warning", msg: "You do not have enough balance to redeem this promotion", data: {
									"promotionInfo": promotionInfo,
									"expDate": expDateTimeStampNewPro,
									"currentDate": currentFormattedDateString
								}
							});
						}
					}
				}

			} else {
				// if user have no promotion 
				console.log("no promotion added yet.....");
				let highestPercent = promotionInfo.highestPercent;
				let bonusAmnt = promotionInfo.bonusAmnt;
				let depositAmnt = promotionInfo.depositAmnt;
				let userBalance = user.balance;
				let calculateDiscount = 0;
				if (highestPercent && highestPercent > 0) {
					calculateDiscount = depositAmnt * bonusAmnt / 100;
				} else {
					calculateDiscount = bonusAmnt;
				}
				if (userBalance >= depositAmnt || (promotionPermissions.includes("forFirstDeposit") || promotionPermissions.includes("autoBonus") || promotionPermissions.includes("deleteProm"))) {
					userBalance = userBalance + calculateDiscount;
					// Update the user's Promotion in the database
					user.promotionId = promotion_id;
					console.log("promotion id added to user table.....");
					
						// add entry in the bonus table 
						result = await Bet.aggregate([
							{
								$match: {
									userId: user.name,
									// action: { $in: ["bet", "betNSettle"] }, // Filters documents to include only those where action is either 'bet' or 'betNSettle'
								},
							},
							{
								$group: {
									_id: null, // Grouping by null means aggregating all documents together
									totalBetAmount: { $sum: "$turnover" }, // Sums up all betAmount values
								},
							},
						]);
						let totalBetAmount = 0;
						if (result.length > 0) {
							totalBetAmount = result[0].totalBetAmount;
						}
						let bonusEntity = new Bonus({
							username:user.name,
							userid: user._id,
							promotionId: promotion_id,
							//bonusType: promotionInfo.bonusType,
							quantity: 1,
							topUp: calculateDiscount,
							cashBalanceFirst: user.balance,
							cashBalanceAfter: userBalance,
							turnover:totalBetAmount - promotionInfo.depositAmnt
						});
						bonusEntity.save();
						console.log("bonus data saved..");
						// end code 
						user.balance = userBalance;
					
					
					await user.save();
					res.json({
						status: 200, res: "sucess", msg: "That promotion applied successfully!", data: {
							"promotionInfo": promotionInfo,
						}
					});
				} else {
					res.json({
						status: 200, res: "warning", msg: "You do not have enough balance to redeem this promotion", data: {
							"promotionInfo": promotionInfo,
						}
					});
				}

			}




		}
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

module.exports = router;
