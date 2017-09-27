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
let chistorySchema = new Schema({
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

export default  mongoose.model("sell_history", chistorySchema);