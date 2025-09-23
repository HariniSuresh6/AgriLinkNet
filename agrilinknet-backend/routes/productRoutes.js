const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const neighboringCities = require("../data/neighbouringCities.json"); // your graph JSON

// Utility: BFS to calculate distances
function getDistrictDistances(state, startDistrict) {
  const graph = neighboringCities[state] || {};
  const queue = [[startDistrict, 0]];
  const visited = new Set([startDistrict]);
  const dist = {};

  while (queue.length > 0) {
    const [curr, d] = queue.shift();
    dist[curr] = d;

    for (const neighbor of graph[curr] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, d + 1]);
      }
    }
  }

  return dist;
}

// ✅ Add Product
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { name, category, pricePerUnit, quantity, expiryTime } = req.body;
    if (!name || !category || !pricePerUnit || !quantity || !expiryTime) {
      return res.status(400).json({ msg: "Please fill all fields" });
    }

    const seller = req.user;

    const newProduct = new Product({
      name,
      category,
      pricePerUnit,
      quantity,
      expiryTime,
      seller: {
        id: seller.id,
        name: seller.username,
        mobile: seller.mobile,
        city: seller.city,
        district: seller.district,
        state: seller.state,
      },
    });

    await newProduct.save();
    res.status(201).json({ msg: "Product added successfully", product: newProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get Products (priority: same district → neighbors → others)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();

    // fetch products (exclude own products + not expired)
    const products = await Product.find({
      expiryTime: { $gt: now },
      "seller.id": { $ne: user.id },
    }).lean();

    // Build district distance map using BFS
    const distMap = getDistrictDistances(user.state, user.district);

    // Group explicitly
    const sameDistrict = [];
    const neighboring = [];
    const others = [];

    products.forEach((p) => {
      const distance = distMap[p.seller.district];
      if (distance === 0) sameDistrict.push(p);
      else if (distance === 1) neighboring.push(p);
      else others.push(p);
    });

    // Sort each group by expiryTime
    const sortByExpiry = (arr) =>
      arr.sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime));

    const sortedProducts = [
      ...sortByExpiry(sameDistrict),
      ...sortByExpiry(neighboring),
      ...sortByExpiry(others),
    ];

    res.json(sortedProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ My Products (Seller Profile)
router.get("/my-products", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const products = await Product.find({ "seller.id": user.id }).lean();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Buy a Product
router.post("/buy/:id", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { quantity } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    if (new Date(product.expiryTime) <= new Date()) {
      return res.status(400).json({ msg: "Product has expired" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ msg: "Not enough stock available" });
    }

    product.quantity -= quantity;

    product.buyers.push({
      id: user.id,
      name: user.username,
      quantityBought: quantity,
      boughtAt: new Date(),
    });

    await product.save();

    res.json({ msg: "Purchase successful", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Bought Products
router.get("/bought", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const products = await Product.find({ "buyers.id": userId }).lean();

    const boughtProducts = products.map((p) => {
      const bought = p.buyers.find((b) => b.id.toString() === userId);
      return {
        productName: p.name,
        quantityBought: bought.quantityBought,
        boughtAt: bought.boughtAt,
        sellerName: p.seller.name,
        sellerMobile: p.seller.mobile,
      };
    });

    res.json(boughtProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
