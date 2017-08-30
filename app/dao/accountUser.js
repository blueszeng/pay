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

//define account Schema
var accountSchema = new Schema({
  //id: String,
  id: String,
  userid: String,
  phone: String,
  login: Date,
  cards: { type: Number, default: 0 },
  power: { type: Number, default: 1 },
  enable:{ type: Boolean, default: true }
});

// accountSchema.plugin(autoIncrement.plugin, {
//     model: 'account',
//     field: 'id',
//     startAt: 100000,
//     incrementBy: 1
// });

module.exports = mongoose.model("account", accountSchema);