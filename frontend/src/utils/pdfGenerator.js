import jsPDF from 'jspdf';

export const generatePDF = (orderData, type = 'invoice', companyAddress = null) => {
  const doc = new jsPDF();
  const isQuotation = type === 'quotation';
  const title = isQuotation ? 'QUOTATION' : 'INVOICE / BILL';
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Header
  doc.setFontSize(20);
  doc.setTextColor(139, 92, 246); // Purple color
  doc.text('DealsDouble.ai', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, margin, yPosition);
  
  yPosition += 15;

  // Seller Address (Company Address)
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('From (Seller):', margin, yPosition);
  yPosition += 6;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  const companyName = orderData.company_name || 'Seller Company';
  doc.text(companyName, margin, yPosition);
  
  yPosition += 6;
  doc.setFont(undefined, 'normal');
  if (companyAddress && companyAddress !== 'Address not provided') {
    const addressLines = doc.splitTextToSize(companyAddress, contentWidth);
    addressLines.forEach(line => {
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
  } else {
    doc.text('Address: Not provided', margin, yPosition);
    yPosition += 6;
  }
  
  if (orderData.company_phone) {
    doc.text(`Phone: ${orderData.company_phone}`, margin, yPosition);
    yPosition += 6;
  }
  if (orderData.company_gst) {
    doc.text(`GST Number: ${orderData.company_gst}`, margin, yPosition);
    yPosition += 6;
  }
  if (orderData.company_website) {
    doc.text(`Website: ${orderData.company_website}`, margin, yPosition);
    yPosition += 6;
  }

  yPosition += 5;

  // Buyer Address
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('To:', margin, yPosition);
  yPosition += 6;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(orderData.buyer_name || 'Buyer', margin, yPosition);
  
  yPosition += 6;
  doc.setFont(undefined, 'normal');
  doc.text(orderData.buyer_email || '', margin, yPosition);
  yPosition += 6;

  // Shipping Address
  if (orderData.shipping) {
    const shippingLines = [];
    if (orderData.shipping.name) shippingLines.push(orderData.shipping.name);
    if (orderData.shipping.address) shippingLines.push(orderData.shipping.address);
    if (orderData.shipping.city || orderData.shipping.state || orderData.shipping.pincode) {
      shippingLines.push(
        `${orderData.shipping.city || ''} ${orderData.shipping.state || ''} ${orderData.shipping.pincode || ''}`.trim()
      );
    }
    shippingLines.forEach(line => {
      if (line) {
        doc.text(line, margin, yPosition);
        yPosition += 6;
      }
    });
  }

  yPosition += 10;

  // Order Details Section
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Order ID: #${orderData.id}`, margin, yPosition);
  
  const orderDate = orderData.created_at 
    ? new Date(orderData.created_at).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : new Date().toLocaleDateString('en-IN');
  doc.text(`Date: ${orderDate}`, pageWidth - margin - 40, yPosition);
  
  yPosition += 15;

  // Product Details Table Header
  doc.setFillColor(139, 92, 246);
  doc.setDrawColor(139, 92, 246);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.rect(margin, yPosition - 6, contentWidth, 8, 'F');
  
  doc.text('Description', margin + 5, yPosition);
  doc.text('Qty', margin + 100, yPosition);
  doc.text('Unit Price', margin + 125, yPosition);
  doc.text('Total', pageWidth - margin - 25, yPosition, { align: 'right' });
  
  yPosition += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');

  // Product Row
  const productName = orderData.product_name || 'Product';
  const quantity = orderData.quantity || 1;
  const unitPrice = orderData.unit_price || 0;
  const totalAmount = orderData.total_amount || 0;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition - 4, pageWidth - margin, yPosition - 4);
  
  const productLines = doc.splitTextToSize(productName, 90);
  productLines.forEach((line, index) => {
    doc.text(line, margin + 5, yPosition + (index * 6));
  });
  
  // Calculate subtotal for product row (before GST)
  const productSubtotal = totalAmount / 1.18;
  
  const textY = yPosition + (productLines.length > 1 ? 3 : 0);
  doc.text(quantity.toString(), margin + 100, textY);
  doc.text(`₹${unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 125, textY);
  doc.text(`₹${productSubtotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, pageWidth - margin - 5, textY, { align: 'right' });
  
  yPosition += Math.max(productLines.length * 6, 10) + 5;

  // Total Section with GST
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Calculate GST breakdown: Assume totalAmount includes GST
  // To get base amount: totalAmount = base + (base * 0.18) = base * 1.18
  // So: base = totalAmount / 1.18
  const subtotal = totalAmount / 1.18; // Base amount before GST
  const gstAmount = totalAmount - subtotal; // GST amount (18% of subtotal)
  const grandTotal = totalAmount; // Grand total (already includes GST)

  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Subtotal
  doc.text('Subtotal:', pageWidth - margin - 50, yPosition);
  doc.text(`₹${subtotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, pageWidth - margin - 5, yPosition, { align: 'right' });
  yPosition += 8;

  // GST (18%)
  doc.text('GST (18%):', pageWidth - margin - 50, yPosition);
  doc.text(`₹${gstAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, pageWidth - margin - 5, yPosition, { align: 'right' });
  yPosition += 8;

  // Grand Total
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - margin - 55, yPosition - 2, pageWidth - margin, yPosition - 2);
  yPosition += 8;

  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Grand Total (Inclusive of GST):', pageWidth - margin - 50, yPosition);
  doc.setFontSize(14);
  doc.setTextColor(255, 107, 53); // Orange color
  doc.text(`₹${grandTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, pageWidth - margin - 5, yPosition, { align: 'right' });

  yPosition += 15;

  // Status and Payment Information
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  doc.text(`Status: ${(orderData.status || (isQuotation ? 'Pending Payment' : 'Completed')).toUpperCase()}`, margin, yPosition);
  
  if (!isQuotation) {
    yPosition += 6;
    const paymentMethod = orderData.payment_method || 'N/A';
    const paymentStatus = orderData.payment_status || 'Pending';
    doc.text(`Payment Method: ${paymentMethod.toUpperCase()}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Payment Status: ${paymentStatus.toUpperCase()}`, margin, yPosition);
    
    if (paymentMethod === 'cod') {
      yPosition += 8;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('Note: Payment will be collected on delivery. Please keep exact change ready.', margin, yPosition);
    }
  }

  yPosition += 20;

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for your business!', margin, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('For any queries, please contact the seller.', margin, yPosition, { align: 'center' });

  // Save PDF
  const fileName = `${isQuotation ? 'quotation' : 'invoice'}-${orderData.id || 'order'}.pdf`;
  doc.save(fileName);
};

