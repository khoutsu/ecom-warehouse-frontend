'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  getDashboardStats, 
  DashboardStats,
  InventoryReport,
  SalesReport,
  LowStockReport,
  ProductSalesReport 
} from '../../lib/dashboardService';
import {
  exportInventoryReportToPDF,
  exportInventoryReportToExcel,
  exportSalesReportToPDF,
  exportSalesReportToExcel,
  exportLowStockReportToPDF,
  exportLowStockReportToExcel,
  exportTopSellingProductsToPDF,
  exportTopSellingProductsToExcel
} from '../../lib/exportService';
import {
  exportCustomInventoryReportToPDF,
  exportCustomSalesReportToPDF,
  exportCustomLowStockReportToPDF,
  exportCustomTopSellingProductsToPDF
} from '../../lib/customExportService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { jsPDF } from 'jspdf';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeReport, setActiveReport] = useState<'inventory' | 'sales' | 'lowStock' | 'topSelling'>('inventory');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchDashboardData();
    }
  }, [user, isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const dashboardData = await getDashboardStats();
      setStats(dashboardData);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!stats) return;
    
    switch (activeReport) {
      case 'inventory':
        exportInventoryReportToPDF(stats.inventoryReport);
        break;
      case 'sales':
        exportSalesReportToPDF(stats.salesReport);
        break;
      case 'lowStock':
        exportLowStockReportToPDF(stats.lowStockReport);
        break;
      case 'topSelling':
        exportTopSellingProductsToPDF(stats.topSellingProducts);
        break;
    }
  };

  const handleCustomThaiExportPDF = () => {
    if (!stats) return;
    
    switch (activeReport) {
      case 'inventory':
        exportCustomInventoryReportToPDF(stats.inventoryReport);
        break;
      case 'sales':
        exportCustomSalesReportToPDF(stats.salesReport);
        break;
      case 'lowStock':
        exportCustomLowStockReportToPDF(stats.lowStockReport);
        break;
      case 'topSelling':
        exportCustomTopSellingProductsToPDF(stats.topSellingProducts);
        break;
    }
  };

  const handleExportExcel = () => {
    if (!stats) return;
    
    switch (activeReport) {
      case 'inventory':
        exportInventoryReportToExcel(stats.inventoryReport);
        break;
      case 'sales':
        exportSalesReportToExcel(stats.salesReport);
        break;
      case 'lowStock':
        exportLowStockReportToExcel(stats.lowStockReport);
        break;
      case 'topSelling':
        exportTopSellingProductsToExcel(stats.topSellingProducts);
        break;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="dashboard-container">
        <div className="access-denied">
          <h2>ไม่มีสิทธิ์เข้าถึง</h2>
          <p>หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
          <button onClick={() => router.push('/products')} className="back-button">
            กลับไปหน้าสินค้า
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-container">
        <div className="no-data">ไม่มีข้อมูลสำหรับแสดง</div>
      </div>
    );
  }

  // Prepare chart data
  const stockStatusData = [
    { name: 'มีสินค้า', value: stats.totalProducts - stats.lowStockCount - stats.outOfStockCount, color: '#28a745' },
    { name: 'สินค้าใกล้หมด', value: stats.lowStockCount, color: '#ffc107' },
    { name: 'สินค้าหมด', value: stats.outOfStockCount, color: '#dc3545' }
  ];

  const topSellingChartData = stats.topSellingProducts.slice(0, 5).map(item => ({
    name: item.productName.length > 15 ? item.productName.substring(0, 15) + '...' : item.productName,
    sold: item.totalSold,
    revenue: item.revenue
  }));

  const monthlyRevenueData = stats.monthlyRevenue.map(item => ({
    month: item.month,
    revenue: item.revenue,
    orders: item.orders
  }));

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1> แดชบอร์ดการจัดการ</h1>
        <p>ภาพรวมและรายงานระบบคลังสินค้า</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">

          <div className="card-content">
            <h3>สินค้าทั้งหมด</h3>
            <p className="card-number">{stats.totalProducts.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card">
        
          <div className="card-content">
            <h3>คำสั่งซื้อทั้งหมด</h3>
            <p className="card-number">{stats.totalOrders.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card">
        
          <div className="card-content">
            <h3>รายได้รวม</h3>
            <p className="card-number">฿{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card warning">
        
          <div className="card-content">
            <h3>สินค้าใกล้หมด</h3>
            <p className="card-number">{stats.lowStockCount.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card danger">
        
          <div className="card-content">
            <h3>สินค้าหมด</h3>
            <p className="card-number">{stats.outOfStockCount.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card">
        
          <div className="card-content">
            <h3>คำสั่งซื้อเดือนนี้</h3>
            <p className="card-number">{stats.recentOrdersCount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3> สถานะสินค้าคงเหลือ</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stockStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stockStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3> สินค้าขายดี Top 5</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSellingChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sold" fill="#8884d8" name="จำนวนขาย" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container full-width">
          <h3> รายได้รายเดือน</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => [`฿${value.toLocaleString()}`, 'รายได้']} />
              <Area type="monotone" dataKey="revenue" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reports Section */}
      <div className="reports-section">
        <div className="reports-header">
          <h2> รายงานและการส่งออกข้อมูล</h2>
          <div className="export-buttons">
            <button onClick={handleExportExcel} className="export-btn excel">
               ส่งออก Excel
            </button>
          </div>
        </div>

        <div className="report-tabs">
          <button 
            className={`tab-button ${activeReport === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveReport('inventory')}
          >
             รายงานสินค้าคงเหลือ
          </button>
          <button 
            className={`tab-button ${activeReport === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveReport('sales')}
          >
             รายงานยอดขาย
          </button>
          <button 
            className={`tab-button ${activeReport === 'lowStock' ? 'active' : ''}`}
            onClick={() => setActiveReport('lowStock')}
          >
             รายงานสินค้าที่ต้องสั่งซื้อ
          </button>
          <button 
            className={`tab-button ${activeReport === 'topSelling' ? 'active' : ''}`}
            onClick={() => setActiveReport('topSelling')}
          >
             รายงานสินค้าขายดี
          </button>
        </div>

        <div className="report-content">
          {activeReport === 'inventory' && (
            <InventoryReportTable data={stats.inventoryReport} />
          )}
          {activeReport === 'sales' && (
            <SalesReportTable data={stats.salesReport} />
          )}
          {activeReport === 'lowStock' && (
            <LowStockReportTable data={stats.lowStockReport} />
          )}
          {activeReport === 'topSelling' && (
            <TopSellingReportTable data={stats.topSellingProducts} />
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .dashboard-header h1 {
          color: #333;
          margin-bottom: 10px;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 15px;
          transition: transform 0.2s;
        }

        .summary-card:hover {
          transform: translateY(-2px);
        }

        .summary-card.warning {
          border-left: 5px solid #ffc107;
        }

        .summary-card.danger {
          border-left: 5px solid #dc3545;
        }

        .card-icon {
          font-size: 2rem;
        }

        .card-content h3 {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .card-number {
          margin: 5px 0 0 0;
          font-size: 1.8rem;
          font-weight: bold;
          color: #333;
        }

        .charts-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }

        .chart-container {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .chart-container.full-width {
          grid-column: 1 / -1;
        }

        .chart-container h3 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .reports-section {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .reports-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .export-buttons {
          display: flex;
          gap: 10px;
        }

        .export-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .export-btn.pdf {
          background: #dc3545;
          color: white;
        }

        .export-btn.excel {
          background: #28a745;
          color: white;
        }

        .export-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .report-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
        }

        .tab-button {
          padding: 10px 20px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-button.active {
          border-bottom-color: #007bff;
          color: #007bff;
          font-weight: 500;
        }

        .tab-button:hover {
          background: #f8f9fa;
        }

        .loading, .no-data, .access-denied {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .error-message {
          text-align: center;
          padding: 40px;
          color: #dc3545;
        }

        .retry-button, .back-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 10px;
        }

        @media (max-width: 768px) {
          .charts-section {
            grid-template-columns: 1fr;
          }

          .reports-header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .report-tabs {
            flex-wrap: wrap;
          }

          .tab-button {
            flex: 1;
            min-width: 150px;
          }
        }

        /* Report Table Styles */
        .report-table-container {
          margin-top: 20px;
        }

        .report-table-container h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }

        .report-table th,
        .report-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .report-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
        }

        .report-table tr:hover {
          background: #f8f9fa;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status-badge.in_stock {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.low_stock {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.out_of_stock {
          background: #f8d7da;
          color: #721c24;
        }

        .priority-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .priority-badge.critical {
          background: #f8d7da;
          color: #721c24;
        }

        .priority-badge.warning {
          background: #fff3cd;
          color: #856404;
        }

        .priority-badge.reorder {
          background: #cce5ff;
          color: #004085;
        }

        .rank-badge {
          background: #007bff;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .table-note {
          color: #6c757d;
          font-style: italic;
          margin-top: 10px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

// Report Table Components
function InventoryReportTable({ data }: { data: InventoryReport[] }) {
  return (
    <div className="report-table-container">
      <h3>📦 รายงานสินค้าคงเหลือ ({data.length} รายการ)</h3>
      <div className="table-responsive">
        <table className="report-table">
          <thead>
            <tr>
              <th>ชื่อสินค้า</th>
              <th>หมวดหมู่</th>
              <th>คงเหลือ</th>
              <th>สต็อกต่ำสุด</th>
              <th>สต็อกสูงสุด</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((item, index) => (
              <tr key={index}>
                <td>{item.productName}</td>
                <td>{item.category}</td>
                <td>{item.currentStock}</td>
                <td>{item.minStock}</td>
                <td>{item.maxStock}</td>
                <td>
                  <span className={`status-badge ${item.status}`}>
                    {getStatusText(item.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 10 && (
        <p className="table-note">แสดง 10 รายการแรก จากทั้งหมด {data.length} รายการ</p>
      )}
    </div>
  );
}

function SalesReportTable({ data }: { data: SalesReport[] }) {
  return (
    <div className="report-table-container">
      <h3>💰 รายงานยอดขาย ({data.length} รายการ)</h3>
      <div className="table-responsive">
        <table className="report-table">
          <thead>
            <tr>
              <th>รหัสคำสั่งซื้อ</th>
              <th>ลูกค้า</th>
              <th>ยอดขาย</th>
              <th>สถานะ</th>
              <th>วันที่</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((item, index) => (
              <tr key={index}>
                <td>{item.orderId.slice(-8)}</td>
                <td>{item.customerName}</td>
                <td>฿{item.totalAmount.toLocaleString()}</td>
                <td>{getOrderStatusText(item.status)}</td>
                <td>
                  {item.orderDate 
                    ? new Date(item.orderDate.seconds * 1000).toLocaleDateString('th-TH')
                    : '-'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 10 && (
        <p className="table-note">แสดง 10 รายการแรก จากทั้งหมด {data.length} รายการ</p>
      )}
    </div>
  );
}

function LowStockReportTable({ data }: { data: LowStockReport[] }) {
  return (
    <div className="report-table-container">
      <h3>⚠️ รายงานสินค้าที่ต้องสั่งซื้อ ({data.length} รายการ)</h3>
      <div className="table-responsive">
        <table className="report-table">
          <thead>
            <tr>
              <th>ชื่อสินค้า</th>
              <th>หมวดหมู่</th>
              <th>คงเหลือ</th>
              <th>สต็อกต่ำสุด</th>
              <th>ต้องเติม</th>
              <th>ระดับความสำคัญ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{item.productName}</td>
                <td>{item.category}</td>
                <td>{item.currentStock}</td>
                <td>{item.minStock}</td>
                <td>{item.difference}</td>
                <td>
                  <span className={`priority-badge ${item.priority}`}>
                    {getPriorityText(item.priority)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopSellingReportTable({ data }: { data: ProductSalesReport[] }) {
  return (
    <div className="report-table-container">
      <h3>🏆 รายงานสินค้าขายดีที่สุด ({data.length} รายการ)</h3>
      <div className="table-responsive">
        <table className="report-table">
          <thead>
            <tr>
              <th>อันดับ</th>
              <th>ชื่อสินค้า</th>
              <th>หมวดหมู่</th>
              <th>ขายได้</th>
              <th>รายได้</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>
                  <span className="rank-badge">#{index + 1}</span>
                </td>
                <td>{item.productName}</td>
                <td>{item.category}</td>
                <td>{item.totalSold} ชิ้น</td>
                <td>฿{item.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper functions
function getStatusText(status: string): string {
  switch (status) {
    case 'in_stock': return 'มีสินค้า';
    case 'low_stock': return 'สินค้าใกล้หมด';
    case 'out_of_stock': return 'สินค้าหมด';
    default: return status;
  }
}

function getOrderStatusText(status: string): string {
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

function getPriorityText(priority: string): string {
  switch (priority) {
    case 'critical': return 'วิกฤต';
    case 'warning': return 'เตือน';
    case 'reorder': return 'ต้องสั่งซื้อ';
    default: return priority;
  }
}
