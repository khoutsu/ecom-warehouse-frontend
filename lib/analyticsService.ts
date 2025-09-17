import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

export interface ProductAnalytics {
  productId: string;
  productName: string;
  category: string;
  totalOrders: number;
  totalQuantitySold: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
  imageUrl?: string;
  price: number;
  stock: number;
}

export interface PopularProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  totalSold: number;
  orderCount: number;
  revenue: number;
  popularityScore: number; // Calculated score based on various factors
}

// Get popular products based on sales data
export const getPopularProducts = async (limitCount: number = 10): Promise<PopularProduct[]> => {
  try {
    // Get all orders from the last 30 days - simplified query
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Use a simpler query to avoid index requirements
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    
    // Filter status on the client side to avoid composite index
    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
    
    // Aggregate product sales data
    const productSales: { [productId: string]: {
      productId: string;
      productName: string;
      category: string;
      totalSold: number;
      orderCount: number;
      revenue: number;
      imageUrl?: string;
      price: number;
    }} = {};
    
    ordersSnapshot.forEach((orderDoc) => {
      const orderData = orderDoc.data();
      
      // Filter by status on client side to avoid composite index
      if (!validStatuses.includes(orderData.status)) {
        return;
      }
      
      orderData.items?.forEach((item: any) => {
        const productId = item.productId;
        
        if (!productSales[productId]) {
          productSales[productId] = {
            productId: productId,
            productName: item.productName,
            category: item.category || 'ไม่ระบุ',
            totalSold: 0,
            orderCount: 0,
            revenue: 0,
            imageUrl: item.imageUrl,
            price: item.price
          };
        }
        
        productSales[productId].totalSold += item.quantity;
        productSales[productId].orderCount += 1;
        productSales[productId].revenue += item.quantity * item.price;
      });
    });
    
    // Get current product stock data and imageUrls
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const stockData: { [productId: string]: number } = {};
    const imageData: { [productId: string]: string } = {};
    
    productsSnapshot.forEach((productDoc) => {
      const productData = productDoc.data();
      stockData[productDoc.id] = productData.stock || 0;
      imageData[productDoc.id] = productData.imageUrl || '';
    });
    
    // Calculate popularity scores and create final array
    const popularProducts: PopularProduct[] = Object.values(productSales).map((product) => {
      // Popularity score calculation:
      // - 40% based on total quantity sold
      // - 30% based on number of orders (frequency)
      // - 20% based on revenue
      // - 10% based on recency (boost for recent sales)
      
      const quantityScore = product.totalSold;
      const frequencyScore = product.orderCount * 2; // Give more weight to frequency
      const revenueScore = product.revenue / 1000; // Scale down revenue
      const recencyScore = 10; // Base score for being in recent sales
      
      const popularityScore = (
        quantityScore * 0.4 +
        frequencyScore * 0.3 +
        revenueScore * 0.2 +
        recencyScore * 0.1
      );
      
      return {
        id: product.productId,
        name: product.productName,
        category: product.category,
        price: product.price,
        stock: stockData[product.productId] || 0,
        imageUrl: imageData[product.productId] || '',
        totalSold: product.totalSold,
        orderCount: product.orderCount,
        revenue: product.revenue,
        popularityScore
      };
    });
    
    // Sort by popularity score and return top products
    return popularProducts
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limitCount);
      
  } catch (error) {
    console.error('Error getting popular products:', error);
    throw error;
  }
};

// Get recommended products for a specific user based on their order history
export const getRecommendedProducts = async (userId: string, limitCount: number = 8): Promise<PopularProduct[]> => {
  try {
    // Get user's order history - simplified query
    const userOrdersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );
    
    const userOrdersSnapshot = await getDocs(userOrdersQuery);
    
    // Filter valid statuses on client side
    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
    
    // Extract categories and products the user has bought
    const userCategories: Set<string> = new Set();
    const userProducts: Set<string> = new Set();
    
    userOrdersSnapshot.forEach((orderDoc) => {
      const orderData = orderDoc.data();
      
      // Filter by status on client side
      if (!validStatuses.includes(orderData.status)) {
        return;
      }
      
      orderData.items?.forEach((item: any) => {
        userCategories.add(item.category || 'ไม่ระบุ');
        userProducts.add(item.productId);
      });
    });
    
    // If user has no order history, return general popular products
    if (userCategories.size === 0) {
      return await getPopularProducts(limitCount);
    }
    
    // Get popular products in user's preferred categories
    const allPopularProducts = await getPopularProducts(50); // Get more to filter from
    
    // Filter and boost products in user's preferred categories
    const recommendedProducts = allPopularProducts.map((product) => {
      let boostScore = 0;
      
      // Boost products in categories user has bought from
      if (userCategories.has(product.category)) {
        boostScore += 20;
      }
      
      // Penalize products user has already bought recently
      if (userProducts.has(product.id)) {
        boostScore -= 10;
      }
      
      return {
        ...product,
        popularityScore: product.popularityScore + boostScore
      };
    });
    
    // Re-sort with new scores and return top recommendations
    return recommendedProducts
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limitCount);
      
  } catch (error) {
    console.error('Error getting recommended products:', error);
    // Fallback to popular products if recommendation fails
    return await getPopularProducts(limitCount);
  }
};

// Get new/featured products (recently added products)
export const getNewProducts = async (limitCount: number = 6): Promise<PopularProduct[]> => {
  try {
    // Get all products and sort on client side to avoid index issues
    const productsQuery = query(collection(db, 'products'));
    const productsSnapshot = await getDocs(productsQuery);
    const allProducts: any[] = [];
    
    productsSnapshot.forEach((productDoc) => {
      const productData = productDoc.data();
      allProducts.push({
        id: productDoc.id,
        data: productData
      });
    });
    
    // Sort by creation date on client side and return the newest ones
    const sortedProducts = allProducts
      .sort((a, b) => {
        const aTime = a.data.createdAt ? a.data.createdAt.seconds || 0 : 0;
        const bTime = b.data.createdAt ? b.data.createdAt.seconds || 0 : 0;
        return bTime - aTime;
      })
      .slice(0, limitCount);
    
    // Convert to PopularProduct format
    const newProducts: PopularProduct[] = sortedProducts.map(item => ({
      id: item.id,
      name: item.data.name,
      category: item.data.category,
      price: item.data.price,
      stock: item.data.stock || 0,
      imageUrl: item.data.imageUrl,
      totalSold: 0, // New products haven't sold yet
      orderCount: 0,
      revenue: 0,
      popularityScore: 50 // Base score for new products
    }));
    
    return newProducts;
    
  } catch (error) {
    console.error('Error getting new products:', error);
    throw error;
  }
};

// Get products by category with popularity data
export const getPopularProductsByCategory = async (category: string, limitCount: number = 12): Promise<PopularProduct[]> => {
  try {
    const allPopularProducts = await getPopularProducts(100); // Get more to filter from
    
    return allPopularProducts
      .filter(product => product.category === category)
      .slice(0, limitCount);
      
  } catch (error) {
    console.error('Error getting popular products by category:', error);
    throw error;
  }
};

// Get sales analytics for admin dashboard
export const getProductAnalytics = async (days: number = 30): Promise<ProductAnalytics[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('status', 'in', ['confirmed', 'processing', 'shipped', 'delivered'])
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    
    // Aggregate detailed analytics
    const analytics: { [productId: string]: ProductAnalytics } = {};
    
    ordersSnapshot.forEach((orderDoc) => {
      const orderData = orderDoc.data();
      const orderDate = orderData.createdAt?.toDate() || new Date();
      
      orderData.items?.forEach((item: any) => {
        const productId = item.productId;
        
        if (!analytics[productId]) {
          analytics[productId] = {
            productId: productId,
            productName: item.productName,
            category: item.category || 'ไม่ระบุ',
            totalOrders: 0,
            totalQuantitySold: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            lastOrderDate: null,
            imageUrl: item.imageUrl,
            price: item.price,
            stock: 0
          };
        }
        
        analytics[productId].totalOrders += 1;
        analytics[productId].totalQuantitySold += item.quantity;
        analytics[productId].totalRevenue += item.quantity * item.price;
        
        if (!analytics[productId].lastOrderDate || orderDate > analytics[productId].lastOrderDate!) {
          analytics[productId].lastOrderDate = orderDate;
        }
      });
    });
    
    // Calculate average order values
    Object.values(analytics).forEach((productAnalytics) => {
      productAnalytics.averageOrderValue = productAnalytics.totalRevenue / productAnalytics.totalOrders;
    });
    
    return Object.values(analytics)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
      
  } catch (error) {
    console.error('Error getting product analytics:', error);
    throw error;
  }
};