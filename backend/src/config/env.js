require("dotenv").config();

const required = ["SECRET_KEY", "ALGORITHM", "DB_HOST", "DB_NAME", "DB_USER"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`One or more required environment variables are missing: ${key}`);
  }
}

module.exports = {
  PORT: parseInt(process.env.PORT || "8000", 10),

  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT || "3306", 10),
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME,
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || "10", 10),
  DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN || "0", 10),
  DB_POOL_ACQUIRE: parseInt(process.env.DB_POOL_ACQUIRE || "30000", 10),
  DB_POOL_IDLE: parseInt(process.env.DB_POOL_IDLE || "10000", 10),
  DB_RETRY_INTERVAL_MS: parseInt(process.env.DB_RETRY_INTERVAL_MS || "5000", 10),
  DB_RETRY_MAX_ATTEMPTS: parseInt(process.env.DB_RETRY_MAX_ATTEMPTS || "0", 10),
  DB_LOGGING: process.env.DB_LOGGING === "true",

  SECRET_KEY: process.env.SECRET_KEY,
  ALGORITHM: process.env.ALGORITHM,
  ACCESS_TOKEN_EXPIRE_MINUTES: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "30", 10),
  REFRESH_TOKEN_EXPIRE_DAYS: parseInt(process.env.REFRESH_TOKEN_EXPIRE_DAYS || "7", 10),
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || "",

  CORS_ORIGINS: (process.env.CORS_ORIGINS || "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  PI_HOST: process.env.PI_HOST || "192.168.2.41",
  PI_PORT: parseInt(process.env.PI_PORT || "6000", 10),
  PI_MACHINE_UID: process.env.PI_MACHINE_UID || "",
};
