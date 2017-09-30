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

//define user Schema
let userSchema = new Schema({
  id: String,
  openid: String,
  name: String,
  sex: Number,
  head: String,
  lastLogin: { type: Date, default: Date.now},
  enable: { type: Boolean, default: true }
});


export default mongoose.model("user", userSchema);