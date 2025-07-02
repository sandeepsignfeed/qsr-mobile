import fs from "fs";
import path from "path";
import os from "os";
import puppeteer from "puppeteer-core";
import { NextRequest, NextResponse } from "next/server";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

// ---------- Types ----------
interface OrderItem {
  name: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

interface OrderDetails {
  orderId: string;
  orderType: string;
  phone: string;
  totalAmount: number;
  totalGST: number;
  amountPaid?: number;
  billNumber?: string;
  items: OrderItem[];
}

interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  serviceTax?: number;
}

// ---------- Chrome Path ----------
function getSystemChromePath(): string {
  const chromePaths = [
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
    path.join("C:\\Program Files (x86)", "Google\\Chrome\\Application\\chrome.exe"),
    path.join("C:\\Program Files", "Google\\Chrome\\Application\\chrome.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Microsoft\\Edge\\Application\\msedge.exe"),
    path.join("C:\\Program Files (x86)", "Microsoft\\Edge\\Application\\msedge.exe"),
    path.join("C:\\Program Files", "Microsoft\\Edge\\Application\\msedge.exe"),
  ];
  const found = chromePaths.find(fs.existsSync);
  if (!found) throw new Error("System-installed Chrome or Edge not found.");
  return found;
}

// ---------- Bill Number ----------
function generateBillNumber(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const datePart = `${now.getFullYear().toString().slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${datePart}-${timePart}-${randomPart}`;
}

// ---------- PDF Generator ----------
async function generateInvoicePDF(
  orderDetails: OrderDetails,
  companyInfo: CompanyInfo
): Promise<{ filePath: string; billNumber: string }> {
  const isDineIn = orderDetails.orderType?.toLowerCase() === "dine-in";
  const serviceTax = isDineIn ? companyInfo.serviceTax ?? 0 : 0;
  const grandTotal = orderDetails.totalAmount;
  const paid = orderDetails.amountPaid ?? grandTotal;
  const balance = grandTotal - paid;

  const billNumber = orderDetails.billNumber || generateBillNumber();

  const invoiceHTML = `
    <!DOCTYPE html><html><head><style>
      body { font-family: 'Segoe UI', sans-serif; font-size: 9px; margin: 0; padding: 6px; color: #000; }
      .company { font-weight: bold; font-size: 10px; text-align: center; }
      .address, .info, .footer { text-align: center; font-size: 8px; }
      .line { border-top: 1px dashed #000; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 9px; }
      th, td { padding: 3px; }
      th { border-bottom: 1px dashed #000; text-align: left; }
      .amounts td { text-align: right; }
      .amounts td:first-child { text-align: left; }
      .highlight { font-weight: bold; }
      .footer { margin-top: 10px; color: #333; }
    </style></head><body>
      <div class="company">${companyInfo.name}</div>
      <div class="address">${companyInfo.address}, ${companyInfo.city}, ${companyInfo.state}</div>
      <div class="line"></div>
      <div class="info">
        <div>Bill No: <b>${billNumber}</b></div>
        <div>Invoice #: ${orderDetails.orderId}</div>
        <div>Date: ${new Date().toLocaleDateString()}</div>
        <div>Order Type: <b>${orderDetails.orderType}</b></div>
        <div>Mobile: ${orderDetails.phone}</div>
      </div>
      <div class="line"></div>
      <table><thead>
        <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr>
      </thead><tbody>
        ${orderDetails.items.map((item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.pricePerUnit.toFixed(1)}</td>
            <td>₹${item.totalPrice.toFixed(1)}</td>
          </tr>`).join("")}
      </tbody></table>
      <div class="line"></div>
      <table class="amounts">
        <tr><td>GST</td><td>₹${orderDetails.totalGST.toFixed(1)}</td></tr>
        <tr><td>Service Charge</td><td>${serviceTax.toFixed(1)}%</td></tr>
        <tr><td class="highlight">Total</td><td class="highlight">₹${grandTotal.toFixed(1)}</td></tr>
        <tr><td>Paid</td><td>₹${paid.toFixed(1)}</td></tr>
        <tr><td>Balance</td><td>₹${balance.toFixed(1)}</td></tr>
      </table>
      <div class="footer">Thank you for choosing us. Please visit again.</div>
    </body></html>
  `;

  const chromePath = getSystemChromePath();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    userDataDir: path.join(os.tmpdir(), "puppeteer-profile"),
  });

  const page = await browser.newPage();
  await page.setContent(invoiceHTML, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    width: "58mm",
    height: "100mm",
    printBackground: true,
  });

  await browser.close();

  const invoiceDir = path.join(process.cwd(), "public/invoices");
  fs.mkdirSync(invoiceDir, { recursive: true });

  const filename = `${orderDetails.orderId}.pdf`;
  const filePath = path.join(invoiceDir, filename);
  fs.writeFileSync(filePath, pdfBuffer);

  return { filePath: `/invoices/${filename}`, billNumber };
}

// ---------- POST Handler ----------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderDetails, companyInfo } = body as {
      orderDetails: OrderDetails;
      companyInfo: CompanyInfo;
    };

    if (!orderDetails || !companyInfo) {
      return NextResponse.json(
        { success: false, error: "Missing orderDetails or companyInfo" },
        { status: 400 }
      );
    }

    const { filePath, billNumber } = await generateInvoicePDF(orderDetails, companyInfo);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const invoiceUrl = `${baseUrl}${filePath}`;

    const fullPhone = orderDetails.phone.startsWith("+91")
      ? orderDetails.phone
      : `+91${orderDetails.phone}`;
    const smsMessage = `Thanks for your order! Bill No: ${billNumber}\nDownload your invoice: ${invoiceUrl}`;

    console.log("📲 Sending SMS to:", fullPhone);
    console.log("📄 Invoice URL:", invoiceUrl);

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    try {
      await client.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: fullPhone,
      });
    } catch (smsError) {
      console.error("❌ SMS send failed:", smsError);
      return NextResponse.json(
        {
          success: false,
          error: "SMS send failed",
          reason: smsError instanceof Error ? smsError.message : String(smsError),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, invoiceUrl, billNumber });

  } catch (err: unknown) {
    console.error("❌ Invoice generation or SMS error:", err);

    let message = "Internal Server Error";
    let stack: string | undefined;

    if (err instanceof Error) {
      message = err.message;
      stack = err.stack;
    }

    return NextResponse.json(
      {
        success: false,
        message,
        stack: process.env.NODE_ENV === "development" ? stack : undefined,
      },
      { status: 500 }
    );
  }
}
