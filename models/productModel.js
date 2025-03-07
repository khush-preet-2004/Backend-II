const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const productsFile = "./data/products.json";

const readProducts = () => JSON.parse(fs.readFileSync(productsFile, "utf-8"));

const writeProducts = (products) => {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
};

const addProduct = (name, price, description) => {
  const products = readProducts();
  products.push({ id: uuidv4(), name, price, description });
  writeProducts(products);
};

const deleteProduct = (id) => {
  const products = readProducts().filter((p) => p.id !== id);
  writeProducts(products);
};

module.exports = { addProduct, deleteProduct, readProducts };
