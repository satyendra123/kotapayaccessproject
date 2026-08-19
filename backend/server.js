const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const os = require("os");
const { DataTypes } = require("sequelize");
const env = require("./src/config/env");
const { sequelize, connectWithRetry } = require("./src/config/dbconnection");
const apiRouter = require("./src/routes");
const authMiddleware = require("./src/middleware/auth.middleware");
const errorMiddleware = require("./src/middleware/error.middleware");
const GateSupervisor = require("./src/services/gateSupervisor.service");
const attachScannerWs = require("./src/ws/scanner.ws");
const app = express();

async function ensureMachineIpColumn() {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable("gate_machines");

  if (!columns.machine_ip) {
    await queryInterface.addColumn("gate_machines", "machine_ip", {
      type: DataTypes.STRING(45),
      allowNull: false,
      defaultValue: "",
    });
    console.log("Added machine_ip column to gate_machines.");
  }
}
const allowAnyOrigin = env.CORS_ORIGINS.includes("*");
app.use(
  cors({
    origin: allowAnyOrigin ? "*" : env.CORS_ORIGINS,
    credentials: !allowAnyOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: "*",
  })
);

app.use(morgan("combined"));
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Pay Access System for KOTA" });
});

app.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You have access",
    user: req.user,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    detail: "Not Found",
  });
});

// Error Middleware
app.use(errorMiddleware);

const server = http.createServer(app);
const gateSupervisor = new GateSupervisor();

async function start() {
  try {
    console.log("Starting up application...");

    // Connect Database
    await connectWithRetry();

    // Sync Models
    await sequelize.sync();
    await ensureMachineIpColumn();

    // Attach WebSocket
    attachScannerWs(server);

    // Start Gate Supervisor
    await gateSupervisor.start();

    const PORT = env.PORT || 3000;

    // Listen on all network interfaces
    server.listen(PORT, "0.0.0.0", () => {
      console.log("\n========================================");
      console.log("🚀 Server Started Successfully");
      console.log("========================================");
      console.log(`Local URL   : http://localhost:${PORT}`);

      const interfaces = os.networkInterfaces();

      Object.keys(interfaces).forEach((interfaceName) => {
        interfaces[interfaceName].forEach((iface) => {
          if (iface.family === "IPv4" && !iface.internal) {
            console.log(`Network URL : http://${iface.address}:${PORT}`);
          }
        });
      });

      console.log("========================================\n");
    });
  } catch (err) {
    console.error("Fatal error during startup:", err);
    process.exit(1);
  }
}

start();

module.exports = app;
