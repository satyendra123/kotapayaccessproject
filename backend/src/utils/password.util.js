const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

async function getPasswordHash(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

module.exports = { verifyPassword, getPasswordHash };
