const mongoose = require('mongoose');

//The transaction entries will always be stored irrespective whether the transaction is successful or not.
const bigpSchema = new mongoose.Schema({
  transaction: String,
  status: { //the transaction status
    type: Number,
    enum: [0, 1, -1, -2, -3], // enum statuses corresponding to the status codes 0 represnts initiated, 1 is accepted, -1 is rejected, -2 is error, -3 is pending
    required: true
  },
  token: String,
  redirect_to: String,
  Amount: String,
  Currency: String,
  MerchantCode: String,
  MerchantUsername: String,
  ReturnURL: String,
  FailedReturnURL: String,
  HTTPPostURL: String,
  ItemID: String,
  ItemDescription: String,
  PlayerId: String,
  Hash: String,
  BankCode: String,
  SenderVerification: Number,
  ClientFullName: String,
  Message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('bigp', bigpSchema);