var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
/*
schema type
String
Number
Date
Buffer
Boolean
Mixed
ObjectId
Array
*/

//define chistory Schema
var buySchema = new Schema({
  id: Number,
  uid: String,
  status: Number,
  date: Date,
  way: String,
  cost: Number,
  wxid: String,
  count: Number,
  after: Number
});

buySchema.plugin(autoIncrement.plugin, {
    model: 'buy_history',
    field: 'id',
    startAt: 10000000,
    incrementBy: 1
});

module.exports = mongoose.model("buy_history", buySchema);