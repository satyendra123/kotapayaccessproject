const env = require("./env");

module.exports = {
  PI_HOST: env.PI_HOST,
  PI_PORT: env.PI_PORT,

  MACHINE_UID: env.PI_MACHINE_UID || `PI-${env.PI_HOST}-ENTRY`,

  MAX_TICKET_USES: 4,

  DEDUPE_SECONDS: 2.0,
};
