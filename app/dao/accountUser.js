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

//define account Schema
let accountSchema = new Schema({
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

export default mongoose.model("account", accountSchema);