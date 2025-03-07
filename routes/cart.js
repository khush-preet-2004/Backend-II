const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// ✅ Load clothingproducts.json dynamically
const productsPath = path.join(__dirname, "..", "data", "clothingproducts.json");
let products = {};
if (fs.existsSync(productsPath)) {
    products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
} else {
    console.error("⚠️ Error: clothingproducts.json file not found in /data folder!");
}

// 🛒 View Cart
router.get("/", (req, res) => {
    if (!req.session.cart) {
        req.session.cart = []; // Initialize cart if not exists
    }
    res.render("cart", { cart: req.session.cart });
});

// ➕ Add to Cart
router.post("/add", (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }

    const { id, name, price, image } = req.body;
    let existingItem = req.session.cart.find(item => item.id == id);
    
    if (existingItem) {
        existingItem.quantity += 1; // Increment quantity if already in cart
    } else {
        req.session.cart.push({ id, name, price, image, quantity: 1 });
    }

    res.redirect("/cart");
});

// 🔄 Update Quantity
router.post("/update/:id", (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }

    const productId = req.params.id;
    const newQuantity = parseInt(req.body.quantity);
    let item = req.session.cart.find(item => item.id == productId);

    if (item && newQuantity > 0) {
        item.quantity = newQuantity;
    }

    res.redirect("/cart");
});

// ❌ Remove from Cart
router.get("/remove/:id", (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }

    req.session.cart = req.session.cart.filter(item => item.id != req.params.id);
    res.redirect("/cart");
});

// 🚀 Checkout (Dummy Route)
router.get("/checkout", (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.redirect("/cart");
    }
    res.render("checkout", { cart: req.session.cart });
});


module.exports = router;
