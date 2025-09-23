const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const User = require("../models/User");
const neighbouringCities = require("../data/neighbouringCities.json");

// GET /api/mapped-products/:district/:state
router.get("/:district/:state", async (req, res) => {
  try {
    const { district, state } = req.params;

    // get all products, but also populate seller info
    let products = await Product.find()
      .populate("seller", "username name city district state mobile")
      .lean();

    // exclude current user's own products
    const userId = req.user?.id; // only works if auth middleware adds req.user
    if (userId) {
      products = products.filter((p) => p.seller?._id.toString() !== userId);
    }

    // priority assignment
    const neighbors = neighbouringCities[district] || [];

    products.forEach((p) => {
      if (!p.seller) {
        p.priority = 3; // lowest
        return;
      }

      if (p.seller.district === district && p.seller.state === state) {
        p.priority = 1; // same district + state → highest
      } else if (neighbors.includes(p.seller.district)) {
        p.priority = 2; // neighbouring district
      } else {
        p.priority = 3; // others
      }
    });

    // sort by priority (1 → 2 → 3)
    products.sort((a, b) => a.priority - b.priority);

    res.json(products);
  } catch (err) {
    console.error("Error fetching mapped products:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
