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

//define user Schema
var userSchema = new Schema({
  id: String,
  openid: String,
  name: String,
  sex: Number,
  head: String,
  lastLogin: { type: Date, default: Date.now},
  enable: { type: Boolean, default: true }
});

userSchema.plugin(autoIncrement.plugin, {
    model: 'user',
    field: 'id',
    startAt: 10000,
    incrementBy: 1
});



module.exports = mongoose.model("user", userSchema);