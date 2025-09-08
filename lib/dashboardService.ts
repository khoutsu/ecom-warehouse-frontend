import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  limit 
} from 'firebase/firestore';
import { getAllProducts, Product } from './productService';
import { getAllInventory, InventoryItem } from './inventoryService';
import { getAllOrders, Order } from './orderService';

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentOrdersCount: number;
  topSellingProducts: ProductSalesReport[];
  inventoryReport: InventoryReport[];
  salesReport: SalesReport[];
  lowStockReport: LowStockReport[];
  monthlyRevenue: MonthlyRevenueReport[];
}

export interface ProductSalesReport {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
  category: string;
}

export interface InventoryReport {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastRestocked?: any;
}

export interface SalesReport {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  orderDate: any;
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
}

export interface LowStockReport {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  minStock: number;
  difference: number;
  priority: 'critical' | 'warning' | 'reorder';
}

export interface MonthlyRevenueReport {
  month: string;
  revenue: number;
  orders: number;
}

// Get comprehensive dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    console.log('Fetching dashboard statistics...');
    
    // Fetch all data in parallel
    const [products, inventory, orders] = await Promise.all([
      getAllProducts(),
      getAllInventory(),
      getAllOrders()
    ]);

    // Calculate basic stats
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Low stock and out of stock analysis
    const lowStockItems = inventory.filter(item => item.quantity <= item.minStock && item.quantity > 0);
    const outOfStockItems = inventory.filter(item => item.quantity === 0);
    
    // Recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt.seconds * 1000);
      return orderDate >= thirtyDaysAgo;
    });

    // Generate reports
    const topSellingProducts = generateTopSellingProductsReport(orders, products);
    const inventoryReport = generateInventoryReport(inventory, products);
    const salesReport = generateSalesReport(orders);
    const lowStockReport = generateLowStockReport(inventory);
    const monthlyRevenue = generateMonthlyRevenueReport(orders);

    return {
      totalProducts,
      totalOrders,
      totalRevenue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      recentOrdersCount: recentOrders.length,
      topSellingProducts,
      inventoryReport,
      salesReport,
      lowStockReport,
      monthlyRevenue
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Generate top selling products report
const generateTopSellingProductsReport = (orders: Order[], products: Product[]): ProductSalesReport[] => {
  const productSales: { [key: string]: { sold: number; revenue: number; name: string; category: string } } = {};

  // Calculate sales for each product
  orders.forEach(order => {
    if (order.paymentStatus === 'paid') {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          const product = products.find(p => p.id === item.productId);
          productSales[item.productId] = {
            sold: 0,
            revenue: 0,
            name: product?.name || item.productName,
            category: product?.category || 'Unknown'
          };
        }
        productSales[item.productId].sold += item.quantity;
        productSales[item.productId].revenue += item.quantity * item.price;
      });
    }
  });

  // Convert to array and sort by quantity sold
  return Object.entries(productSales)
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      totalSold: data.sold,
      revenue: data.revenue,
      category: data.category
    }))
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10); // Top 10
};

// Generate inventory status report
const generateInventoryReport = (inventory: InventoryItem[], products: Product[]): InventoryReport[] => {
  return inventory.map(item => {
    const product = products.find(p => p.id === item.productId);
    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    
    if (item.quantity === 0) {
      status = 'out_of_stock';
    } else if (item.quantity <= item.minStock) {
      status = 'low_stock';
    }

    return {
      productId: item.productId,
      productName: product?.name || item.productName,
      category: product?.category || item.productCategory,
      currentStock: item.quantity,
      minStock: item.minStock,
      maxStock: item.maxStock,
      status,
      lastRestocked: item.lastRestocked
    };
  }).sort((a, b) => a.productName.localeCompare(b.productName));
};

// Generate sales report
const generateSalesReport = (orders: Order[]): SalesReport[] => {
  return orders
    .filter(order => order.paymentStatus === 'paid')
    .map(order => ({
      orderId: order.id,
      customerName: order.userName,
      customerEmail: order.userEmail,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderDate: order.createdAt,
      items: order.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price
      }))
    }))
    .sort((a, b) => {
      if (!a.orderDate || !b.orderDate) return 0;
      return b.orderDate.seconds - a.orderDate.seconds;
    });
};

// Generate low stock report with priorities
const generateLowStockReport = (inventory: InventoryItem[]): LowStockReport[] => {
  return inventory
    .filter(item => item.quantity <= item.minStock)
    .map(item => {
      const difference = item.minStock - item.quantity;
      let priority: 'critical' | 'warning' | 'reorder' = 'reorder';
      
      if (item.quantity === 0) {
        priority = 'critical';
      } else if (item.quantity <= item.minStock * 0.5) {
        priority = 'warning';
      }

      return {
        productId: item.productId,
        productName: item.productName,
        category: item.productCategory,
        currentStock: item.quantity,
        minStock: item.minStock,
        difference,
        priority
      };
    })
    .sort((a, b) => {
      // Sort by priority: critical > warning > reorder
      const priorityOrder = { critical: 3, warning: 2, reorder: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
};

// Generate monthly revenue report
const generateMonthlyRevenueReport = (orders: Order[]): MonthlyRevenueReport[] => {
  const monthlyData: { [key: string]: { revenue: number; orders: number } } = {};

  orders
    .filter(order => order.paymentStatus === 'paid' && order.createdAt)
    .forEach(order => {
      const date = new Date(order.createdAt!.seconds * 1000);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, orders: 0 };
      }
      
      monthlyData[monthKey].revenue += order.totalAmount;
      monthlyData[monthKey].orders += 1;
    });

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orders: data.orders
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months
};
