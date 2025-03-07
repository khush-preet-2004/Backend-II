const express = require("express");
const { addProduct, deleteProduct, readProducts } = require("../models/productModel");

const router = express.Router();

router.get("/", (req, res) => {
  const products = readProducts();
  res.render("products", { products });
});

router.post("/add", (req, res) => {
  const { name, price, description } = req.body;
  addProduct(name, price, description);
  res.redirect("/products");
});

router.post("/delete/:id", (req, res) => {
  deleteProduct(req.params.id);
  res.redirect("/products");
});

module.exports = router;
