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
let buySchema = new Schema({
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

export default mongoose.model("buy_history", buySchema);