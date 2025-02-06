const mongoose = require("mongoose");
const bonusSchema = new mongoose.Schema({
	username: {
		type: String
	},
	userid: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "users",
	},
	promotionId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'promotions',
		required: false
	},
	// bonusType: {
	// 	type: String,
	// },
	quantity: {
		type: Number,
		default: 0,
	},
	topUp:{
		type: Number,
		default: 0,
	},
	cashBalanceFirst:{
		type: Number,
		default: 0,
	},
	cashBalanceAfter:{
		type: Number,
		default: 0,
	},
	creditFirst:{
		type: Number,
		default: 0,
	},
	creditAfter:{
		type: Number,
		default: 0,
	},
	dataEntryStaff:{
		type: String,
	},
	creditTopupStaff:{
		type: String,
	},
	addTime:{
		type: Date,
		default: Date.now,
	},
	turnover:{
		type: Number,
	}
	
});
module.exports = mongoose.model("bonus", bonusSchema);
