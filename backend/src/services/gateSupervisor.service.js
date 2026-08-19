const { Op, fn, col, where: sequelizeWhere } = require("sequelize");
const gateConfig = require("../config/gateConfig");
const PiGateClient = require("./piGateClient.service");
const parkAccessService = require("./parkAccess.service");
const { CustomerTicket, GateMachine } = require("../models");

const BUFFER_TIMEOUT_MS = 12000;
const DEFAULT_DEDUPE_SECONDS = 2.0;
const DEDUPE_CLEANUP_EVERY_SECONDS = 60.0;
const DEDUPE_KEEP_FOR_SECONDS = 300.0;

function cleanBase64Chars(s) {
  return (s || "").replace(/[^A-Za-z0-9+/=]/g, "");
}

function isValidTicketNumber(s) {
  return !!s && /^[0-9]+$/.test(s) && s.length >= 10;
}

function b64ToDigits(s) {
  if (!s) return null;
  const trimmed = s.trim();
  const padded = trimmed + "=".repeat((4 - (trimmed.length % 4)) % 4);

  let decoded;
  try {
    decoded = Buffer.from(padded, "base64").toString("utf8").trim();
    if (decoded.includes("�")) return null; // mirrors Python's errors="strict" UnicodeDecodeError
  } catch {
    return null;
  }

  return isValidTicketNumber(decoded) ? decoded : null;
}

class GateSupervisor {
  constructor() {
    this.client = null;
    this.running = false;

    this._enqrBuffer = "";
    this._bufferResetTimer = null;

    this._lastSeen = new Map();
    this._lastCleanupEpoch = 0;
  }

  get dedupeSeconds() {
    const v = Number(gateConfig.DEDUPE_SECONDS);
    return v > 0 ? v : DEFAULT_DEDUPE_SECONDS;
  }

  async start() {
    if (this.running) return;
    this.running = true;
    this.client = new PiGateClient(gateConfig.PI_HOST, gateConfig.PI_PORT);
    this._run();
  }

  async _run() {
    while (this.running) {
      try {
        await this.client.connect();
        console.log(`[GateSupervisor] Connected to PI ${gateConfig.PI_HOST}:${gateConfig.PI_PORT} (TEST MODE)`);
        console.log(
          `[GateSupervisor] TEST MODE: MACHINE_UID=${gateConfig.MACHINE_UID}, ` +
            `MAX_USES=${gateConfig.MAX_TICKET_USES}, DEDUPE_SECONDS=${this.dedupeSeconds}`
        );

        await this.client.listenForever((msg) => this._handlePiMessage(msg));
      } catch (err) {
        console.error(`[GateSupervisor] PI disconnected/error: ${err.message}`);
        try {
          if (this.client) await this.client.close();
        } catch {
          // ignore close errors, mirrors original best-effort cleanup
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  _resetBufferLater(ms) {
    if (this._bufferResetTimer) clearTimeout(this._bufferResetTimer);
    this._bufferResetTimer = setTimeout(() => {
      if (this._enqrBuffer) console.log("[GateSupervisor] ENQR buffer timeout -> clearing buffer");
      this._enqrBuffer = "";
    }, ms);
  }

  async _resolveTicketNumberFromDbQrFragment(fragment) {
    const frag = (fragment || "").trim();
    if (!frag) return null;

    const fragClean = cleanBase64Chars(frag).toLowerCase();
    if (fragClean.length < 4) return null;

    const likePattern = `%${fragClean}%`;

    const rows = await CustomerTicket.findAll({
      attributes: ["ticketNumber", "qrCode"],
      where: sequelizeWhere(fn("LOWER", fn("COALESCE", col("qr_code"), "")), { [Op.like]: likePattern }),
      limit: 2,
    });

    if (rows.length === 1) {
      const ticketNumber = rows[0].ticketNumber;
      if (ticketNumber && String(ticketNumber).trim()) {
        console.log(`[GateSupervisor] DB matched qr_code fragment '${fragClean}' -> ticket_number=${ticketNumber}`);
        return String(ticketNumber).trim();
      }
    } else if (rows.length > 1) {
      console.warn(`[GateSupervisor] DB fragment '${fragClean}' matched MULTIPLE tickets; cannot decide.`);
    } else {
      console.log(`[GateSupervisor] No DB match for qr_code fragment '${fragClean}'`);
    }

    return null;
  }

  async _resolveTicketNumber(bufferOrChunk) {
    const raw = (bufferOrChunk || "").trim();
    if (!raw) return null;

    if (isValidTicketNumber(raw)) return raw;

    const cleaned = cleanBase64Chars(raw);
    let out = b64ToDigits(cleaned);
    if (out) return out;

    for (let k = 1; k < Math.min(6, cleaned.length); k++) {
      out = b64ToDigits(cleaned.slice(k));
      if (out) {
        console.log(`[GateSupervisor] Decoded ticket after trimming first ${k} chars`);
        return out;
      }
    }

    return this._resolveTicketNumberFromDbQrFragment(raw);
  }

  async _gatesForConfiguredMachine() {
    const machines = await GateMachine.findAll({
      where: { machineUid: gateConfig.MACHINE_UID },
      attributes: ["gateId"],
    });
    const gateIds = [...new Set(machines.map((machine) => machine.gateId))];

    if (gateIds.length !== 1) {
      console.error(
        `[GateSupervisor] Expected exactly one Gate Machine with machine_uid=${gateConfig.MACHINE_UID}; found ${gateIds.length}. Gate will not open.`
      );
      return [];
    }

    return gateIds;
  }

  _dedupeCleanup(now) {
    if (now - this._lastCleanupEpoch < DEDUPE_CLEANUP_EVERY_SECONDS) return;

    const cutoff = now - DEDUPE_KEEP_FOR_SECONDS;
    for (const [key, ts] of this._lastSeen.entries()) {
      if (ts < cutoff) this._lastSeen.delete(key);
    }

    this._lastCleanupEpoch = now;
  }

  async _handlePiMessage(msg) {
    console.log(`[GateSupervisor] PI -> ${msg}`);

    if (msg.startsWith("|HLT%")) return;
    if (!(msg.startsWith("|") && msg.includes("%"))) return;

    const body = msg.slice(1, msg.indexOf("%"));
    if (!body.startsWith("ENQR-")) return;

    const chunk = body.slice("ENQR-".length).trim();
    if (!chunk || chunk.length <= 1) return;

    this._enqrBuffer += chunk;
    console.log(
      `[GateSupervisor] ENQR chunk='${chunk}' len=${chunk.length} buffer_len=${this._enqrBuffer.length} buffer='${this._enqrBuffer}'`
    );

    this._resetBufferLater(BUFFER_TIMEOUT_MS);

    const ticketNumber = await this._resolveTicketNumber(this._enqrBuffer);
    if (!ticketNumber) {
      console.log("[GateSupervisor] Could not resolve ticket yet (need more data or PI not sending full QR).");
      return;
    }

    console.log(`[GateSupervisor] Resolved ticket_number=${ticketNumber}`);
    this._enqrBuffer = "";

    const now = Date.now() / 1000;
    this._dedupeCleanup(now);

    const last = this._lastSeen.get(ticketNumber);
    if (last !== undefined && now - last < this.dedupeSeconds) {
      console.log(`[GateSupervisor] Debounced duplicate scan for ticket=${ticketNumber} (ignored)`);
      return;
    }
    this._lastSeen.set(ticketNumber, now);

    const gatesToTry = await this._gatesForConfiguredMachine();
    if (!gatesToTry.length) return;

    for (const gateId of gatesToTry) {
      const { success } = await parkAccessService.validateScan({
        gateId,
        machineUid: gateConfig.MACHINE_UID,
        ticketNumber,
      });

      console.log(`[GateSupervisor] Validate gate_id=${gateId}, ticket=${ticketNumber} => ${success}`);

      if (success === "valid") {
        console.log("[GateSupervisor] Opening gate (sending |OPENEN%\\r\\n)");
        if (this.client) await this.client.openGate();
        return;
      }

      if (success === "invalid_same_gate") {
        console.log(`[GateSupervisor] Same gate repeat blocked (gate_id=${gateId})`);
      } else if (success === "invalid_member_limit_reached") {
        console.log("[GateSupervisor] All paid members on this group ticket have already entered.");
      }
    }

    console.log(`[GateSupervisor] Ticket invalid for all tried gates ${JSON.stringify(gatesToTry)} in TEST MODE.`);
  }
}

module.exports = GateSupervisor;
