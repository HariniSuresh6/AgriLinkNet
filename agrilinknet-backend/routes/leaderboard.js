const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Order = require("../models/Order");

// GET /api/leaderboard
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: "$seller.id",                // group by seller id
          username: { $first: "$seller.name" },
          mobile: { $first: "$seller.mobile" },
          productsSold: { $sum: "$quantityBought" },
        },
      },
      { $sort: { productsSold: -1 } },     // descending order
      { $limit: 10 },                       // top 10 sellers
    ]);

    const leaderboard = result.map((r) => ({
      userId: r._id.toString(),             // convert ObjectId to string
      username: r.username,
      mobile: r.mobile,
      productsSold: r.productsSold,
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
