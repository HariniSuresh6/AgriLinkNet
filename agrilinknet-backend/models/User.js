const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  occupation: { type: String, required: true },
  state: { type: String, required: true },       
  district: { type: String, required: true },    
  city: { type: String, required: true },        
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
