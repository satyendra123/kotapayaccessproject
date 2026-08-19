/**
 * Generic WebSocket connection pool/broadcast manager - ports app/ws/web.py's
 * WSHub. Not wired to any route by itself (same as the original); available
 * for future broadcast features.
 */
class WSHub {
  constructor() {
    this._clients = new Set();
  }

  add(ws) {
    this._clients.add(ws);
  }

  remove(ws) {
    this._clients.delete(ws);
  }

  broadcast(message) {
    const payload = JSON.stringify(message);
    for (const ws of this._clients) {
      try {
        ws.send(payload);
      } catch {
        this.remove(ws);
      }
    }
  }
}

module.exports = new WSHub();
