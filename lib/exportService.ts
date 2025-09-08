import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  InventoryReport, 
  SalesReport, 
  LowStockReport, 
  ProductSalesReport 
} from './dashboardService';

// Simple PDF exports with English headers to avoid Thai font encoding issues
export const exportInventoryReportToPDF = (data: InventoryReport[]) => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'normal');
  
  doc.setDocumentProperties({
    title: 'Inventory Report',
    subject: 'Inventory Report',
    author: 'System',
    creator: 'Warehouse System'
  });
  
  doc.setFontSize(20);
  doc.text('Inventory Report', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
  
  const tableData = data.map(item => [
    item.productName,
    item.category,
    item.currentStock.toString(),
    item.minStock.toString(),
    item.maxStock.toString(),
    getStatusTextEn(item.status)
  ]);
  
  autoTable(doc, {
    head: [['Product Name', 'Category', 'Current Stock', 'Min Stock', 'Max Stock', 'Status']],
    body: tableData,
    startY: 40,
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });
  
  doc.save('inventory-report.pdf');
};

export const exportSalesReportToPDF = (data: SalesReport[]) => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'normal');
  
  doc.setDocumentProperties({
    title: 'Sales Report',
    subject: 'Sales Report',
    author: 'System',
    creator: 'Warehouse System'
  });
  
  doc.setFontSize(20);
  doc.text('Sales Report', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
  
  const tableData = data.map(item => [
    item.orderId.slice(-8),
    item.customerName,
    item.totalAmount.toLocaleString(),
    getOrderStatusTextEn(item.status),
    item.orderDate ? new Date(item.orderDate.seconds * 1000).toLocaleDateString() : '-'
  ]);
  
  autoTable(doc, {
    head: [['Order ID', 'Customer', 'Sales Amount', 'Status', 'Date']],
    body: tableData,
    startY: 40,
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [46, 204, 113] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });
  
  doc.save('sales-report.pdf');
};

export const exportLowStockReportToPDF = (data: LowStockReport[]) => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'normal');
  
  doc.setDocumentProperties({
    title: 'Low Stock Report',
    subject: 'Low Stock Report',
    author: 'System',
    creator: 'Warehouse System'
  });
  
  doc.setFontSize(20);
  doc.text('Low Stock Report', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
  
  const tableData = data.map(item => [
    item.productName,
    item.category,
    item.currentStock.toString(),
    item.minStock.toString(),
    item.difference.toString(),
    getPriorityTextEn(item.priority)
  ]);
  
  autoTable(doc, {
    head: [['Product Name', 'Category', 'Current Stock', 'Min Stock', 'Need to Restock', 'Priority']],
    body: tableData,
    startY: 40,
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [231, 76, 60] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });
  
  doc.save('low-stock-report.pdf');
};

export const exportTopSellingProductsToPDF = (data: ProductSalesReport[]) => {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'normal');
  
  doc.setDocumentProperties({
    title: 'Top Selling Products Report',
    subject: 'Top Selling Products Report',
    author: 'System',
    creator: 'Warehouse System'
  });
  
  doc.setFontSize(20);
  doc.text('Top Selling Products Report', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
  
  const tableData = data.map((item, index) => [
    (index + 1).toString(),
    item.productName,
    item.category,
    item.totalSold.toString(),
    item.revenue.toLocaleString()
  ]);
  
  autoTable(doc, {
    head: [['Rank', 'Product Name', 'Category', 'Units Sold', 'Revenue']],
    body: tableData,
    startY: 40,
    styles: { font: 'helvetica', fontSize: 10 },
    headStyles: { fillColor: [155, 89, 182] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });
  
  doc.save('top-selling-products.pdf');
};

// Excel Export Functions (completely unprotected)
export const exportInventoryReportToExcel = (data: InventoryReport[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(item => ({
      'Product Name': item.productName,
      'Category': item.category,
      'Current Stock': item.currentStock,
      'Min Stock': item.minStock,
      'Max Stock': item.maxStock,
      'Status': getStatusTextEn(item.status),
      'Last Restocked': item.lastRestocked ? 
        new Date(item.lastRestocked.seconds * 1000).toLocaleDateString() : '-'
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
  
  workbook.Props = {
    Title: 'Inventory Report',
    Author: 'System'
  };
  
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array'
  });
  const data_blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  saveAs(data_blob, 'inventory-report.xlsx');
};

export const exportSalesReportToExcel = (data: SalesReport[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(item => ({
      'Order ID': item.orderId,
      'Customer': item.customerName,
      'Email': item.customerEmail,
      'Sales Amount': item.totalAmount,
      'Status': getOrderStatusTextEn(item.status),
      'Payment Status': getPaymentStatusTextEn(item.paymentStatus),
      'Date': item.orderDate ? 
        new Date(item.orderDate.seconds * 1000).toLocaleDateString() : '-'
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
  
  workbook.Props = {
    Title: 'Sales Report',
    Author: 'System'
  };
  
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array'
  });
  const data_blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  saveAs(data_blob, 'sales-report.xlsx');
};

export const exportLowStockReportToExcel = (data: LowStockReport[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(item => ({
      'Product Name': item.productName,
      'Category': item.category,
      'Current Stock': item.currentStock,
      'Min Stock': item.minStock,
      'Need to Restock': item.difference,
      'Priority': getPriorityTextEn(item.priority)
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Low Stock');
  
  workbook.Props = {
    Title: 'Low Stock Report',
    Author: 'System'
  };
  
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array'
  });
  const data_blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  saveAs(data_blob, 'low-stock-report.xlsx');
};

export const exportTopSellingProductsToExcel = (data: ProductSalesReport[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item, index) => ({
      'Rank': index + 1,
      'Product Name': item.productName,
      'Category': item.category,
      'Units Sold': item.totalSold,
      'Revenue': item.revenue
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Top Products');
  
  workbook.Props = {
    Title: 'Top Selling Products Report',
    Author: 'System'
  };
  
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array'
  });
  const data_blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  saveAs(data_blob, 'top-selling-products.xlsx');
};

// Helper functions for English text conversion
const getStatusTextEn = (status: string): string => {
  switch (status) {
    case 'in_stock': return 'In Stock';
    case 'low_stock': return 'Low Stock';
    case 'out_of_stock': return 'Out of Stock';
    default: return status;
  }
};

const getOrderStatusTextEn = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'confirmed': return 'Confirmed';
    case 'processing': return 'Processing';
    case 'shipped': return 'Shipped';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

const getPaymentStatusTextEn = (status: string): string => {
  switch (status) {
    case 'unpaid': return 'Unpaid';
    case 'paid': return 'Paid';
    case 'refunded': return 'Refunded';
    case 'failed': return 'Failed';
    default: return status;
  }
};

const getPriorityTextEn = (priority: string): string => {
  switch (priority) {
    case 'critical': return 'Critical';
    case 'warning': return 'Warning';
    case 'reorder': return 'Reorder';
    default: return priority;
  }
};
