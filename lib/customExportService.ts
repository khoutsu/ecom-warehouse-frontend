import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  InventoryReport, 
  SalesReport, 
  LowStockReport, 
  ProductSalesReport 
} from './dashboardService';

// Add Thai font support for jsPDF
declare module 'jspdf' {
  interface jsPDF {
    addFont(font: string, fontName: string, fontStyle: string): void;
    setFont(fontName: string, fontStyle?: string): void;
  }
}

// Configure proper Thai font for jsPDF
const configureThaiFont = (doc: jsPDF) => {
  // Use Times font which has better Thai character support in jsPDF
  doc.setFont('times', 'normal');
  
  // Set proper language for Thai
  doc.setLanguage('th');
};

// Custom PDF export with Thai-style formatting similar to your image
export const exportCustomInventoryReportToPDF = (data: InventoryReport[]) => {
  const doc = new jsPDF();
  
  // Set proper Thai font support
  configureThaiFont(doc);
  
  // Set basic document info without any protection or encryption
  doc.setDocumentProperties({
    title: 'รายงานสินค้าคงเหลือ',
    subject: 'Inventory Report',
    author: 'System',
    keywords: 'inventory, report',
    creator: 'Warehouse System'
  });
  
  // Header with reference number and date (similar to your image)
  doc.setFontSize(12);
  doc.text('#2 " 2 * 4 12 @+%7-', 20, 20);
  doc.text("'1 5H: 9/9/2568", 20, 30);
  
  // Main title bar (blue background like in your image)
  doc.setFillColor(70, 130, 180); // Steel blue
  doc.rect(20, 40, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('รหัสสินค้า', 25, 46);
  doc.text('ชื่อสินค้า', 60, 46);
  doc.text('หมวดหมู่', 100, 46);
  doc.text('คงเหลือ', 130, 46);
  doc.text('ขั้นต่ำ', 150, 46);
  doc.text('สถานะ', 170, 46);
  
  // Reset text color for data
  doc.setTextColor(0, 0, 0);
  
  // Prepare data in the format similar to your image with Thai product names
  const tableData = data.map((item, index) => {
    const code = `สินค้า ${String(index + 1).padStart(3, '0')}`;
    const status = getThaiStatusCode(item.status);
    const productName = formatThaiText(item.productName);
    const category = formatThaiText(item.category);
    
    return [
      code,
      productName.substring(0, 20),
      category.substring(0, 15),
      item.currentStock.toString(),
      item.minStock.toString(),
      item.maxStock.toString(),
      status,
      'ปกติ'
    ];
  });
  
  // Create table with custom styling and Times font support
  autoTable(doc, {
    body: tableData,
    startY: 50,
    styles: { 
      font: 'times', 
      fontSize: 12,
      cellPadding: 2,
      fontStyle: 'normal'
    },
    headStyles: {
      fillColor: [70, 130, 180],
      textColor: 255,
      fontStyle: 'bold',
      font: 'times'
    },
    columnStyles: {
      0: { cellWidth: 25 },  // รหัสสินค้า
      1: { cellWidth: 40 },  // ชื่อสินค้า
      2: { cellWidth: 25 },  // หมวดหมู่
      3: { cellWidth: 20, halign: 'center' },  // คงเหลือ
      4: { cellWidth: 20, halign: 'center' },  // ขั้นต่ำ
      5: { cellWidth: 20, halign: 'center' },  // ขั้นสูง
      6: { cellWidth: 25 },  // สถานะ
      7: { cellWidth: 15 }   // สถานะระบบ
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 20, right: 20 }
  });
  
  // Add footer section (similar to your image)
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text('C D11', 20, finalY);
  doc.text('C D11 1', 70, finalY);
  doc.text('2', 100, finalY);
  doc.text('20', 120, finalY);
  doc.text('*4', 140, finalY);
  doc.text('12C %1+1', 160, finalY);
  
  doc.text("' +%5 2 C D11H", 20, finalY + 10);
  doc.text("' +%5 0", 70, finalY + 10);
  doc.text('10', 100, finalY + 10);
  doc.text('1000', 120, finalY + 10);
  doc.text('*4', 140, finalY + 10);
  doc.text('12+1', 160, finalY + 10);
  
  doc.save('inventory-report-thai-style.pdf');
};

// Export sales report in Thai government document style
export const exportCustomSalesReportToPDF = (data: SalesReport[]) => {
  const doc = new jsPDF();
  
  // Set proper Thai font support
  configureThaiFont(doc);
  
  // Set basic document info without any protection or encryption
  doc.setDocumentProperties({
    title: 'รายงานยอดขาย',
    subject: 'Sales Report',
    author: 'System',
    keywords: 'sales, report',
    creator: 'Warehouse System'
  });
  
  // Document header with Thai text
  doc.setFontSize(16);
  doc.text('รายงานยอดขาย', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`เอกสารเลขที่: SR${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`, 20, 35);
  doc.text(`วันที่: ${new Date().toLocaleDateString('th-TH')}`, 20, 45);
  
  // Create header bar
  doc.setFillColor(70, 130, 180);
  doc.rect(20, 55, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('รหัสคำสั่งซื้อ', 25, 62);
  doc.text('ลูกค้า', 60, 62);
  doc.text('ยอดขาย', 100, 62);
  doc.text('สถานะ', 130, 62);
  doc.text('วันที่', 160, 62);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Prepare sales data with proper Thai formatting
  const salesTableData = data.slice(0, 15).map(item => [
    item.orderId.slice(-8),
    formatThaiText(item.customerName).length > 15 ? formatThaiText(item.customerName).substring(0, 15) + '...' : formatThaiText(item.customerName),
    `฿${item.totalAmount.toLocaleString()}`,
    getThaiOrderStatus(item.status),
    item.orderDate ? new Date(item.orderDate.seconds * 1000).toLocaleDateString('th-TH') : '-'
  ]);
  
  autoTable(doc, {
    body: salesTableData,
    startY: 68,
    styles: { 
      font: 'times', 
      fontSize: 12,
      cellPadding: 3,
      fontStyle: 'normal'
    },
    headStyles: {
      fillColor: [70, 130, 180],
      textColor: 255,
      fontStyle: 'bold',
      font: 'times'
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 }
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 20, right: 20 }
  });
  
  // Add summary at bottom
  const totalRevenue = data.reduce((sum, item) => sum + item.totalAmount, 0);
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('สรุปรายงาน', 20, finalY);
  doc.setFont('times', 'normal');
  doc.text(`จำนวนคำสั่งซื้อทั้งหมด: ${data.length} รายการ`, 20, finalY + 10);
  doc.text(`ยอดขายรวม: ฿${totalRevenue.toLocaleString()}`, 20, finalY + 20);
  
  // Add signature section
  doc.text('ผู้จัดทำรายงาน: _______________________', 20, finalY + 40);
  doc.text('วันที่: _______________________', 120, finalY + 40);
  
  doc.save('sales-report-thai-style.pdf');
};

// Export low stock report in government document format
export const exportCustomLowStockReportToPDF = (data: LowStockReport[]) => {
  const doc = new jsPDF();
  
  // Set proper Thai font support
  configureThaiFont(doc);
  
  // Set basic document info without any protection or encryption
  doc.setDocumentProperties({
    title: 'รายงานสินค้าที่ต้องสั่งซื้อ',
    subject: 'Low Stock Report',
    author: 'System',
    keywords: 'stock, report',
    creator: 'Warehouse System'
  });
  
  // Header with Thai text
  doc.setFontSize(16);
  doc.text('รายงานสินค้าที่ต้องสั่งซื้อ', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`เอกสารเลขที่: LS${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`, 20, 35);
  doc.text(`วันที่: ${new Date().toLocaleDateString('th-TH')}`, 20, 45);
  
  // Priority summary
  const critical = data.filter(item => item.priority === 'critical').length;
  const warning = data.filter(item => item.priority === 'warning').length;
  const reorder = data.filter(item => item.priority === 'reorder').length;
  
  doc.setFillColor(220, 53, 69); // Red for critical
  doc.rect(20, 55, 50, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(`วิกฤต: ${critical}`, 25, 61);
  
  doc.setFillColor(255, 193, 7); // Yellow for warning  
  doc.rect(75, 55, 50, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text(`เตือน: ${warning}`, 80, 61);
  
  doc.setFillColor(0, 123, 255); // Blue for reorder
  doc.rect(130, 55, 50, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(`สั่งซื้อ: ${reorder}`, 135, 61);
  
  // Table header
  doc.setFillColor(70, 130, 180);
  doc.rect(20, 70, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('รหัสสินค้า', 25, 77);
  doc.text('ชื่อสินค้า', 55, 77);
  doc.text('คงเหลือ', 95, 77);
  doc.text('ต่ำสุด', 120, 77);
  doc.text('ต้องเติม', 140, 77);
  doc.text('ความสำคัญ', 165, 77);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Sort by priority and prepare data
  const sortedData = [...data].sort((a, b) => {
    const priorityOrder = { critical: 3, warning: 2, reorder: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
  
  const tableData = sortedData.map((item, index) => [
    `สินค้า ${String(index + 1).padStart(3, '0')}`,
    formatThaiText(item.productName).length > 20 ? formatThaiText(item.productName).substring(0, 20) + '...' : formatThaiText(item.productName),
    item.currentStock.toString(),
    item.minStock.toString(),
    item.difference.toString(),
    getThaiPriorityText(item.priority)
  ]);
  
  autoTable(doc, {
    body: tableData,
    startY: 83,
    styles: { 
      font: 'times', 
      fontSize: 12,
      cellPadding: 3,
      fontStyle: 'normal'
    },
    headStyles: {
      fillColor: [70, 130, 180],
      textColor: 255,
      fontStyle: 'bold',
      font: 'times'
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 45 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'center' }
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 20, right: 20 }
  });
  
  doc.save('low-stock-report-thai-style.pdf');
};

// Export top selling products report in Thai style
export const exportCustomTopSellingProductsToPDF = (data: ProductSalesReport[]) => {
  const doc = new jsPDF();
  
  // Set proper Thai font support
  configureThaiFont(doc);
  
  // Set basic document info without any protection or encryption
  doc.setDocumentProperties({
    title: 'รายงานสินค้าขายดี',
    subject: 'Top Selling Report',
    author: 'System',
    keywords: 'products, report',
    creator: 'Warehouse System'
  });
  
  // Header with Thai text
  doc.setFontSize(16);
  doc.text('รายงานสินค้าขายดี', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`เอกสารเลขที่: TS${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`, 20, 35);
  doc.text(`วันที่: ${new Date().toLocaleDateString('th-TH')}`, 20, 45);
  
  // Create header bar
  doc.setFillColor(70, 130, 180);
  doc.rect(20, 55, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('อันดับ', 25, 62);
  doc.text('รหัสสินค้า', 50, 62);
  doc.text('ชื่อสินค้า', 85, 62);
  doc.text('จำนวนขาย', 130, 62);
  doc.text('ยอดขาย', 165, 62);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Prepare top selling products data with Thai formatting
  const topProductsTableData = data.slice(0, 20).map((item, index) => [
    `#${index + 1}`,
    item.productId.slice(-6),
    formatThaiText(item.productName).length > 25 ? formatThaiText(item.productName).substring(0, 25) + '...' : formatThaiText(item.productName),
    item.totalSold.toString(),
    `฿${item.revenue.toLocaleString()}`
  ]);
  
  autoTable(doc, {
    body: topProductsTableData,
    startY: 68,
    styles: { 
      font: 'times', 
      fontSize: 12,
      cellPadding: 3,
      fontStyle: 'normal'
    },
    headStyles: {
      fillColor: [70, 130, 180],
      textColor: 255,
      fontStyle: 'bold',
      font: 'times'
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 60 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 20, right: 20 }
  });
  
  // Add summary at bottom
  const totalQuantity = data.reduce((sum, item) => sum + item.totalSold, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('สรุปสินค้าขายดี', 20, finalY);
  doc.setFont('times', 'normal');
  doc.text(`จำนวนสินค้าทั้งหมด: ${data.length} รายการ`, 20, finalY + 10);
  doc.text(`ยอดขายรวม: ${totalQuantity.toLocaleString()} ชิ้น`, 20, finalY + 20);
  doc.text(`มูลค่ารวม: ฿${totalRevenue.toLocaleString()}`, 20, finalY + 30);
  
  // Add signature section
  doc.text('ผู้จัดทำรายงาน: _______________________', 20, finalY + 50);
  doc.text('วันที่: _______________________', 120, finalY + 50);
  
  doc.save('top-selling-products-thai-style.pdf');
};

// Helper functions for Thai text conversion
function getThaiStatusCode(status: string): string {
  switch (status) {
    case 'in_stock': return 'มีสินค้า';
    case 'low_stock': return 'ใกล้หมด';
    case 'out_of_stock': return 'หมดสต็อก';
    default: return 'ไม่ทราบ';
  }
}

function getThaiOrderStatus(status: string): string {
  switch (status) {
    case 'pending': return 'รอดำเนินการ';
    case 'confirmed': return 'ยืนยันแล้ว';
    case 'processing': return 'กำลังเตรียม';
    case 'shipped': return 'จัดส่งแล้ว';
    case 'delivered': return 'ส่งสำเร็จ';
    case 'cancelled': return 'ยกเลิก';
    default: return status;
  }
}

function getThaiPriorityText(priority: string): string {
  switch (priority) {
    case 'critical': return 'วิกฤต';
    case 'warning': return 'เตือน';
    case 'reorder': return 'สั่งซื้อ';
    default: return priority;
  }
}

// Format Thai text for better PDF display
function formatThaiText(text: string): string {
  // Ensure proper encoding and remove any problematic characters
  return text.replace(/[^\u0E00-\u0E7F\w\s\-().]/g, '').trim();
}
