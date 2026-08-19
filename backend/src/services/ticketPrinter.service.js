const { execFile } = require("child_process");
const { generateQrBase64 } = require("../utils/qr.util");

const DEFAULT_PRINTER_NAME = "RP80 Printer(1)";
const PAPER_CHARACTERS = 42;

function clean(value) {
  return String(value ?? "-")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7E]/g, "?")
    .trim();
}

function formatTicketDate(value) {
  return new Date(value)
    .toLocaleString("en-IN")
    .replace(/\b(am|pm)\b/gi, (period) => period.toUpperCase());
}

function wrap(text, width = PAPER_CHARACTERS) {
  const words = clean(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function addQr(bytes, content) {
  const data = Buffer.from(clean(content), "ascii");
  if (data.length > 700) throw new Error("Ticket number is too long for QR printing");
  // ESC/POS native QR commands: model 2, module size 10, error correction M.
  bytes.push(Buffer.from([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));
  bytes.push(Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x0a]));
  bytes.push(Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]));
  const size = data.length + 3;
  bytes.push(Buffer.from([0x1d, 0x28, 0x6b, size & 0xff, size >> 8, 0x31, 0x50, 0x30]));
  bytes.push(data);
  bytes.push(Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));
}

function buildTicketData(ticket) {
  const bytes = [Buffer.from([0x1b, 0x40])]; // initialize printer
  const line = (text = "") => bytes.push(Buffer.from(`${text}\n`, "ascii"));
  const bold = (enabled) => bytes.push(Buffer.from([0x1b, 0x45, enabled ? 1 : 0]));
  const align = (position) => bytes.push(Buffer.from([0x1b, 0x61, position]));
  const feedLines = (count) => bytes.push(Buffer.from([0x1b, 0x64, count]));

  align(1);
  line("CHAMBAL RIVER FRONT, KOTA RAJASTHAN");
  line("------------------------------------------");
  align(1);
  line(`Date: ${formatTicketDate(ticket.ticketGenDateTime)}`);
  for (const item of wrap(`Customer: ${ticket.customerName}`)) line(item);
  line(`Mobile: ${clean(ticket.mobileNo)}`);
  for (const item of wrap(`Ticket For: ${ticket.ticketGenFor}`)) line(item);
  line(`Members: ${ticket.noOfMembers}  Price: Rs.${ticket.grandTotal}`);
  line("------------------------------------------");
  align(1); addQr(bytes, ticket.ticketNumber); line("");
  bold(true); line(`Ticket No: ${ticket.ticketNumber}`); bold(false);
  line("Do not fold QR code");
  line("");
  // bold(true); line("HOUSTON SYSTEMS"); bold(false);
  line("Powered by Houston Systems");
  // Eject the QR and footer past the print head without asking the driver to
  // feed an entire configured page. ESC d feeds exactly the requested lines.
  feedLines(8);
  // Do not send a cut command: RP80 printer variants without an auto-cutter can
  // report a print error when they receive it.
  return Buffer.concat(bytes);
}

function spoolRawTicket(printerName, data) {
  const printerBase64 = Buffer.from(printerName, "utf16le").toString("base64");
  const dataBase64 = data.toString("base64");
  const script = `
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class KotaRawPrinter {
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] public class DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }
 [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)] public static extern bool OpenPrinter(string name, out IntPtr handle, IntPtr defaults);
 [DllImport("winspool.drv", SetLastError=true)] public static extern bool ClosePrinter(IntPtr handle);
 [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)] public static extern int StartDocPrinter(IntPtr handle, int level, DOCINFO info);
 [DllImport("winspool.drv", SetLastError=true)] public static extern bool EndDocPrinter(IntPtr handle);
 [DllImport("winspool.drv", SetLastError=true)] public static extern bool StartPagePrinter(IntPtr handle);
 [DllImport("winspool.drv", SetLastError=true)] public static extern bool EndPagePrinter(IntPtr handle);
 [DllImport("winspool.drv", SetLastError=true)] public static extern bool WritePrinter(IntPtr handle, byte[] bytes, int count, out int written);
}
'@
$printer = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${printerBase64}'))
$bytes = [Convert]::FromBase64String('${dataBase64}')
$handle = [IntPtr]::Zero
if (-not [KotaRawPrinter]::OpenPrinter($printer, [ref]$handle, [IntPtr]::Zero)) { throw "Cannot open printer '$printer'" }
try {
  $info = New-Object KotaRawPrinter+DOCINFO; $info.pDocName = 'Kota Ticket'; $info.pDataType = 'RAW'
  if ([KotaRawPrinter]::StartDocPrinter($handle, 1, $info) -le 0) { throw 'Cannot start print document' }
  try {
    # RAW ESC/POS data defines its own receipt length. Wrapping it in a Windows
    # page makes some RP80 drivers feed the remaining configured page height.
    $written = 0
    if (-not [KotaRawPrinter]::WritePrinter($handle, $bytes, $bytes.Length, [ref]$written) -or $written -ne $bytes.Length) { throw 'Could not send complete ticket data' }
  } finally { [void][KotaRawPrinter]::EndDocPrinter($handle) }
} finally { [void][KotaRawPrinter]::ClosePrinter($handle) }`;
  return new Promise((resolve, reject) => {
    execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], { windowsHide: true, timeout: 20000 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve();
    });
  });
}

function spoolRenderedTicket(printerName, ticket, qrCode) {
  const ticketPayload = Buffer.from(JSON.stringify({
    date: formatTicketDate(ticket.ticketGenDateTime),
    customer: ticket.customerName,
    mobile: ticket.mobileNo,
    ticketFor: ticket.ticketGenFor,
    members: ticket.noOfMembers,
    price: ticket.grandTotal,
    number: ticket.ticketNumber,
  }), "utf8").toString("base64");
  const printerPayload = Buffer.from(printerName, "utf16le").toString("base64");
  const script = `
Add-Type -AssemblyName System.Drawing
$printer = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${printerPayload}'))
$ticket = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${ticketPayload}')) | ConvertFrom-Json
$qrBytes = [Convert]::FromBase64String('${qrCode}')
$qrStream = New-Object IO.MemoryStream(,$qrBytes)
$qr = [System.Drawing.Image]::FromStream($qrStream)
$document = New-Object System.Drawing.Printing.PrintDocument
$document.DocumentName = 'Kota Ticket'
$document.PrinterSettings.PrinterName = $printer
if (-not $document.PrinterSettings.IsValid) { throw "Printer '$printer' is not available" }
# Do not use PrintControllerWithStatusDialog: this runs from Node/PowerShell
# without an interactive print dialog and can submit a blank page on RP80.
$document.PrintController = New-Object System.Drawing.Printing.StandardPrintController
# Keep the printer driver's configured RP80 paper size. Custom PaperSize values
# are accepted by Windows but this RP80 driver produces blank output for them.
$document.OriginAtMargins = $false
$document.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)
# Keep a strongly typed delegate alive until Print() completes. A bare PowerShell
# script block can be garbage-collected before the driver's PrintPage event.
$printHandler = [System.Drawing.Printing.PrintPageEventHandler] {
  param($sender, $event)
  $g = $event.Graphics; $x = 5; $width = [int]$event.PageBounds.Width - 10; $y = 5
  $center = New-Object System.Drawing.StringFormat; $center.Alignment = [System.Drawing.StringAlignment]::Center
  $normal = New-Object System.Drawing.Font('Arial', 8); $bold = New-Object System.Drawing.Font('Arial', 8, [System.Drawing.FontStyle]::Bold)
  $title = New-Object System.Drawing.Font('Arial', 11, [System.Drawing.FontStyle]::Bold)
  $g.DrawString('HOUSTON SYSTEMS', $title, [System.Drawing.Brushes]::Black, (New-Object System.Drawing.RectangleF($x, $y, $width, 20)), $center); $y += 20
  $g.DrawString('CHAMBAL RIVER FRONT - KOTA RAJASTHAN', $bold, [System.Drawing.Brushes]::Black, (New-Object System.Drawing.RectangleF($x, $y, $width, 16)), $center); $y += 16
  $g.DrawLine([System.Drawing.Pens]::Black, $x, $y, $x + $width, $y); $y += 6
  $g.DrawString(('Date: ' + $ticket.date), $normal, [System.Drawing.Brushes]::Black, $x, $y); $y += 14
  $g.DrawString(('Customer: ' + $ticket.customer), $normal, [System.Drawing.Brushes]::Black, (New-Object System.Drawing.RectangleF($x, $y, $width, 28))); $y += 27
  $g.DrawString(('Mobile: ' + $ticket.mobile), $normal, [System.Drawing.Brushes]::Black, $x, $y); $y += 14
  $g.DrawString(('Ticket For: ' + $ticket.ticketFor), $normal, [System.Drawing.Brushes]::Black, (New-Object System.Drawing.RectangleF($x, $y, $width, 28))); $y += 27
  $g.DrawString(('Members: ' + $ticket.members + '    Price: Rs.' + $ticket.price), $bold, [System.Drawing.Brushes]::Black, $x, $y); $y += 17
  $g.DrawLine([System.Drawing.Pens]::Black, $x, $y, $x + $width, $y); $y += 7
  $g.DrawImage($qr, [int](($width - 150) / 2 + $x), $y, 150, 150); $y += 155
  $g.DrawString(('Ticket No: ' + $ticket.number), $bold, [System.Drawing.Brushes]::Black, (New-Object System.Drawing.RectangleF($x, $y, $width, 16)), $center); $y += 16
  $g.DrawString('Please do not fold the QR code', $bold, [System.Drawing.Brushes]::Black, (New-Object System.Drawing.RectangleF($x, $y, $width, 16)), $center)
  $event.HasMorePages = $false
}
$document.add_PrintPage($printHandler)
try { $document.Print() } finally { $document.remove_PrintPage($printHandler); $qr.Dispose(); $qrStream.Dispose(); $document.Dispose() }`;
  return new Promise((resolve, reject) => {
    execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], { windowsHide: true, timeout: 30000 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve();
    });
  });
}

async function printTicket(ticket) {
  if (process.platform !== "win32") throw new Error("Direct ticket printing is supported only on the Windows computer connected to the printer");
  const printerName = process.env.TICKET_PRINTER_NAME || DEFAULT_PRINTER_NAME;
  await spoolRawTicket(printerName, buildTicketData(ticket));
  return printerName;
}

module.exports = { printTicket };
