import mongoose from 'mongoose'
import autoIncrement from 'mongoose-auto-increment'
let Schema = mongoose.Schema;
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
let dyh_order = new Schema({
  id: Number,
  openid: String,
  userid: String,
  status: Number,
  date: Date,
  way: String,
  cost: Number,
  wxid: String,
  count: Number,
  after: Number
});

dyh_order.plugin(autoIncrement.plugin, {
    model: 'dyh_order',
    field: 'id',
    startAt: 860000000,
    incrementBy: 1
});

export default mongoose.model("dyh_order", dyh_order);