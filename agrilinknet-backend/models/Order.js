const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  buyer: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
  },
  seller: {
    id: { type: mongoose.Schema.Types.ObjectId },
    name: String,
    mobile: String,
  },
  product: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    category: String,
    pricePerUnit: Number,
  },
  quantityBought: Number,
  totalPrice: Number,
  boughtAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", OrderSchema);
