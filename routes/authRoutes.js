const express = require("express");
const { registerUser, authenticateUser } = require("../models/userModel");

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = authenticateUser(username, password);
  if (user) {
    req.session.user = user;
    return res.redirect("/dashboard");
  }
  res.send("Invalid credentials");
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", (req, res) => {
  const { username, password, role } = req.body;
  if (registerUser(username, password, role)) {
    return res.redirect("/login");
  }
  res.send("User already exists");
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

module.exports = router;
