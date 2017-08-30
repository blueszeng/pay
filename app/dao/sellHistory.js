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
var chistorySchema = new Schema({
  id: Number,
  pid: String,
  uid: String,
  name: String,
  date: Date,
  count: Number,
  after: Number
});

chistorySchema.plugin(autoIncrement.plugin, {
    model: 'sell_history',
    field: 'id',
    startAt: 100000,
    incrementBy: 1
});

module.exports = mongoose.model("sell_history", chistorySchema);