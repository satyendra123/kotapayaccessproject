const { Sequelize } = require("sequelize");
const env = require("./env");

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: "mysql",
  logging: env.DB_LOGGING ? console.log : false,
  pool: {
    max: env.DB_POOL_MAX,
    min: env.DB_POOL_MIN,
    acquire: env.DB_POOL_ACQUIRE,
    idle: env.DB_POOL_IDLE,
  },
  retry: {
    max: 3,
  },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Polls the database until a connection succeeds (or DB_RETRY_MAX_ATTEMPTS is hit,
 * 0 = retry forever). Mirrors the Python app's pool_pre_ping health-checking, but at
 * boot time so the server doesn't crash-loop while MySQL is still starting up.
 */
async function connectWithRetry() {
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      await sequelize.authenticate();
      console.log(`[dbconnection] Connected to MySQL database "${env.DB_NAME}" at ${env.DB_HOST}:${env.DB_PORT}`);
      return sequelize;
    } catch (err) {
      console.error(`[dbconnection] Connection attempt ${attempt} failed: ${err.message}`);

      if (env.DB_RETRY_MAX_ATTEMPTS > 0 && attempt >= env.DB_RETRY_MAX_ATTEMPTS) {
        throw new Error(`[dbconnection] Could not connect to database after ${attempt} attempts`);
      }

      console.log(`[dbconnection] Retrying in ${env.DB_RETRY_INTERVAL_MS}ms...`);
      await sleep(env.DB_RETRY_INTERVAL_MS);
    }
  }
}

module.exports = { sequelize, connectWithRetry };
