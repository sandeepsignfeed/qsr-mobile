// src/app/api/generate-invoice/route.ts

import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import fs from "fs";
import path from "path";
import twilio from "twilio";

// Types
interface OrderItem {
  name: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  taxPercentage?: number;
}

interface OrderDetails {
  orderId: string;
  customerName: string;
  orderType: string;
  phone: string;
  totalAmount: number;
  totalGST: number;
  amountPaid?: number;
  billNumber?: string;
  serviceTax?: number;
  items: OrderItem[];
}

interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  serviceTax?: number;
}

// Bill number generator
function generateBillNumber(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const datePart = `${now.getFullYear().toString().slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `BILL-${datePart}-${timePart}-${randomPart}`;
}

// PDF Generator with better formatting
async function generateInvoicePDF(
  orderDetails: OrderDetails,
  companyInfo: CompanyInfo
): Promise<{ filePath: string; billNumber: string }> {
  
  const isDineIn = orderDetails.orderType?.toLowerCase() === "dine-in";
  const serviceTaxRate = isDineIn ? (companyInfo.serviceTax ?? orderDetails.serviceTax ?? 0) : 0;
  
  // Calculate amounts properly
  const subtotal = orderDetails.totalAmount - orderDetails.totalGST;
  const serviceAmount = serviceTaxRate > 0 ? (subtotal * serviceTaxRate) / 100 : 0;
  const grandTotal = orderDetails.totalAmount + serviceAmount;
  const paid = orderDetails.amountPaid ?? grandTotal;
  const balance = grandTotal - paid;
  const billNumber = orderDetails.billNumber || generateBillNumber();

  console.log('🔥 Starting PDF generation...');
  console.log('📊 Amounts:', {
    subtotal: subtotal.toFixed(2),
    gst: orderDetails.totalGST.toFixed(2),
    serviceTaxRate: serviceTaxRate + '%',
    serviceAmount: serviceAmount.toFixed(2),
    grandTotal: grandTotal.toFixed(2),
    paid: paid.toFixed(2),
    balance: balance.toFixed(2)
  });

  // Create PDF - Thermal receipt size
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200], // 80mm width, 200mm height
    orientation: 'portrait'
  });

  let yPos = 8;
  const margin = 4;
  const pageWidth = 80;
  const centerX = pageWidth / 2;

  // Helper function for dashed line
  const drawDashedLine = (y: number) => {
    for (let x = margin; x < pageWidth - margin; x += 3) {
      doc.line(x, y, Math.min(x + 1.5, pageWidth - margin), y);
    }
  };

  // Company Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, centerX, yPos, { align: 'center' });
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const addressLines = companyInfo.address.split(',');
  addressLines.forEach(line => {
    doc.text(line.trim(), centerX, yPos, { align: 'center' });
    yPos += 4;
  });
  doc.text(`${companyInfo.city}, ${companyInfo.state}`, centerX, yPos, { align: 'center' });
  yPos += 6;

  // Dashed line
  drawDashedLine(yPos);
  yPos += 6;

  // Order Information
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER DETAILS', centerX, yPos, { align: 'center' });
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  const orderInfo = [
    [`Bill No:`, billNumber],
    [`Invoice #:`, orderDetails.orderId],
    [`Date:`, new Date().toLocaleDateString('en-IN')],
    [`Time:`, new Date().toLocaleTimeString('en-IN')],
    [`Customer:`, orderDetails.customerName],
    [`Phone:`, orderDetails.phone],
    [`Order Type:`, orderDetails.orderType.toUpperCase()]
  ];

  orderInfo.forEach(([label, value]) => {
    doc.text(label, margin, yPos);
    doc.text(value, margin + 25, yPos);
    yPos += 4;
  });

  yPos += 2;
  drawDashedLine(yPos);
  yPos += 6;

  // Items Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ITEMS', centerX, yPos, { align: 'center' });
  yPos += 5;

  // Items Table Header
  doc.setFontSize(8);
  doc.text('Item', margin, yPos);
  doc.text('Qty', 45, yPos);
  doc.text('Rate', 55, yPos);
  doc.text('Total', 68, yPos);
  yPos += 3;

  drawDashedLine(yPos);
  yPos += 4;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  orderDetails.items.forEach((item) => {
    const itemName = item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name;
    
    doc.text(itemName, margin, yPos);
    doc.text(item.quantity.toString(), 45, yPos);
    doc.text(`₹${item.pricePerUnit.toFixed(0)}`, 55, yPos);
    doc.text(`₹${item.totalPrice.toFixed(0)}`, 68, yPos);
    yPos += 4;
  });

  yPos += 2;
  drawDashedLine(yPos);
  yPos += 6;

  // Billing Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BILLING', centerX, yPos, { align: 'center' });
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  // Subtotal
  doc.text('Subtotal:', margin, yPos);
  doc.text(`₹${subtotal.toFixed(0)}`, 68, yPos);
  yPos += 4;

  // GST
  if (orderDetails.totalGST > 0) {
    doc.text('GST:', margin, yPos);
    doc.text(`₹${orderDetails.totalGST.toFixed(0)}`, 68, yPos);
    yPos += 4;
  }

  // Service Charge (only for dine-in)
  if (isDineIn && serviceTaxRate > 0) {
    doc.text(`Service Charge (${serviceTaxRate}%):`, margin, yPos);
    doc.text(`₹${serviceAmount.toFixed(0)}`, 68, yPos);
    yPos += 4;
  }

  yPos += 2;
  drawDashedLine(yPos);
  yPos += 4;

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL:', margin, yPos);
  doc.text(`₹${grandTotal.toFixed(0)}`, 68, yPos);
  yPos += 6;

  // Payment Status
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Amount Paid:', margin, yPos);
  doc.text(`₹${paid.toFixed(0)}`, 68, yPos);
  yPos += 4;

  if (balance > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due:', margin, yPos);
    doc.text(`₹${balance.toFixed(0)}`, 68, yPos);
    yPos += 4;
  } else if (balance < 0) {
    doc.text('Change Given:', margin, yPos);
    doc.text(`₹${Math.abs(balance).toFixed(0)}`, 68, yPos);
    yPos += 4;
  }

  yPos += 6;
  drawDashedLine(yPos);
  yPos += 8;

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for choosing us!', centerX, yPos, { align: 'center' });
  yPos += 4;
  doc.text('Please visit again.', centerX, yPos, { align: 'center' });
  yPos += 6;

  // QR Code placeholder (you can add actual QR code later)
  doc.setFontSize(7);
  doc.text('Scan for feedback:', centerX, yPos, { align: 'center' });

  // Save PDF
  const invoiceDir = path.join(process.cwd(), "public", "invoices");
  if (!fs.existsSync(invoiceDir)) {
    fs.mkdirSync(invoiceDir, { recursive: true });
  }

  const filename = `invoice_${orderDetails.orderId}_${billNumber}_${Date.now()}.pdf`;
  const filePath = path.join(invoiceDir, filename);
  
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, pdfBuffer);
  
  console.log(`✅ PDF saved: ${filename}`);
  return { filePath: `/invoices/${filename}`, billNumber };
}

// API Handler
export async function POST(request: NextRequest) {
  try {
    console.log('📨 Invoice generation request received');
    
    const body = await request.json();
    const { orderDetails, companyInfo } = body;

    // Enhanced validation
    if (!orderDetails || !companyInfo) {
      console.error('❌ Missing required data');
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing orderDetails or companyInfo",
          error: "MISSING_DATA"
        },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredOrderFields = ['orderId', 'phone', 'totalAmount', 'items'];
    const missingFields = requiredOrderFields.filter(field => !orderDetails[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}`,
          error: "INVALID_DATA"
        },
        { status: 400 }
      );
    }

    console.log('📋 Order Summary:', {
      orderId: orderDetails.orderId,
      customer: orderDetails.customerName || 'Guest',
      phone: orderDetails.phone,
      total: orderDetails.totalAmount,
      items: orderDetails.items.length
    });

    // Generate PDF
    const { filePath, billNumber } = await generateInvoicePDF(orderDetails, companyInfo);

    // Create full invoice URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://qsr-mobile.vercel.app";
    const invoiceUrl = `${baseUrl}${filePath}`;

    console.log("📄 Invoice URL:", invoiceUrl);

    // SMS functionality
    let smsStatus = "not_configured";
    let smsError = null;

    if (process.env.TWILIO_ACCOUNT_SID && 
        process.env.TWILIO_AUTH_TOKEN && 
        process.env.TWILIO_PHONE_NUMBER) {
      
      try {
        console.log('📱 Sending SMS...');
        
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

        // Format phone number
        let phoneNumber = orderDetails.phone.toString();
        if (!phoneNumber.startsWith('+91')) {
          phoneNumber = phoneNumber.startsWith('91') ? `+${phoneNumber}` : `+91${phoneNumber}`;
        }

        const customerName = orderDetails.customerName || 'Valued Customer';
        const smsMessage = `Dear ${customerName}, thank you for your order at Haldiram's! 🍽️

Bill No: ${billNumber}
Amount: ₹${orderDetails.totalAmount}

Download your invoice: ${invoiceUrl}

Visit us again soon!`;

        const message = await client.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber,
        });
        
        smsStatus = "sent";
        console.log("✅ SMS sent successfully:", message.sid);
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (smsErr: any) {
        console.error("❌ SMS failed:", smsErr);
        smsStatus = "failed";
        smsError = smsErr.message;
      }
    } else {
      console.log("⚠️ Twilio not configured - SMS skipped");
    }

    // Success response
    return NextResponse.json({ 
      success: true, 
      invoiceUrl, 
      billNumber,
      smsStatus,
      smsError,
      message: "Invoice generated successfully",
      timestamp: new Date().toISOString()
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ Invoice generation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate invoice",
        error: "GENERATION_FAILED",
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Handle other methods
export async function GET() {
  return NextResponse.json({
    message: "Invoice Generation API",
    version: "1.0",
    methods: ["POST"],
    status: "operational",
    timestamp: new Date().toISOString()
  });
}