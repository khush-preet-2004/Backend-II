const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const app = express();

// Set EJS as the view engine
app.set("view engine", "ejs");

// Middleware
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "ecommerce-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// ✅ Middleware to make `user` available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// JSON File Paths
const usersFile = "./data/users.json";
const productsFile = "./data/products.json";

// Helper functions for reading and writing JSON files
const readData = (file) => JSON.parse(fs.readFileSync(file, "utf-8"));
const writeData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Ensure data files exist
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, "[]");
if (!fs.existsSync(productsFile)) fs.writeFileSync(productsFile, "[]");

// Temporary storage for cart and orders
const cart = [];
const orders = [];

// Home Page
app.get("/", (req, res) => {
    const products = readData(productsFile); // Read products from products.json
    res.render("index", { products, user: req.session.user }); // Pass products to index.ejs
});

// ============================
// 🛡️ User Authentication Routes
// ============================



app.get("/login", (req, res) => {
  res.render("login"); // Make sure you have a login.ejs file in the views folder
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = readData(usersFile);
  const user = users.find((u) => u.username === username);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user;
    return res.redirect("/dashboard");
  }
  res.send("Invalid username or password. <a href='/login'>Try again</a>");
});

app.get("/register", (req, res) => res.render("register"));

app.post("/register", (req, res) => {
  const { username, password, role } = req.body;
  const users = readData(usersFile);

  if (users.find((u) => u.username === username)) {
    return res.send("User already exists. <a href='/register'>Try again</a>");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ id: uuidv4(), username, password: hashedPassword, role });
  writeData(usersFile, users);

  res.redirect("/login");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// ============================
// 📌 Protected Dashboard Route
// ============================
app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("dashboard");
});

// ============================
// 🛒 Product Management Routes
// ============================
app.get("/products", (req, res) => {
  const products = readData(productsFile);
  res.render("products", { products });
});

app.post("/products/add", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.send("Access Denied");

  const { name, price, description } = req.body;
  const products = readData(productsFile);
  products.push({ id: uuidv4(), name, price, description });
  writeData(productsFile, products);

  res.redirect("/products");
});

app.post("/products/delete/:id", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.send("Access Denied");

  const products = readData(productsFile).filter((p) => p.id !== req.params.id);
  writeData(productsFile, products);

  res.redirect("/products");
});

// ============================
// 🛒 Cart Functionality
// ============================
const cartRoutes = require("./routes/cart");
app.use("/cart", cartRoutes);

app.get("/cart", (req, res) => {
  res.render("cart", { cart, user: req.session.user });
});

app.post("/cart/add/:id", (req, res) => {
  const product = readData(productsFile).find(p => p.id === req.params.id);
  if (product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
  }
  res.redirect("/cart");
});

app.post("/cart/update/:id", (req, res) => {
  const item = cart.find(p => p.id === req.params.id);
  if (item) item.quantity = parseInt(req.body.quantity);
  res.redirect("/cart");
});

app.post("/cart/remove/:id", (req, res) => {
  const index = cart.findIndex(p => p.id === req.params.id);
  if (index !== -1) cart.splice(index, 1);
  res.redirect("/cart");
});

// ============================
// 🛍️ Checkout Process
// ============================
app.get("/checkout", (req, res) => {
  if (cart.length === 0) return res.redirect("/cart");
  res.render("checkout", { cart, user: req.session.user });
});

app.post("/checkout/process", (req, res) => {
  const orderId = uuidv4();
  const order = {
    id: orderId,
    user: req.session.user,
    items: [...cart],
    status: "Processing",
    deliveryDate: "3-5 Business Days",
  };
  orders.push(order);
  cart.length = 0;
  res.redirect(`/order-track?orderId=${orderId}`);
});

// ============================
//  payment page 
// ============================

// app.get("/payment", (req, res) => {
//   console.log("Session Data:", req.session); // Check all session data

//   const username = req.session.username; // Retrieve username from session
//   console.log("Username:", username); // Debugging step to check if username is available

//   if (!username) {
//       return res.status(400).send("Username is not available in session");
//   }

//   res.render("payment", { username });
// });

// app.post("/confirm-payment", (req, res) => {
//   console.log("Payment Details:", req.body);
//   res.redirect("/confirmation");  // Redirect to a confirmation page
// });

// app.get("/confirmation", (req, res) => {
//   res.send("<h2>Payment Successful! 🎉</h2><p>Thank you for shopping with us.</p>");
// });



// ============================
//  confirmation page
// ============================

// router.get("/payment", (req, res) => {
//   res.render("payment", { cart: req.session.cart || [] });
// });

// // Handle Payment Submission
// router.post("/confirm-payment", (req, res) => {
//   console.log("🛒 Payment Details Received:", req.body); // Simulate processing

//   // Simulating Payment Success ✅
//   req.session.cart = [];  // Clear the cart after payment

//   res.redirect("/confirmation");  // Redirect to confirmation page
// });

// // Confirmation Page Route
// router.get("/confirmation", (req, res) => {
//   res.render("confirmation");
// });

// ============================
// 🚚 Order Tracking
// ============================
app.get("/order-track", (req, res) => {
  const order = orders.find(o => o.id === req.query.orderId);
  res.render("order-tracking", { order, user: req.session.user });
});

app.get("/", (req, res) => {
    const products = readData(productsFile); // Read products data
    console.log(products);
    res.render("index", { products, user: req.session.user }); // Pass products to index.ejs
});

const clothingProducts = JSON.parse(fs.readFileSync('./data/clothingproducts.json', 'utf-8'));

// Route to render the clothing products page
app.get('/clothingproducts', (req, res) => {
    res.render('clothingproducts', { products: clothingProducts });
});

const productsPath = path.join(__dirname, '../clothingproducts.json');  // Adjusted path



app.get("/", (req, res) => {
    res.render("index");
});

// ============================
// 🚀 Start Server
// ============================
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

app.get("/test-session", (req, res) => {
  if (!req.session.cart) {
      req.session.cart = [];
  }
  res.send(`Cart Data: ${JSON.stringify(req.session.cart)}`);
});
