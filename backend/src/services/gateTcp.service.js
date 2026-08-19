const net = require("net");
const env = require("../config/env");

class GateTCP {
  constructor(host = env.PI_HOST, port = env.PI_PORT, timeout = 2000) {
    this.host = host;
    this.port = port;
    this.timeout = timeout;
  }

  sendCommand(command) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let text = "";
      let settled = false;

      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        fn(value);
      };

      socket.setTimeout(this.timeout);
      socket.once("timeout", () => finish(reject, new Error("GateTCP timeout")));
      socket.once("error", (err) => finish(reject, err));

      socket.connect(this.port, this.host, () => {
        socket.write(command, "utf8");
      });

      socket.on("data", (data) => {
        text += data.toString("utf8");
        if (text.includes("|OK%")) {
          finish(resolve, text);
        }
      });

      // mirrors the Python client's short extra wait for a delayed "|OK%" chunk
      socket.once("close", () => finish(resolve, text));
    });
  }
}

module.exports = GateTCP;
