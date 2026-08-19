const net = require("net");

/**
 * Generic raw-TCP command sender. Lower-level alternative to GateTCP/PiGateClient -
 * ported for fidelity with the Python service layer; not currently wired into any
 * route (same as the original).
 */
class GateControllerClient {
  constructor(host, port, timeout = 2000) {
    this.host = host;
    this.port = port;
    this.timeout = timeout;
  }

  send(command) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let settled = false;

      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        fn(value);
      };

      socket.setTimeout(this.timeout);
      socket.once("timeout", () => finish(reject, new Error("GateControllerClient timeout")));
      socket.once("error", (err) => finish(reject, err));

      socket.connect(this.port, this.host, () => {
        socket.write(command, "utf8");
      });

      socket.once("data", (data) => finish(resolve, data.toString("utf8")));
    });
  }
}

module.exports = GateControllerClient;
