const express = require("express");
const translate = require("@vitalets/google-translate-api");

const router = express.Router();

// POST /api/translate
router.post("/", async (req, res) => {
  const { text, to } = req.body; // { text: "Apple", to: "ta" }
  try {
    const result = await translate(text, { to: to || "ta" });
    res.json({ translated: result.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Translation failed" });
  }
});

module.exports = router;
