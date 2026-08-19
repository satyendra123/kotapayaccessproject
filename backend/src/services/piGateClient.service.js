const net = require("net");

/**
 * Robust TCP client for the Raspberry Pi gate controller.
 *
 * Pi sends frames like:
 *   |HLT%
 *   |ENQR-xxxx%
 *   |ENCD-xxxx%
 *   |OPENEN%|OK%|HLT%
 *
 * We send:
 *   |OPENEN%\r\n
 */
class PiGateClient {
  constructor(host, port, timeout = 5000) {
    this.host = host;
    this.port = port;
    this.timeout = timeout;

    this.socket = null;
    this.connected = false;
    this.buffer = "";
  }

  connect() {
    return new Promise((resolve, reject) => {
      console.log(`[PiGateClient] Connecting to PI ${this.host}:${this.port}`);

      const socket = new net.Socket();
      this.socket = socket;
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        socket.destroy();
        reject(new Error("PiGateClient connect timeout"));
      }, this.timeout);

      socket.once("error", (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });

      socket.connect(this.port, this.host, () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.connected = true;
        this.buffer = "";
        console.log("[PiGateClient] Connected to PI");
        resolve();
      });
    });
  }

  async close() {
    if (this.socket) {
      console.log("[PiGateClient] Closing PI connection");
      this.socket.removeAllListeners();
      this.socket.destroy();
    }
    this.socket = null;
    this.connected = false;
    this.buffer = "";
  }

  isConnected() {
    return this.connected;
  }

  async send(message) {
    if (!this.socket || !this.connected) {
      throw new Error("PiGateClient not connected");
    }
    console.log(`[PiGateClient] NODE -> PI : ${message}`);
    return new Promise((resolve, reject) => {
      this.socket.write(message, "utf8", (err) => (err ? reject(err) : resolve()));
    });
  }

  async openGate() {
    // The controller processes a command only after the CRLF frame terminator.
    await this.send("|OPENEN%\r\n");
  }

  _extractFrames() {
    const frames = [];
    let buf = this.buffer;

    while (true) {
      const start = buf.indexOf("|");
      if (start === -1) {
        buf = "";
        break;
      }

      const end = buf.indexOf("%", start);
      if (end === -1) {
        buf = buf.slice(start);
        break;
      }

      frames.push(buf.slice(start, end + 1));
      buf = buf.slice(end + 1);
    }

    this.buffer = buf;
    return frames;
  }

  /**
   * Continuously read from PI. Resolves the returned promise only on
   * disconnect/error - the caller (GateSupervisor) treats that as the
   * trigger to reconnect, mirroring the Python ConnectionError-on-empty-read.
   */
  listenForever(onLine) {
    if (!this.socket) {
      throw new Error("PiGateClient not connected");
    }

    console.log("[PiGateClient] Started listening to PI messages");

    return new Promise((resolve, reject) => {
      this.socket.on("data", (data) => {
        const chunk = data.toString("utf8");
        if (!chunk) return;

        this.buffer += chunk;
        const frames = this._extractFrames();

        for (const rawFrame of frames) {
          const frame = rawFrame.trim();
          if (!frame) continue;
          if (frame.startsWith("|HLT%")) continue;

          console.log(`[PiGateClient] PI -> NODE : ${frame}`);
          Promise.resolve(onLine(frame)).catch((err) => console.error("[PiGateClient] onLine error:", err));
        }
      });

      this.socket.once("close", () => {
        this.connected = false;
        reject(new Error("PI disconnected"));
      });

      this.socket.once("error", (err) => {
        this.connected = false;
        reject(err);
      });
    });
  }
}

module.exports = PiGateClient;
