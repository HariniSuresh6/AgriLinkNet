const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const router = express.Router();

// Create a new order
router.post("/", async (req, res) => {
  try {
    const { productId, buyerId } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: "Product not found" });
    if (product.sold) return res.status(400).json({ msg: "Product already sold" });

    const newOrder = new Order({
      product: productId,
      buyer: buyerId,
      seller: product.sellerId,
      quantity: 1,
      status: "Pending"
    });

    product.sold = true;
    await product.save();
    await newOrder.save();

    res.status(201).json({ msg: "Order placed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get ongoing orders for buyer
router.get("/buyer/:buyerId", async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.params.buyerId, status: { $ne: "Delivered" } })
      .populate("product")
      .populate("seller", "username email");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get completed orders for buyer
router.get("/buyer/:buyerId/completed", async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.params.buyerId, status: "Delivered" })
      .populate("product")
      .populate("seller", "username email");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
