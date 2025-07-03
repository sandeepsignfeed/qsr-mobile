// lib/invoice-actions.ts
'use server';

import jsPDF from "jspdf";

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

function generateBillNumber(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const datePart = `${now.getFullYear().toString().slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `BILL-${datePart}-${timePart}-${randomPart}`;
}

export async function generateInvoiceAction(
  orderDetails: OrderDetails,
  companyInfo: CompanyInfo
) {
  try {
    console.log('🔥 Generating invoice via Server Action...');
    
    const isDineIn = orderDetails.orderType?.toLowerCase() === "dine-in";
    const serviceTaxRate = isDineIn ? (companyInfo.serviceTax ?? orderDetails.serviceTax ?? 0) : 0;
    
    // Calculate amounts
    const subtotal = orderDetails.totalAmount - orderDetails.totalGST;
    const serviceAmount = serviceTaxRate > 0 ? (subtotal * serviceTaxRate) / 100 : 0;
    const grandTotal = orderDetails.totalAmount + serviceAmount;
    const paid = orderDetails.amountPaid ?? grandTotal;
    const balance = grandTotal - paid;
    const billNumber = orderDetails.billNumber || generateBillNumber();

    // Create PDF
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200],
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
      if (line.trim()) {
        doc.text(line.trim(), centerX, yPos, { align: 'center' });
        yPos += 4;
      }
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
      [`Time:`, new Date().toLocaleTimeString('en-IN', { hour12: false })],
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

    doc.setFontSize(7);
    doc.text('Powered by Haldiram\'s', centerX, yPos, { align: 'center' });

    // Convert to base64 for download
    const pdfBase64 = doc.output('datauristring');
    
    console.log('✅ PDF generated successfully');

    return {
      success: true,
      billNumber,
      pdfBase64,
      message: "Invoice generated successfully",
      timestamp: new Date().toISOString()
    };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ Invoice generation error:", error);
    return {
      success: false,
      message: error.message || "Failed to generate invoice",
      error: "GENERATION_FAILED"
    };
  }
}