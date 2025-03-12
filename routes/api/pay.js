const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const { getIo } = require('../../socketManager');

const Transaction = require("../../models/Transaction");
const User = require("../../models/User");
const Promotion = require("../../models/Promotion");
const Bonus = require("../../models/Bonus");
const Bet = require("../../models/Bet");
const Log = require("../../models/Log");
const Bigp = require("../../models/Bigp");
router.post("/smartpay_deposit_callback", auth, async (req, res) => {
	console.log("smartpay callback request" + req)
	console.log("smartpay callback response" + res)

})

router.post("/deposit_dct", auth, async (req, res) => {
	try {

		console.log("deposit function called..");
		const { amount, currency, platform } = req.body;
		const bill_no = require('crypto').randomBytes(10).toString('hex');
		const brand_id = process.env.BRAND_ID;

		//console.log(bill_no);
		console.log("before user" + req.body);
		// const phn=  window.localStorage.setItem("phn", response.data.user_phn);
		// console.log("Phnnnn"+phn);
		const user = await User.findById(req.user.id).select("-password");

		const brand_uid = user.name;
		const dct_key = process.env.KEY_ID;
		const HASH = brand_id + brand_uid + dct_key;
		const hashh = require('crypto').createHash('md5').update(HASH).digest('hex').toString().toUpperCase();
		//console.log("hassshh value.."+hashh);
		const DEPOSIT_URL = `${process.env.PMG_BASE_URL}/api/v1/Payment/Deposit`;
		const DEPOSIT_URL_DCT = `${process.env.DCT_BASE_URL}/dct/credit`;

		await axios
			.post(
				DEPOSIT_URL_DCT,
				{
					// --- BANK API PARAMS ---
					// clientCode: process.env.CLIENT_CODE,
					// memberFlag: user.name,
					// amount: amount,

					// --- DCT CREDIT API PARAMS ---
					brand_id: process.env.BRAND_ID,
					sign: hashh,
					brand_uid: user.name,
					amount: amount,
					bill_no: bill_no,
					currency: "CNY",
					country_code: "HK",
					hrefbackUrl: process.env.CALLBACK_URL

				},
				{
					headers: {
						"Content-Type": "application/json",
						// "authorization": HASH,

						//"Accept": "application/json",


						// Authorization: `Bearer ${process.env.TESLLA_PAY_TOKEN}`,
					},
				}
			)
			.then(function (response) {
				const resp = response.data;
				console.log(resp);
				console.log(resp.body);
				console.log(resp.data);
				if (resp.code == 1000) {
					console.log("success");

					try {
						let transaction = new Transaction({
							// userid: req.user.id,
							//  clientCode: "",//process.env.CLIENT_CODE,
							//  payAmount: resp.requestAmount,
							//  trxNo: resp.orderNo,
							// sign: resp.sign,
							// status: resp.status,
							// type: "deposit",
							// platform: "DCT",
						});
						// transaction.save();

						User.findById(req.user.id)
							.then((user) => {
								console.log("userrr balance..." + user.balance);

								if (user.balance != 'NaN') {
									user.balance =
										Number(resp.data.balance);
									user.save();
									console.log("user balance updated");
									res.send({ status: "0" });
								}
							})
							.catch((err) => {
								console.log(
									"/user balance update error user",
									err
								);
							});
					} catch (ex) {
						//console.log("/deposit error", ex);
					}

					//  res.send({ payUrl: resp.payUrl });



					// res.json({ status: "0000"});
				} else {
					console.log("errrrorororoor");
				}
			});
	} catch (ex) {
		console.log("Error Exception On Deposit" + ex);
	}
});

router.post("/smartpay/:chanlType", auth, async (req, res) => {

	const chnlType = req.params.chanlType;
	const user = await User.findById(req.user.id).select("-password");
	//const bankCode = "T_BBL";
	// let customNo = "000777";
	let channleType;
	const url = "https://mgp-pay.com:12588";//12588, 8443
	let endpoint;
	switch (chnlType) {
		case "bank":
			channleType = "1"
			endpoint = "/api/pay/V2"
			break;
		case "truepay":
			channleType = "2"
			endpoint = "/api/pay/V2"
			break;
		case "promptpay":
			channleType = "3"
			endpoint = "/api/pay/V2"
			break;
	}

	//SmartPay Bank Deposit API Parames
	const version = "V2";
	const signType = "MD5";
	const merchantNo = "API1715848040266637";
	const hashKey = "00cd33f68443416eafbb6f30e1499370";
	const bizAmt = req.body.amount;
	const noticeUrl = "http://206.206.77.139:5000/api/pay/smartpay_deposit_callback";
	const orderNo = require('crypto').randomBytes(6).toString('hex').toUpperCase();
	console.log(orderNo);

	//DC Games API Credit API params
	// const bill_no = require('crypto').randomBytes(10).toString('hex');
	//  const brand_id = process.env.BRAND_ID;
	// const brand_uid = customNo;
	//  const dct_key = process.env.KEY_ID;
	// const HASH = brand_id + brand_uid + dct_key;
	// const hashh = require('crypto').createHash('md5').update(HASH).digest('hex').toString().toUpperCase();
	//  const DEPOSIT_URL_DCT = `${process.env.DCT_BASE_URL}/dct/credit`;

	try {

		function generateMD5(data) {
			const crypto = require('crypto');
			const md5 = crypto.createHash('md5');
			md5.update(data, 'utf8');
			return md5.digest('hex');
		}





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

		const dataToSign = `bizAmt=${bizAmt}&channleType=${channleType}&date=${todayDateTime}&merchantNo=${merchantNo}&noticeUrl=${noticeUrl}&orderNo=${orderNo}&signType=${signType}&version=${version}${hashKey}`;
		console.log(dataToSign);

		// Generate the MD5 signature
		const sign = generateMD5(dataToSign);
		console.log(sign);
		await axios
			.post(
				url + endpoint,
				{
					sign: sign,
					bizAmt: bizAmt,
					channleType: channleType,
					date: todayDateTime,
					merchantNo: merchantNo,
					noticeUrl: noticeUrl,
					orderNo: orderNo,
					signType: signType,
					version: version
				},
				{
					headers: {
						"Content-Type": "application/json",

					},
				}
			)

			.then(function (resonse) {
				// console.log("response..." + resonse.data);
				const resp = resonse.data;
				console.log("deposit response...." + resp.code);
				console.log(resp.msg);
				if (resp.code != -1) {
					console.log(resp['detail'].PayURL);
					res.send({ PayUrl: resp['detail'].PayURL, code: 0, gateway: 'spay' });
					const dataToSignQuery = `date=${todayDateTime}&merchantNo=${merchantNo}&orderNo=${orderNo}&signType=${signType}&version=${version}${hashKey}`;
					console.log(dataToSignQuery);

					const signQuery = generateMD5(dataToSignQuery);
					console.log(signQuery);
					endpoint = "/api/defray/queryV2";
					axios
						.post(
							url + endpoint,
							{
								sign: signQuery,
								date: todayDateTime,
								merchantNo: merchantNo,
								orderNo: orderNo,
								signType: signType,
								version: version
							},
							{
								headers: {
									"Content-Type": "application/json",

								},
							}
						)

						.then(function (resonse) {
							// console.log("response..." + resonse.data);
							const resp = resonse.data;
							console.log(resp.status);

							let transaction = new Transaction({
								userid: req.user.id,
								platform: user.platform,
								userPhone: user.phone,
								orderNo: orderNo,
								payAmount: req.body.amount,
								status: resp.msg,
								responseCode: resp.code,
								action: 'initiated',
								type: "deposit",
								provider: 'smartpay',
							});
							transaction.save();
							console.log("Smart pay bank api response success..");
						})
				}
				else {
					console.log(resp.msg);
					res.send({ PayUrl: '', msg: resp.msg, code: resp.code, gateway: 'spay' });

				}


			})



		//SAVE BALANCE TO DC GAMES API
		// axios
		// .post(
		//  DEPOSIT_URL_DCT,
		// {


		// --- DCT CREDIT API PARAMS ---
		//    brand_id: process.env.BRAND_ID,
		//  sign: hashh,
		//   brand_uid: brand_uid,
		//   amount: bizAmt,
		//   bill_no: bill_no,
		//   currency: "THB",
		//   country_code: "TH",
		//    hrefbackUrl: process.env.CALLBACK_URL

		// },
		// {
		// headers: {
		//  "Content-Type": "application/json",

		//  },
		// }
		// )
		//  .then(function (response) {
		//  const respp = response.data;
		//  console.log("DCT api response..." + respp["code"]);
		// if (respp["code"] == 1000) {
		//  console.log("DCT balance credit success");






		// }


		// }





	}
	catch (ex) {
		console.log(ex);
	}
});

router.post("/smartpay_balance", async (req, res) => {


	let customNo = "000007";
	let channleType = "3";
	const url = "https://mgp-pay.com:8443";
	let endpoint = "/api/balance/V2";


	//SmartPay Bank balance API Parames
	const version = "V2";
	const signType = "MD5";
	const merchantNo = "API1715848040266637";
	const hashKey = "00cd33f68443416eafbb6f30e1499370";


	try {

		function generateMD5(data) {
			const crypto = require('crypto');
			const md5 = crypto.createHash('md5');
			md5.update(data, 'utf8');
			return md5.digest('hex');
		}

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

		const dataToSign = `channleType=${channleType}&date=${todayDateTime}&merchantNo=${merchantNo}&signType=${signType}&version=${version}${hashKey}`;
		console.log(dataToSign);

		// Generate the MD5 signature
		const sign = generateMD5(dataToSign);
		console.log(sign);
		await axios
			.post(
				url + endpoint,
				{
					sign: sign,
					channleType: channleType,
					date: todayDateTime,
					merchantNo: merchantNo,
					signType: signType,
					version: version
				},
				{
					headers: {
						"Content-Type": "application/json",

					},
				}
			)

			.then(function (resonse) {
				console.log("response..." + resonse.data);
				const resp = resonse.data;
				console.log(resp);



			})

	}
	catch (ex) {
		console.log(ex);
	}
});

router.post("/smartpay_withdraw/:chanlType", auth, async (req, res) => {
	const user = await User.findById(req.user.id).select("-password");
	const chnlType = req.params.chanlType;
	const bankCode = "T_KBANK";
	let accName = "Jirawat Inwongwan";
	let channleType;
	const url = "https://mgp-pay.com:8443";
	let endpoint;
	switch (chnlType) {
		case "bank":
			channleType = "1"
			endpoint = "/api/defray/V2"
			break;
		case "truepay":
			channleType = "2"
			endpoint = "/api/defray/V2"
			break;
		case "promptpay":
			channleType = "3"
			endpoint = "/api/defray/V2"
			break;
	}

	const version = "V2";
	const signType = "MD5";
	const merchantNo = "API1715848040266637";
	const hashKey = "00cd33f68443416eafbb6f30e1499370";
	const bizAmt = req.body.amount;
	const noticeUrl = "http://206.206.77.139:5000/api/pay/deposit_smartpay_callback";
	const orderNo = require('crypto').randomBytes(6).toString('hex').toUpperCase();
	const bankBranchName = "KBANK";
	const cardNo = "0513172036";
	console.log(orderNo);


	try {

		function generateMD5(data) {
			const crypto = require('crypto');
			const md5 = crypto.createHash('md5');
			md5.update(data, 'utf8');
			return md5.digest('hex');
		}

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

		const dataToSign = `accName=${accName}&bankBranchName=${bankBranchName}&bankCode=${bankCode}&bizAmt=${bizAmt}&cardNo=${cardNo}&channleType=${channleType}&date=${todayDateTime}&merchantNo=${merchantNo}&noticeUrl=${noticeUrl}&orderNo=${orderNo}&signType=${signType}&version=${version}${hashKey}`;
		console.log(dataToSign);

		// Generate the MD5 signature
		const sign = generateMD5(dataToSign);
		console.log(sign);
		await axios
			.post(
				url + endpoint,
				{
					sign: sign,
					accName: accName,
					bankBranchName: bankBranchName,
					bankCode: bankCode,
					bizAmt: bizAmt,
					cardNo: cardNo,
					channleType: channleType,
					date: todayDateTime,
					merchantNo: merchantNo,
					noticeUrl: noticeUrl,
					orderNo: orderNo,
					signType: signType,
					version: version
				},
				{
					headers: {
						"Content-Type": "application/json",

					},
				}
			)

			.then(function (resonse) {
				console.log("response..." + resonse.data);
				const resp = resonse.data;
				console.log(resp.code);
				console.log(resp.msg);

				if (resp.code != '-1') {



					let transaction = new Transaction({
						userid: req.user.id,
						platform: user.platform,
						userPhone: user.phone,
						orderNo: orderNo,
						payAmount: req.body.amount,
						status: resp.msg,
						responseCode: resp.code,
						action: 'initiated',
						type: "withdraw",
						provider: 'smartpay',
					});
					transaction.save();
					User.findById(req.user.id)
						.then((user) => {
							user.balance =
								Number(user.balance) -
								Number(req.body.amount);
							user.save();
							console.log("user balance updated");
						})
						.catch((err) => {
							console.log(
								"/user balance update error user",
								err
							);
						});
					res.send({ code: resp.code })

				}
				else {
					if (resp.msg.indexOf("资金不足") != -1)//
					{
						let log = new Log({
							action: "Withdraw",
							code: resp.code,
							response: resp.msg,
							responseEN: resp.msg

						});
						log.save();


						res.send({ code: resp.code, msg: "Insufficient funds, balance." + resp.msg })
					}
					else {
						let log = new Log({
							action: "Withdraw",
							code: resp.code,
							response: resp.msg,
							responseEN: resp.msg

						});
						log.save();



						res.send({ code: resp.code, msg: resp.msg })

					}



				}

			})

	}
	catch (ex) {
		console.log("Error:" + ex);
	}
})

router.post("/balance_bigpay", async (req, res) => {
	try {

		//console.log(req.body);
		console.log("bigpay balance api called..");
		const merchant_code = process.env.MerchantCode;
		const DEPOSIT_URL = `https://promptpay-api.bigpayz.net/Payout/GetBalance`;
		const HASH = merchant_code;
		const hashh = require('crypto').createHmac('sha256', "f1t0urr4LXprTuQuiDuHbsUBu7eTSD+vqxuvh16+IfY=").update(HASH).digest('hex');
		await axios
			.post(
				DEPOSIT_URL,
				{
					merchant_code: merchant_code,
					hash: hashh,
				},
				{
					headers: {
						"Content-Type": "application/json",
						// "authorization": HASH,


						//"api-key": _key,
						//"time": current_time
						Authorization: `Basic ${process.env.BIGPAY_KEY}`,
					},
				}


			)
			.then(function (resonse) {
				console.log("response..." + resonse.data);
				const resp = resonse.data;
				console.log(resp);
			})


	}
	catch (ex) {

	}
})

router.post("/deposit_bigpay_bank", auth, async (req, res) => {
	try {

		//console.log(req.body);
		console.log("bigpay BANK deposit function called..");
		const user = await User.findById(req.user.id).select("-password");

		console.log(user.name);
		console.log(req.body[0]);		//--BIGPAY BANK METHOD PARAMS

		const MerchantCode = process.env.MerchantCode;
		const ReturnURL = "https://ama777.cloud";
		const FailedReturnURL = "https://ama777.cloud";
		const HTTPPostURL = "https://games-back.kuab5b.easypanel.host/api/pay/bigpayz_deposit_callback";
		const Amount = req.body[0];
		const Currency = "THB";
		const ItemID = require('crypto').randomBytes(6).toString('hex');
		const ItemDescription = "bank payment";
		const PlayerId = user.phone.toString();
		//const DEPOSIT_URL = `https://payin-api.bigpayz.net/payin/depositv2`;
		//const HASH = MerchantCode + ItemID + Currency + Amount;
		const BankCode = req.body[1];//kskb

		//-- BIGPAY QR CODE METHOD PARAMS

		// const merchant_code = process.env.MerchantCode;
		// const ref_id = require('crypto').randomBytes(6).toString('hex');;
		// const player_username = user.phone.toString();
		// const player_ip = process.env.PLAYER_IP;
		// const currency_code = process.env.Currency;
		// const amount = req.body.amount;
		// const lang = process.env.LANGUAGE;
		// const client_url = process.env.CLient_url;
		// const view = process.env.VIEW;



		const DEPOSIT_URL = `https://payin-api.bigpayz.net/Payin/DepositV2`;
		const HASH = MerchantCode + ItemID + Currency + Amount;




		const hashh = require('crypto').createHmac('sha256', "f1t0urr4LXprTuQuiDuHbsUBu7eTSD+vqxuvh16+IfY=").update(HASH).digest('hex');


		await axios
			.post(
				DEPOSIT_URL,
				{
					MerchantCode: MerchantCode,
					ReturnURL: ReturnURL,
					FailedReturnURL: FailedReturnURL,
					HTTPPostURL: HTTPPostURL,
					Amount: Amount,
					Currency: Currency,
					ItemID: ItemID,
					ItemDescription: ItemDescription,
					PlayerId: PlayerId,
					BankCode: BankCode,
					Hash: hashh,

					// merchant_code: merchant_code,
					// ref_id: ref_id,
					// player_username: player_username,
					// player_ip: player_ip,
					// currency_code: currency_code,
					// amount: amount,
					// lang: lang,
					// client_url: client_url,
					// view: view,
					// hash: hashh,


				},
				{
					headers: {
						"Content-Type": "application/json",
						// "authorization": HASH,


						//"api-key": _key,
						//"time": current_time
						Authorization: `Basic ${process.env.BIGPAY_KEY}`,
					},
				}
			)
			.then(async function (resonse) {
				console.log("response..." + resonse.data);
				const resp = resonse.data;
				console.log(resp);



				if (resp.status == 0) {
					// write the code for if user have promotion code then check the promotion accordingly add the bonous 


					let transaction = new Transaction({
						userid: req.user.id,
						platform: 'luckyama',
						userPhone: user.phone,
						orderNo: ItemID,
						payAmount: req.body[0],
						status: 'initiated',
						responseCode: 0,
						type: "deposit",
						provider: 'bigpayz-bank-' + req.body[1],
						// trxNo: resp.invoice_number,
					});
					transaction.save();

					User.findById(req.user.id)
						.then((user) => {
							user.balance =
								Number(user.balance) +
								Number(req.body[0]);
							user.save();
							console.log("user balance updated after BANK deposit");
						})


					if (user && user?.promotionId) {
						const userPromotionInfo = await Promotion.findById(user.promotionId)
						let promotionPermissions = userPromotionInfo.permissions;
						if (userPromotionInfo && userPromotionInfo?.expDate) {

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

							if (checkUserPlanExpire) {

								let highestPercent = userPromotionInfo.highestPercent;
								let bonusAmnt = userPromotionInfo.bonusAmnt;
								let depositAmnt = userPromotionInfo.depositAmnt;
								let userDepositeAmount = req.body[0];
								let userBalance = user.balance;
								let calculateDiscount = 0;
								if (highestPercent && highestPercent > 0) {
									calculateDiscount = req.body[0] * bonusAmnt / 100;
								} else {
									calculateDiscount = bonusAmnt;
								}

								if (userDepositeAmount >= depositAmnt && (promotionPermissions.includes("forFirstDeposit") || promotionPermissions.includes("autoBonus"))) {


									if (promotionPermissions.includes("forFirstDeposit")) {
										const todayStart = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
										const todayEnd = new Date(new Date().toISOString().split('T')[0] + 'T23:59:59.999Z');
										const result = await Transaction.find({
											"date": {
												$gte: todayStart,
												$lt: todayEnd
											},
											userid: req.user.id
										});
										if (result.length == 0) {
											userBalance = userBalance + calculateDiscount;

											const getBonusDetails = await Bonus.findOne({
												userid: req.user.id,
												promotionId: user.promotionId
											});
											if (getBonusDetails) {
												getBonusDetails.quantity = getBonusDetails.quantity + 1
												await getBonusDetails.save();
											} else {
												// add entry in the bonus table 
												let betResult = await Bet.aggregate([
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
												if (betResult.length > 0) {
													totalBetAmount = betResult[0].totalBetAmount;
												}
												let bonusEntity = new Bonus({
													username: user.name,
													userid: user._id,
													promotionId: user.promotionId,
													bonusType: userPromotionInfo.bonusType,
													quantity: 1,
													topUp: calculateDiscount,
													cashBalanceFirst: user.balance,
													cashBalanceAfter: userBalance,
													turnover: totalBetAmount - userPromotionInfo.depositAmnt
												});
												bonusEntity.save();
												// end code 
											}

											// Update the user's Promotion in the database
											user.balance = userBalance;
											await user.save();
										}
									}
									if (promotionPermissions.includes("autoBonus")) {
										userBalance = userBalance + calculateDiscount;

										// add entry in the bonus table 
										let betResult = await Bet.aggregate([
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
										if (betResult.length > 0) {
											totalBetAmount = betResult[0].totalBetAmount;
										}
										let bonusEntity = new Bonus({
											username: user.name,
											userid: user._id,
											promotionId: user.promotionId,
											bonusType: userPromotionInfo.bonusType,
											quantity: 1,
											topUp: calculateDiscount,
											cashBalanceFirst: user.balance,
											cashBalanceAfter: userBalance,
											turnover: totalBetAmount - userPromotionInfo.depositAmnt
										});
										bonusEntity.save();
										// end code 

										// Update the user's Promotion in the database
										user.balance = userBalance;
										await user.save();
									}


								}
							}
						}
					}

					// end code 
					//res.send({ PayUrl: resp.redirect_to, code: 0, gateway: 'bpay' });
					res.send({ error: "API Response Code", code: resp.status, msg: 'Something went wrong.', PayUrl: resp.redirect_to, gateway: 'bpayz-bank', method: 'bank' });
				}
				else {

					res.send({ error: resp.error_message + "*", code: resp.error_code, msg: resp.message, PayUrl: "" });
				}



			});
	}
	catch (ex) {
		console.log(ex);
	}

});

router.post("/deposit_bigpay_qr", auth, async (req, res) => {
	try {

		//console.log(req.body);
		console.log("bigpay qr deposit function called..");
		const user = await User.findById(req.user.id).select("-password");

		//console.log(user.name);

		//--BIGPAY BANK METHOD PARAMS

		// const MerchantCode = process.env.MerchantCode;
		// const ReturnURL = "http://148.113.3.153:3000/";
		// const FailedReturnURL = "http://148.113.3.153:3000/error";
		// const HTTPPostURL = "http://148.113.3.153:5000/api/pay/bank_deposit_return";
		// const Amount = "50.00";
		// const Currency = "THB";
		// const ItemID = require('crypto').randomBytes(6).toString('hex');
		// const ItemDescription = "bank payment";
		// const PlayerId = user.phone.toString();
		// const DEPOSIT_URL = `https://payin-api.bigpayz.net/payin/depositv2`;
		// const HASH = MerchantCode + ItemID + Currency + Amount;
		// const BankCode = "KSKB";

		//-- BIGPAY QR CODE METHOD PARAMS

		const merchant_code = process.env.MerchantCode;
		const ref_id = require('crypto').randomBytes(6).toString('hex');;
		const player_username = user.phone.toString();
		const player_ip = process.env.PLAYER_IP;
		const currency_code = process.env.Currency;
		const amount = req.body[0];
		const lang = process.env.LANGUAGE;
		const client_url = process.env.CLient_url;
		const view = process.env.VIEW;



		const DEPOSIT_URL = `https://promptpay-api.bigpayz.net/BankBot/QRScanDeposit`;
		const HASH = merchant_code + ref_id + player_username + player_ip + currency_code + amount + client_url;




		const hashh = require('crypto').createHmac('sha256', "f1t0urr4LXprTuQuiDuHbsUBu7eTSD+vqxuvh16+IfY=").update(HASH).digest('hex');


		await axios
			.post(
				DEPOSIT_URL,
				{
					// MerchantCode: MerchantCode,
					// ReturnURL: ReturnURL,
					// FailedReturnURL: FailedReturnURL,
					// HTTPPostURL: HTTPPostURL,
					// Amount: Amount,
					// Currency: Currency,
					// ItemID: ItemID,
					// ItemDescription: ItemDescription,
					// PlayerId: PlayerId,
					// BankCode: BankCode,
					// Hash: hashh,

					merchant_code: merchant_code,
					ref_id: ref_id,
					player_username: player_username,
					player_ip: player_ip,
					currency_code: currency_code,
					amount: amount,
					lang: lang,
					client_url: client_url,
					view: view,
					hash: hashh,


				},
				{
					headers: {
						"Content-Type": "application/json",
						// "authorization": HASH,


						//"api-key": _key,
						//"time": current_time
						Authorization: `Basic ${process.env.BIGPAY_KEY}`,
					},
				}
			)
			.then(async function (resonse) {
				console.log("response..." + resonse.data);
				const resp = resonse.data;
				console.log(resp);



				if (resp.error_code == 0) {
					// write the code for if user have promotion code then check the promotion accordingly add the bonous 


					let transaction = new Transaction({
						userid: req.user.id,
						platform: 'luckyama',
						userPhone: user.phone,
						orderNo: ref_id,
						payAmount: req.body[0],
						status: 'initiated',
						responseCode: 0,
						type: "deposit",
						provider: 'bigpayz-qr',
						// trxNo: resp.invoice_number,
					});
					transaction.save();

					User.findById(req.user.id)
						.then((user) => {
							user.balance =
								Number(user.balance) +
								Number(req.body[0]);
							user.save();
							console.log("user balance updated");
						})


					if (user && user?.promotionId) {
						const userPromotionInfo = await Promotion.findById(user.promotionId)
						let promotionPermissions = userPromotionInfo.permissions;
						if (userPromotionInfo && userPromotionInfo?.expDate) {

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

							if (checkUserPlanExpire) {

								let highestPercent = userPromotionInfo.highestPercent;
								let bonusAmnt = userPromotionInfo.bonusAmnt;
								let depositAmnt = userPromotionInfo.depositAmnt;
								let userDepositeAmount = req.body[0];
								let userBalance = user.balance;
								let calculateDiscount = 0;
								if (highestPercent && highestPercent > 0) {
									calculateDiscount = req.body[0] * bonusAmnt / 100;
								} else {
									calculateDiscount = bonusAmnt;
								}

								if (userDepositeAmount >= depositAmnt && (promotionPermissions.includes("forFirstDeposit") || promotionPermissions.includes("autoBonus"))) {


									if (promotionPermissions.includes("forFirstDeposit")) {
										const todayStart = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
										const todayEnd = new Date(new Date().toISOString().split('T')[0] + 'T23:59:59.999Z');
										const result = await Transaction.find({
											"date": {
												$gte: todayStart,
												$lt: todayEnd
											},
											userid: req.user.id
										});
										if (result.length == 0) {
											userBalance = userBalance + calculateDiscount;

											const getBonusDetails = await Bonus.findOne({
												userid: req.user.id,
												promotionId: user.promotionId
											});
											if (getBonusDetails) {
												getBonusDetails.quantity = getBonusDetails.quantity + 1
												await getBonusDetails.save();
											} else {
												// add entry in the bonus table 
												let betResult = await Bet.aggregate([
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
												if (betResult.length > 0) {
													totalBetAmount = betResult[0].totalBetAmount;
												}
												let bonusEntity = new Bonus({
													username: user.name,
													userid: user._id,
													promotionId: user.promotionId,
													bonusType: userPromotionInfo.bonusType,
													quantity: 1,
													topUp: calculateDiscount,
													cashBalanceFirst: user.balance,
													cashBalanceAfter: userBalance,
													turnover: totalBetAmount - userPromotionInfo.depositAmnt
												});
												bonusEntity.save();
												// end code 
											}

											// Update the user's Promotion in the database
											user.balance = userBalance;
											await user.save();
										}
									}
									if (promotionPermissions.includes("autoBonus")) {
										userBalance = userBalance + calculateDiscount;

										// add entry in the bonus table 
										let betResult = await Bet.aggregate([
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
										if (betResult.length > 0) {
											totalBetAmount = betResult[0].totalBetAmount;
										}
										let bonusEntity = new Bonus({
											username: user.name,
											userid: user._id,
											promotionId: user.promotionId,
											bonusType: userPromotionInfo.bonusType,
											quantity: 1,
											topUp: calculateDiscount,
											cashBalanceFirst: user.balance,
											cashBalanceAfter: userBalance,
											turnover: totalBetAmount - userPromotionInfo.depositAmnt
										});
										bonusEntity.save();
										// end code 

										// Update the user's Promotion in the database
										user.balance = userBalance;
										await user.save();
									}


								}
							}
						}
					}

					// end code 
					//res.send({ PayUrl: resp.redirect_to, code: 0, gateway: 'bpay' });
					res.send({ error: "API Response Code", code: resp.error_code, msg: resp.message, PayUrl: resp.redirect_to, gateway: 'bpay', method: 'qr' });
				}
				else {

					res.send({ error: resp.error_message + "*", code: resp.error_code, msg: resp.error_message, PayUrl: "" });
				}



			});
	}
	catch (ex) {
		console.log(ex);
	}

});

router.post("/bigpayz_deposit_callback", async (req, res) => {

	console.log("deposit_callback");
	console.log(res.body);
	const contract = 1234;
	const apikey = process.env.BIGPAY_KEY;
	const transaction = '';
	const status = 1;
	const status_message = '';
	const ItemID = '1234';
	const ItemDescription = 'item123';
	const Amount = 100;
	const Currency = 'thb';
	const ClientName = 'client1';
	const signature2 = '';
	const created_at = '';
	const updated_at = '';



	// User.findById(trx.userid)
	// 	.then((user) => {
	// 		user.balance = Number(user.balance) + Number(payAmount);
	// 		user.save();
	// 	})
	// 	.catch((err) => {
	// 		console.log("/withdraw_callback error user", err);
	// 	});

	// Transaction.findOneAndUpdate(filter, update, { new: true })
	// 	.then((updatedDocument) => {
	// 		if (updatedDocument) {
	// 			console.log(
	// 				`Successfully updated document: ${updatedDocument}.`
	// 			);
	// 		} else {
	// 			console.log("No document matches the provided query.");
	// 		}
	// 	})
	// 	.catch((err) =>
	// 		console.error(`Failed to find and update document: ${err}`)
	// 	);


	res.json({ status: "0000" });
});





router.post("/deposit", auth, async (req, res) => {
	try {

		console.log("deposit function called..");
		const { amount, currency, platform } = req.body;

		const user = await User.findById(req.user.id).select("-password");
		const DEPOSIT_URL = `${process.env.PMG_BASE_URL}/api/v1/Payment/Deposit`;

		await axios
			.post(
				DEPOSIT_URL,
				{
					clientCode: process.env.CLIENT_CODE,
					memberFlag: user.name,
					amount: amount,
					hrefbackUrl:
						platform == "ama777agent"
							? "https://amma-front-xy5tg.ondigitalocean.app/api/pay/deposit_callback"
							: "https://amma-front-xy5tg.ondigitalocean.app/api/pay/deposit_callback",

				},
				{
					headers: {
						"Content-Type": "application/json",
						// "authorization": HASH,

						"Accept": "application/json",
						//"api-key": _key,
						//"time": current_time
						Authorization: `Bearer ${process.env.TESLLA_PAY_TOKEN}`,
					},
				}
			)
			.then(function (response) {
				console.log("response..." + response);
				if (response.data.httpCode == 200) {
					const resp = response.data.data;

					try {
						let transaction = new Transaction({
							userid: req.user.id,
							clientCode: process.env.CLIENT_CODE,
							payAmount: resp.requestAmount,
							trxNo: resp.orderNo,
							sign: resp.sign,
							status: resp.status,
							type: "deposit",
							platform: platform,
						});
						transaction.save();

						User.findById(req.user.id)
							.then((user) => {
								user.balance =
									Number(user.balance) +
									Number(resp.requestAmount);
								user.save();
								console.log("user balance updated");
							})
							.catch((err) => {
								console.log(
									"/user balance update error user",
									err
								);
							});
					} catch (ex) {
						//console.log("/deposit error", ex);
					}

					res.send({ payUrl: resp.payUrl });



					// res.json({ status: "0000"});
				} else {
					console.log("errrrorororoor");
				}
			});
	} catch (ex) {
		console.log("Error Exception On Deposit" + ex);
	}
});

router.post("/bigpayz_withdraw", auth, async (req, res) => {
	try {
		console.log("bigpay withdraw url called");
		console.log(req.body);
		const amount = req.body.amount;
		const user = await User.findById(req.user.id).select("-password");
		const WITHDRAW_URL = `https://payout-api.bigpayz.net/Payout/Withdrawal`;


		if (Number(user.balance) < Number(amount)) {
			res.send({
				code: '-5',
				success: false,
				message: "Not Enough Balance!",
			});

			return;
		}

		// check if user have promotion and promotion type is turnover 
		const userPromotionInfo = await Promotion.findById(user.promotionId)
		if (userPromotionInfo) {
			let promotionPermissions = userPromotionInfo.permissions;
			if (promotionPermissions.includes("turnover")) {
				let promotionTurnover = userPromotionInfo.turnover;
				// get the user bonus details 
				const getBonusDetails = await Bonus.findOne({
					userid: req.user.id,
					promotionId: user.promotionId
				});

				if (getBonusDetails) {
					let shouldSpentonBet = getBonusDetails.topUp * promotionTurnover;
					let actualBetSpentAmountAfterProApplied = 0;
					let bonusApplyDate = getBonusDetails.addTime;

					const bonusApplyDateFormat = new Date(new Date(bonusApplyDate).toISOString().split('T')[0] + 'T00:00:00.000Z');
					const todayEnd = new Date(new Date().toISOString().split('T')[0] + 'T23:59:59.999Z');

					const result = await Bet.aggregate([
						{
							$match: {
								userId: user.name,
								"betTime": {
									$gte: bonusApplyDateFormat,
									$lt: todayEnd
								},
							},
						},
						{
							$group: {
								_id: null, // Grouping by null means aggregating all documents together
								totalBetAmountt: { $sum: "$betAmount" }, // Sums up all betAmount values
							},
						},
					]);
					if (result && result.length > 0) {
						actualBetSpentAmountAfterProApplied = result[0].totalBetAmountt;
					}
					if (actualBetSpentAmountAfterProApplied < shouldSpentonBet) {
						res.send({
							code: '-4',
							success: false,
							message: "You are not eligible to withdraw the amount!",
						});

						return;
					}
				}

			}
		}
		// end 


		// Start Check turnover
		// check playing amount should be over withdrawal amount.
		//console.log("user data>33" + user);

		//console.log("user data not empty");
		const result = await Bet.aggregate([
			{

				$match: {

					userId: user.name,
					// action: { $in: ["bet", "betNSettle"] }, // Filters documents to include only those where action is either 'bet' or 'betNSettle'
				},
			},
			{
				$group: {
					_id: null, // Grouping by null means aggregating all documents together
					totalBetAmountt: { $sum: "$turnover" }, // Sums up all betAmount values
				},
			},
		]);
		//console.log("resuuulttt" + result);
		//console.log("result length" + result.length);

		// console.log("resultt value...>"+resultt);

		let totalBetAmount = 0;
		if (result.length > 0) {
			//console.log("Total Bet Amount:", result[0].totalBetAmountt);
			totalBetAmount = result[0].totalBetAmountt;
		} else {
			console.log("No bets found or sum is zero");
		}

		if (amount > totalBetAmount) {
			res.send({
				code: -3,
				success: false,
				message: "Not Enough Turnover!",
			});

			return;
		}
		// End Check turnover

		const merchant_code = process.env.MerchantCode;
		const ref_id = require('crypto').randomBytes(6).toString('hex');;
		const player_username = user.phone.toString();
		const player_ip = "82.112.236.107";
		const currency_code = "THB";

		const bank_code = user.bbn;
		const beneficiary_account = user.bban;
		const beneficiary_name = user.bbun;
		const ifsc = "";
		const account_type = "";
		const address = "";
		const email = "";
		const mobile = "";
		const beneficiary_verification = "";


		const HASH = merchant_code + ref_id + player_username + player_ip + currency_code + amount + bank_code + beneficiary_account + beneficiary_name;




		const hashh = require('crypto').createHmac('sha256', "f1t0urr4LXprTuQuiDuHbsUBu7eTSD+vqxuvh16+IfY=").update(HASH).digest('hex');

		await axios
			.post(
				WITHDRAW_URL,
				{
					merchant_code: merchant_code,
					ref_id: ref_id,
					player_username: player_username,
					player_ip: player_ip,
					currency_code: currency_code,
					amount: amount,
					bank_code: bank_code,
					beneficiary_account: beneficiary_account,
					beneficiary_name: beneficiary_name,
					hash: hashh
					//ifsc: user.bbun,
					// account_type: user.bbn,
					// address: amount,
					// email:email,
					// mobile:mobile,
					// beneficiary_verification:beneficiary_verification


				},
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Basic ${process.env.BIGPAY_KEY}`
					},
				}
			)
			.then(async function (response) {
				console.log("bigpay response...");
				console.log(response.data);

				if (response.data.error_code != 0) {
					res.send({
						code: response.data.error_code,
						success: false,
						message: response.data.message,

					});
				}


				else {

					try {



						User.findById(req.user.id)
							.then((user) => {
								user.balance =
									Number(user.balance) -
									Number(amount);
								user.save();

								let transaction = new Transaction({
									userid: user.id,
									clientCode: process.env.CLIENT_CODE,
									payAmount: amount,
									trxNo: response.data.invoice_number,
									sign: '',
									status: 'success',
									type: "withdrawal",
									platform: 'luckyama',
									userPhone: user.phone
								});
								transaction.save();
								res.send({
									code: 0,
									success: true,
									message: response.data.error_message,

								});
							})
							.catch((err) => {
								console.log(
									"/withdrawal_callback error user",
									err
								);
							});
					} catch (ex) {
						console.log("/withdraw error", ex);
					}

				}

				// write the code here if user have promotion code deleteProm then applied promotion will get deleted 
				if (user && user?.promotionId) {
					const userPromotionInfo = await Promotion.findById(user.promotionId)
					let promotionPermissions = userPromotionInfo.permissions;
					if (promotionPermissions.includes("deleteProm")) {
						await User.updateOne(
							{ "_id": req.user.id },  // Filter by user _id
							{ $unset: { promotionId: 1 } }
						);
					}

				}
				// end code 

				//res.send(response.data);
			});
	} catch (ex) {
		console.log("Error Exception On Deposit4444", ex);
	}
});

router.post("/withdraw_old", auth, async (req, res) => {
	try {
		console.log("bigpay withdraw url called");
		const { amount, platform } = req.body;
		console.log(req.body);
		const user = await User.findById(req.user.id).select("-password");
		const WITHDRAW_URL = `https://payout-api.bigpayz.net/Payout/Withdrawal`;

		if (Number(user.balance) < Number(amount)) {
			res.send({
				success: false,
				message: "Not Enough Balance!",
			});

			return;
		}

		// Start Check turnover
		// check playing amount should be over withdrawal amount.
		console.log("user data>" + user);

		console.log("user data not empty");
		const result = await Bet.aggregate([
			{

				$match: {

					userId: user.name,
					// action: { $in: ["bet", "betNSettle"] }, // Filters documents to include only those where action is either 'bet' or 'betNSettle'
				},
			},
			{
				$group: {
					_id: null, // Grouping by null means aggregating all documents together
					totalBetAmountt: { $sum: "$turnover" }, // Sums up all betAmount values
				},
			},
		]);
		console.log("resuuulttt" + result);
		console.log("result length" + result.length);

		// console.log("resultt value...>"+resultt);

		let totalBetAmount = 0;
		if (result.length > 0) {
			console.log("Total Bet Amount:", result[0].totalBetAmountt);
			totalBetAmount = result[0].totalBetAmountt;
		} else {
			console.log("No bets found or sum is zero");
		}

		if (amount > totalBetAmount) {
			res.send({
				success: false,
				message: "Not Enough Turnover!",
			});

			return;
		}
		// End Check turnover

		await axios
			.post(
				WITHDRAW_URL,
				{
					clientCode: process.env.CLIENT_CODE,
					memberFlag: user.name,
					bankCardNumber: user.bban,
					bankUserName: user.bbun,
					bankName: user.bbn,
					amount: amount,
				},
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${process.env.TESLLA_PAY_TOKEN}`,
					},
				}
			)
			.then(function (response) {
				console.log(response.data);
				/*
				{
						success: true,
						httpCode: 200,
						data: {
						orderNo: 'PYXLMVI0000042',
						requestAmount: 100,
						status: 'PAYING',
						sign: '02443457e4fae3201168a7f03359adc8'
						}
				}
				*/
				if (response.data.success) {
					const { orderNo, requestAmount, status, sign } =
						response.data.data;
					try {
						let transaction = new Transaction({
							userid: req.user.id,
							clientCode: process.env.CLIENT_CODE,
							payAmount: requestAmount,
							trxNo: orderNo,
							sign: sign,
							status: status,
							type: "withdraw",
							platform: platform,
						});
						transaction.save();

						User.findById(req.user.id)
							.then((user) => {
								user.balance =
									Number(user.balance) -
									Number(requestAmount);
								user.save();
							})
							.catch((err) => {
								console.log(
									"/withdrawal_callback error user",
									err
								);
							});
					} catch (ex) {
						console.log("/withdraw error", ex);
					}
				}
				res.send(response.data);
			});
	} catch (ex) {
		console.log("Error Exception On Deposit", ex);
	}
});

router.post("/deposit_callback", async (req, res) => {
	console.log("deposit_callback called.." + res.body)
	console.log("deposit_callback called.." + req.body)
	const {
		clientCode,
		sign,
		status,
		payAmount,
		chainName,
		clientNo,
		coinUnit,
	} = req.body;
	const filter = { trxNo: clientNo }; // Find a document with this condition
	console.log("deposit_callback");

	console.log(req.body);
	if (status == "PAID") {
		// + balance of the user
		let trx = await Transaction.findOne(filter);

		User.findById(trx.userid)
			.then((user) => {
				user.balance = Number(user.balance) + Number(payAmount);
				user.save();
			})
			.catch((err) => {
				console.log("/deposit_callback error user", err);
			});

		const update = {
			clientCode,
			status,
			chainName,
			coinUnit,
		};

		Transaction.findOneAndUpdate(filter, update, { new: true })
			.then((updatedDocument) => {
				if (updatedDocument) {
					console.log(
						`Successfully updated document: ${updatedDocument}.`
					);
				} else {
					console.log("No document matches the provided query.");
				}
			})
			.catch((err) =>
				console.error(`Failed to find and update document: ${err}`)
			);
	} else if (status == "CANCEL") {
		const update = {
			status,
		};

		Transaction.findOneAndUpdate(filter, update, { new: true })
			.then((updatedDocument) => {
				if (updatedDocument) {
					console.log(
						`Successfully updated document: ${updatedDocument}.`
					);
				} else {
					console.log("No document matches the provided query.");
				}
			})
			.catch((err) =>
				console.error(`Failed to find and update document: ${err}`)
			);
	}

	res.json({ status: "0000" });

	console.log("deposit_callback is called");
	console.log(req.body);
});

router.post("/withdraw_callback", async (req, res) => {
	const { clientCode, status, payAmount, orderNo, txId } = req.body;
	console.log("withdraw_callback");
	console.log(req.body);
	const filter = { trxNo: orderNo }; // Find a document with this condition

	if (status == "PAID") {
		let trx = await Transaction.findOne(filter);

		// User.findById(trx.userid)
		//     .then((user) => {
		//         user.balance = Number(user.balance) - Number(payAmount);
		//         user.save();
		//     })
		//     .catch((err) => {
		//         console.log("/deposit_callback error user", err);
		//     });

		const update = {
			clientCode,
			status,
		};

		Transaction.findOneAndUpdate(filter, update, { new: true })
			.then((updatedDocument) => {
				if (updatedDocument) {
					console.log(
						`Successfully updated document: ${updatedDocument}.`
					);
				} else {
					console.log("No document matches the provided query.");
				}
			})
			.catch((err) =>
				console.error(`Failed to find and update document: ${err}`)
			);
	} else if (status == "CANCEL") {
		const update = {
			status,
		};

		User.findById(trx.userid)
			.then((user) => {
				user.balance = Number(user.balance) + Number(payAmount);
				user.save();
			})
			.catch((err) => {
				console.log("/withdraw_callback error user", err);
			});

		Transaction.findOneAndUpdate(filter, update, { new: true })
			.then((updatedDocument) => {
				if (updatedDocument) {
					console.log(
						`Successfully updated document: ${updatedDocument}.`
					);
				} else {
					console.log("No document matches the provided query.");
				}
			})
			.catch((err) =>
				console.error(`Failed to find and update document: ${err}`)
			);
	}

	res.json({ status: "0000" });
});

router.post("/dc_balance", auth, async (req, res) => {
	let balance = 0;
	let result = null;

	console.log("usser id...." + req.user.id);
	const user = await User.findById(req.user.id);

	console.log("user data..." + user);


	balance = user.balance ? user.balance : 0;
	console.log("balance amaount...." + balance);

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

	resultTrans = await Transaction.aggregate([
		{
			$match: {
				userPhone: user.phone,
				type: "deposit",
				responseCode: "0"
				//  action: { $in: ["type", "deposit"] }, // Filters documents to include only those where action is either 'bet' or 'betNSettle'
			},
		},
		{
			$group: {
				_id: null, // Grouping by null means aggregating all documents together
				totalTransAmount: { $sum: "$payAmount" }, // Sums up all betAmount values
			},
		},
	]);

	console.log("user id..." + user._id);
	const brand_id = process.env.BRAND_ID;
	const brand_uid = user.name;
	const api_key = process.env.KEY_ID;
	const currency = "CNY";
	const HASH = brand_id + brand_uid + api_key;
	const hashh = require('crypto').createHash('md5').update(HASH).digest('hex').toString().toUpperCase();


	var options = {
		method: "POST",
		url: process.env.DCT_BASE_URL + "/dct/getBalance",
		headers: { "content-type": "application/json" },
		data: {
			brand_id: brand_id,
			brand_uid: brand_uid,
			currency: currency,
			sign: hashh
		},
	};

	console.log(options.data);

	await axios
		.request(options)
		.then(function (response) {
			console.log("response.data.code===", response.data.code);
			console.log("stttsssss.." + response.data.status);
			balance = response.data.data.balance;
			console.log("new ballllllll.." + balance);
			if (response.data.code == "1000") {
				
				

				console.log("trans result" + resultTrans.length);
				let totalBetAmount = 0;
				let totalTurnover = 0;
				console.log("bet total result.." + result);
				// console.log("transaction amount..deposit.." + resultTrans[0].totalTransAmount);

				if (result.length > 0) {
					console.log("Total Bet Amount:", result[0].totalBetAmount);
					totalBetAmount = result[0].totalBetAmount;
					if (resultTrans.length > 0) {
						totalTurnover = resultTrans[0].totalTransAmount - result[0].totalBetAmount;
						if (totalTurnover < 0) {
							totalTurnover = 0;
						}
					}
				} else {
					console.log("No bets found or sum is zero");
				}
				user.balance = balance;
				user.turnoverAmt = totalTurnover;
				user.turnovers = 1;
				user.save();
				console.log("user balance changed....");

				res.json({ balance, totalTurnover, totalBetAmount });
				
			} else {
				res.json({
					status: response.data.status,
					//desc: response.data.desc,
				});
			}
		})
		.catch(function (error) {
			console.error("errrrrrrrrrrorrr...balance api" + error);
		});



	//user.save();


});

router.post("/balance", auth, async (req, res) => {
	let balance = 0;
	let result = null;
	let resultTrans = null;
	console.log("usser id...." + req.user.id);
	const user = await User.findById(req.user.id);
	const trans = await Transaction.findOne({ userid: req.user.id });
	console.log("user data..." + user);
	console.log("transactin data..." + trans);
	if (user) {
		balance = user.balance ? user.balance : 0;
		console.log("balance amaount...." + balance);

		console.log("user id..." + user._id);
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

		resultTrans = await Transaction.aggregate([
			{
				$match: {
					userPhone: user.phone,
					type: "deposit",
					responseCode: "0"
					//  action: { $in: ["type", "deposit"] }, // Filters documents to include only those where action is either 'bet' or 'betNSettle'
				},
			},
			{
				$group: {
					_id: null, // Grouping by null means aggregating all documents together
					totalTransAmount: { $sum: "$payAmount" }, // Sums up all betAmount values
				},
			},
		]);
	}
	console.log("trans result" + resultTrans.length);
	let totalBetAmount = 0;
	let totalTurnover = 0;
	console.log("bet total result.." + result);
	// console.log("transaction amount..deposit.." + resultTrans[0].totalTransAmount);

	if (result.length > 0) {
		console.log("Total Bet Amount:", result[0].totalBetAmount);
		totalBetAmount = result[0].totalBetAmount;
		if (resultTrans.length > 0) {
			totalTurnover = resultTrans[0].totalTransAmount - result[0].totalBetAmount;
			if (totalTurnover < 0) {
				totalTurnover = 0;
			}
		}
	} else {
		console.log("No bets found or sum is zero");
	}
	user.turnoverAmt = totalTurnover;
	user.turnovers = 1;
	user.save();

	res.json({ balance, totalTurnover, totalBetAmount });
});

// playing balance
router.post("/wager", auth, async (req, res) => {
	try {
		const result = await Bet.aggregate([
			{
				$match: {
					userId: req.user.name.toLowerCase(),
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
			console.log("Total Bet Amount:", result[0].totalBetAmount);
			totalBetAmount = result[0].totalBetAmount;
		} else {
			console.log("No bets found or sum is zero");
		}

		res.json({ totalBetAmount });
	} catch (err) {
		console.error("Error running aggregation:", err);
	}
});

// Total balance
router.post("/total_balance", async (req, res) => {
	// {{BASE_URL}}/api/v1/Payout/CheckBalance?clientCode=S001812kAWFX
	// GET Method
	const CHECKOUT_BALANCE_URL = `${process.env.PMG_BASE_URL}/api/v1/Payout/CheckBalance?clientCode=${process.env.CLIENT_CODE}`;

	await axios
		.post(
			CHECKOUT_BALANCE_URL,
			{},
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.TESLLA_PAY_TOKEN}`,
				},
			}
		)
		.then(function (response) {
			if (response.data.httpCode == 200) {
				let balance = response.data.data.balance;

				res.json({ balance });
			}
		});
});

const getPhoneNumber = (txnUserId) => {
	// Check if txnUserId1 contains only numbers
	var isOnlyNumbers = /^\d+$/.test(txnUserId);

	return isOnlyNumbers ? txnUserId : txnUserId.substring(3);
};

// AWC HOOK FUNCTION
router.post("/awc_hook", async (req, res) => {
	console.log("AWC CALLBACK awc_hook", req.body.message);

	let req_val = JSON.parse(req.body.message);
	// "key": "SWGH308iLalAafVOdgDD",
	// "message": "{\"action\":\"getBalance\",\"userId\":\"swuserid\"}"

	// SAVE BET HISTORY
	if (req_val["action"] != "getBalance") {
		// console.log("request.."+req_val["userId"]);
		//const user = await User.findOne({
		// phone: getPhoneNumber(req_val["userId"]),
		// });
		// console.log("user"+user.phone);
		// If the action is not getBalance, must save all bet history
		req_val["txns"].map(async (txn, key) => {
			//console.log("txn bets.."+txn.userId);
			//console.log(req_val["txns"]);
			const user = await User.findOne({
				phone: getPhoneNumber(txn.userId),
			});
			console.log("platform.." + user.platform);
			const bet = new Bet(txn);
			bet.action = req_val["action"];
			bet.agentId = user.platform;
			bet.save()
				.then((savedBet) => {
					// Handle success, e.g., logging or sending a response
				})
				.catch((error) => {
					// Handle error, e.g., logging or sending an error response
					console.log(error);
				});
		});
	}

	let response = {};

	if (req_val["action"] == "getBalance") {
		const user = await User.findOne({
			phone: getPhoneNumber(req_val["userId"]),
		});
		// console.log("User balance", user.balance);
		if (user != null) {
			response = {
				status: "0000",
				desc: req_val["userId"] + "baht User Balance",
				balance: user.balance,
				balanceTs: new Date().toISOString(),
				userId: req_val["userId"],
			};
		}
	} else if (req_val["action"] == "betNSettle") {
		// Update user balances
		await Promise.all(
			req_val["txns"].map(async (txn) => {
				try {
					const user = await User.findOne({
						phone: getPhoneNumber(txn["userId"]),
					});
					user.balance =
						Number(user.balance) - Number(txn["betAmount"]);
					user.balance =
						Number(user.balance) + Number(txn["winAmount"]);
					await user.save();
				} catch (error) {
					console.error(
						`Error updating user balance for phone ${txn["userId"]}:`,
						error
					);
					// Handle error appropriately
				}
			})
		);

		// Assuming there's only one user being updated
		const updatedUser = await User.findOne({
			phone: getPhoneNumber(req_val["txns"][0]["userId"]),
		});

		// Construct response
		response = {
			status: "0000",
			balance: Number(updatedUser.balance),
			balanceTs: new Date().toISOString(),
		};
		// Send response
		// res.json(response); // Uncomment and use appropriate response method
	} else if (req_val["action"] == "cancelBetNSettle") {
		// Cancel Bet and Settle
		const txnUserId = req_val["txns"][0]["userId"];

		const user = await User.findOne({
			phone: getPhoneNumber(txnUserId),
		});

		if (!user) {
			// Handle the case where the user is not found
			console.error(`User not found for phone ${txnUserId}`);
			response = {
				status: "0001",
				desc: "User not found",
				balance: null,
				balanceTs: new Date().toISOString(),
			};
			return;
		}

		response = {
			status: "0000",
			desc: "Cancel betNSettle",
			balance: Number(user.balance),
			balanceTs: new Date().toISOString(),
		};
		// Perform any necessary operations before saving, if needed
		// For demonstration, we're just saving the user as is
		// await user.save();
	} else if (req_val["action"] == "bet") {
		await Promise.all(
			req_val["txns"].map(async (txn) => {
				try {
					const user = await User.findOne({
						phone: getPhoneNumber(txn["userId"]),
					});
					user.balance =
						Number(user.balance) - Number(txn["betAmount"]);
					await user.save();
					console.log("User balance", user.balance);
				} catch (error) {
					console.error(
						`Error updating user balance for phone ${txn["userId"]}:`,
						error
					);
					// Handle error appropriately
				}
			})
		);

		const updatedUser = await User.findOne({
			phone: getPhoneNumber(req_val["txns"][0]["userId"]),
		});

		response = {
			status: "0000",
			balance: updatedUser.balance,
			balanceTs: new Date().toISOString(),
		};
	} else if (req_val["action"] == "cancelBet") {
		const txn = req_val["txns"][0];
		const user = await User.findOne({
			phone: getPhoneNumber(txn["userId"]),
		});
		try {
			console.log("user balance----------->", user.balance);
			const bet = await Bet.findOne({
				platform: txn["platform"],
				platformTxId: txn["platformTxId"],
				roundId: txn["roundId"],
				action: "bet",
			});

			if (bet) {
				user.balance = Number(user.balance) + Number(bet.betAmount);
				await user.save();
			}
		} catch (ex) {
			console.log(ex);
		}

		response = {
			status: "0000",
			balance: user.balance,
			balanceTs: new Date().toISOString(),
		};
	} else if (req_val["action"] == "settle") {
		const user = await User.findOne({
			phone: getPhoneNumber(req_val["txns"][0]["userId"]),
		});

		user.balance =
			Number(user.balance) + Number(req_val["txns"][0]["winAmount"]);
		await user.save();
		console.log("User balance", user.balance);

		response = {
			status: "0000",
		};
	} else if (req_val["action"] == "unsettle") {
		// from settle to bet!
		const bet = await Bet.findOne({
			platformTxId: req_val["txns"][0]["platformTxId"],
			platform: req_val["txns"][0]["platform"],
			action: "settle",
		});

		const user = await User.findOne({
			phone: getPhoneNumber(req_val["txns"][0]["userId"]),
		});
		user.balance = Number(user.balance) - Number(bet.winAmount);

		await user.save();
		// -winAmount
		response = {
			status: "0000",
		};
	} else if (req_val["action"] == "voidSettle") {
		response = {
			status: "0000",
			desc: "Void Settle",
		};
	} else if (req_val["action"] == "unvoidSettle") {
		response = {
			status: "0000",
			desc: "Unvoid Settle",
		};
	} else if (req_val["action"] == "freeSpin") {
		await Promise.all(
			req_val["txns"].map(async (txn, key) => {
				const user = await User.findOne({
					phone: getPhoneNumber(txn["userId"]),
				});
				user.balance = user.balance - txn.betAmount + txn.winAmount;
				await user.save();
			})
		);

		response = {
			status: "0000",
			desc: "Free Spin",
		};
	} else if (req_val["action"] == "give") {
		await Promise.all(
			req_val["txns"].map(async (txn, key) => {
				const user = await User.findOne({
					phone: getPhoneNumber(txn["userId"]),
				});
				user.balance = user.balance + txn.amount;
				await user.save();
			})
		);

		response = {
			status: "0000",
			desc: "Give",
		};
	} else if (req_val["action"] == "resettle") {
		response = {
			status: "0000",
			desc: "Resettle",
		};
	}

	res.json(response);
});

// SBO HOOK FUNCTION
router.post("/sbo_hook/:hook_type", async (req, res) => {
	const hook_type = req.params.hook_type;

	console.log(req.params.hook_type);
	console.log(req.body);

	switch (hook_type) {
		case "GetBalance":
			break;
		case "Deduct":
			break;
		case "Settle":
			break;
		case "Rollback":
			break;
		case "Cancel":
			break;
		case "Bonus":
			break;
		case "ReturnStake":
			break;
		case "GetBetStatus":
			break;
	}
});

module.exports = router;
