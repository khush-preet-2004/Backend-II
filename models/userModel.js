const fs = require("fs");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const usersFile = "./data/users.json";

const readUsers = () => {
  return JSON.parse(fs.readFileSync(usersFile, "utf-8"));
};

const writeUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

const registerUser = (username, password, role) => {
  const users = readUsers();
  if (users.find((u) => u.username === username)) return false;
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ id: uuidv4(), username, password: hashedPassword, role });
  writeUsers(users);
  return true;
};

const authenticateUser = (username, password) => {
  const users = readUsers();
  const user = users.find((u) => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  }
  return null;
};

module.exports = { registerUser, authenticateUser };
