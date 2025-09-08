import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { syncInventoryFromProduct, deleteInventoryForProduct } from './syncService';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
  isActive: boolean;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  isActive?: boolean;
}

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    // Remove orderBy to avoid index requirement, sort on client side
    const querySnapshot = await getDocs(productsRef);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    
    // Sort on the client side instead
    products.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get active products only
export const getActiveProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    // Use simple query without orderBy to avoid index requirement
    const q = query(productsRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    
    // Sort on the client side instead
    products.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching active products:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const productRef = doc(db, 'products', id);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      return { id: productDoc.id, ...productDoc.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// Create a new product
export const createProduct = async (productData: CreateProductData): Promise<Product> => {
  try {
    const productsRef = collection(db, 'products');
    const newProductData = {
      ...productData,
      isActive: productData.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(productsRef, newProductData);
    const newProduct = await getProductById(docRef.id);
    
    if (!newProduct) {
      throw new Error('Failed to create product');
    }
    
    // Sync with inventory system
    if (newProduct.stock > 0) {
      try {
        await syncInventoryFromProduct(
          newProduct.id,
          newProduct.name,
          newProduct.category,
          newProduct.stock
        );
      } catch (error) {
        console.warn('Warning: Could not sync with inventory system:', error);
        // Continue even if inventory sync fails
      }
    }
    
    return newProduct;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (id: string, updateData: Partial<CreateProductData>): Promise<Product> => {
  try {
    const productRef = doc(db, 'products', id);
    const updatedData = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(productRef, updatedData);
    const updatedProduct = await getProductById(id);
    
    if (!updatedProduct) {
      throw new Error('Failed to update product');
    }
    
    // Sync with inventory system
    try {
      await syncInventoryFromProduct(
        updatedProduct.id,
        updatedProduct.name,
        updatedProduct.category,
        updatedProduct.stock
      );
    } catch (error) {
      console.warn('Warning: Could not sync with inventory system:', error);
      // Continue even if inventory sync fails
    }
    
    return updatedProduct;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Update product stock only
export const updateProductStock = async (id: string, newStock: number): Promise<Product> => {
  try {
    const productRef = doc(db, 'products', id);
    const updatedData = {
      stock: newStock,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(productRef, updatedData);
    const updatedProduct = await getProductById(id);
    
    if (!updatedProduct) {
      throw new Error('Failed to update product stock');
    }
    
    return updatedProduct;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    // Sync with inventory system - delete related inventory first
    try {
      await deleteInventoryForProduct(id);
    } catch (error) {
      console.warn('Warning: Could not delete related inventory:', error);
      // Continue even if inventory deletion fails
    }
    
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Search products by name or category
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  try {
    const products = await getAllProducts();
    
    // Client-side filtering for better flexibility
    const filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredProducts;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    // Use simple query without orderBy to avoid index requirement
    const q = query(
      productsRef,
      where('category', '==', category),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    
    // Sort on the client side instead
    products.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

// Reduce product stock for order items
export const reduceProductStockForOrder = async (orderItems: { productId: string; quantity: number }[]): Promise<void> => {
  try {
    console.log('Reducing product stock for order items:', orderItems);
    
    for (const item of orderItems) {
      const product = await getProductById(item.productId);
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity);
        console.log(`Reducing ${product.name}: ${product.stock} - ${item.quantity} = ${newStock}`);
        await updateProductStock(item.productId, newStock);
      } else {
        console.warn(`Product not found for ID: ${item.productId}`);
      }
    }
  } catch (error) {
    console.error('Error reducing product stock for order:', error);
    throw error;
  }
};

// Restore product stock when order is cancelled
export const restoreProductStockForOrder = async (orderItems: { productId: string; quantity: number }[]): Promise<void> => {
  try {
    console.log('Restoring product stock for cancelled order items:', orderItems);
    
    for (const item of orderItems) {
      const product = await getProductById(item.productId);
      if (product) {
        const newStock = product.stock + item.quantity;
        console.log(`Restoring ${product.name}: ${product.stock} + ${item.quantity} = ${newStock}`);
        await updateProductStock(item.productId, newStock);
      } else {
        console.warn(`Product not found for ID: ${item.productId}`);
      }
    }
  } catch (error) {
    console.error('Error restoring product stock for order:', error);
    throw error;
  }
};
