const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Add Product (Seller)
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { name, category, pricePerUnit, quantity, expiryTime } = req.body;

    if (!name || !category || !pricePerUnit || !quantity || !expiryTime) {
      return res.status(400).json({ msg: "Please fill all fields" });
    }

    const seller = req.user; // From auth middleware

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
        state: seller.state
      }
    });

    await newProduct.save();
    res.status(201).json({ msg: "Product added successfully", product: newProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get Products (Filtered by proximity & not expired)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();

    const products = await Product.find({
      expiryTime: { $gt: now },
      "seller.id": { $ne: user.id } // Exclude own products
    }).lean();

    const sortedProducts = products.sort((a, b) => {
      if (a.seller.city === user.city && b.seller.city !== user.city) return -1;
      if (a.seller.city !== user.city && b.seller.city === user.city) return 1;

      if (a.seller.district === user.district && b.seller.district !== user.district) return -1;
      if (a.seller.district !== user.district && b.seller.district === user.district) return 1;

      if (a.seller.state === user.state && b.seller.state !== user.state) return -1;
      if (a.seller.state !== user.state && b.seller.state === user.state) return 1;

      return new Date(a.expiryTime) - new Date(b.expiryTime); // earlier expiry first
    });

    res.json(sortedProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get products of logged-in user (Seller Profile)
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

// ✅ Buy a product
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

    // Reduce stock
    product.quantity -= quantity;

    // Add buyer record
    product.buyers.push({
      id: user.id,
      name: user.username,
      quantityBought: quantity,
      boughtAt: new Date()
    });

    await product.save();

    res.json({ msg: "Purchase successful", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get products bought by logged-in user
router.get("/bought", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const products = await Product.find({ "buyers.id": userId }).lean();

    const boughtProducts = products.map(p => {
      const bought = p.buyers.find(b => b.id.toString() === userId);
      return {
        productName: p.name,
        quantityBought: bought.quantityBought,
        boughtAt: bought.boughtAt,
        sellerName: p.seller.name,
        sellerMobile: p.seller.mobile
      };
    });

    res.json(boughtProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
