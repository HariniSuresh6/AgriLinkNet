const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
require("dotenv").config();

console.log("MONGO_URI =", process.env.MONGO_URI); // Debugging check

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

async function seed() {
  try {
    // 1. Create a sample seller if none exists
    let seller = await User.findOne({ username: "seller1" });
    if (!seller) {
      seller = new User({
        username: "seller1",
        mobile: "9876543211",
        occupation: "Farmer",
        state: "Tamil Nadu",
        district: "Thoothukudi",
        city: "Kovilpatti",
        email: "seller1@example.com",
        password: "password123", // ⚠️ hash if schema requires
      });
      await seller.save();
      console.log("✅ Sample seller created");
    } else {
      console.log("ℹ️ Seller already exists");
    }

    // 2. Sample products
    const products = [
      { name: "Tomato", price: 30, quantity: 10, expiry: new Date(Date.now() + 2*3600*1000), category: "Vegetables", state: "Tamil Nadu", district: "Thoothukudi", city: "Kovilpatti", sellerId: seller._id },
      { name: "Brinjal", price: 25, quantity: 15, expiry: new Date(Date.now() + 5*3600*1000), category: "Vegetables", state: "Tamil Nadu", district: "Thoothukudi", city: "Kovilpatti", sellerId: seller._id },
      { name: "Banana", price: 40, quantity: 20, expiry: new Date(Date.now() + 6*3600*1000), category: "Fruits", state: "Tamil Nadu", district: "Pudukkottai", city: "Aranthangi", sellerId: seller._id },
      { name: "Mango", price: 60, quantity: 12, expiry: new Date(Date.now() + 8*3600*1000), category: "Fruits", state: "Tamil Nadu", district: "Pudukkottai", city: "Aranthangi", sellerId: seller._id }
    ];

    await Product.insertMany(products);
    console.log("✅ Sample products added!");
  } catch (err) {
    console.error("❌ Error seeding data:", err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
