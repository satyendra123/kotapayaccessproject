const QRCode = require("qrcode");

/**
 * Generates a QR code PNG for `data` and returns it as a base64 string
 * (mirrors the Python app's qrcode+pillow generate_qr_base64 helper).
 */
async function generateQrBase64(data) {
  const buffer = await QRCode.toBuffer(data, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 5,
    width: 250,
    color: { dark: "#000000", light: "#ffffff" },
  });
  return buffer.toString("base64");
}

module.exports = { generateQrBase64 };
