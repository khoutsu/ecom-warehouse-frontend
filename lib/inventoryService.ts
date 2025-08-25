import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { updateProductStockOnly } from './syncService';

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  lastRestocked: any;
  createdAt: any;
  updatedAt: any;
}

export interface CreateInventoryData {
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  minStock: number;
  maxStock: number;
}

// Get all inventory items
export const getAllInventory = async (): Promise<InventoryItem[]> => {
  try {
    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const inventory: InventoryItem[] = [];
    querySnapshot.forEach((doc) => {
      inventory.push({ id: doc.id, ...doc.data() } as InventoryItem);
    });
    
    return inventory;
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
};

// Get inventory item by ID
export const getInventoryById = async (id: string): Promise<InventoryItem | null> => {
  try {
    const inventoryRef = doc(db, 'inventory', id);
    const inventoryDoc = await getDoc(inventoryRef);
    
    if (inventoryDoc.exists()) {
      return { id: inventoryDoc.id, ...inventoryDoc.data() } as InventoryItem;
    }
    return null;
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    throw error;
  }
};

// Get inventory by product ID
export const getInventoryByProductId = async (productId: string): Promise<InventoryItem | null> => {
  try {
    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, where('productId', '==', productId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as InventoryItem;
    }
    return null;
  } catch (error) {
    console.error('Error fetching inventory by product ID:', error);
    throw error;
  }
};

// Create a new inventory item
export const createInventoryItem = async (inventoryData: CreateInventoryData): Promise<InventoryItem> => {
  try {
    const inventoryRef = collection(db, 'inventory');
    const newInventoryData = {
      ...inventoryData,
      lastRestocked: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(inventoryRef, newInventoryData);
    
    // Sync with products collection - update product stock
    try {
      await updateProductStockOnly(inventoryData.productId, inventoryData.quantity);
    } catch (error) {
      console.warn('Warning: Could not sync with product stock:', error);
      // Continue even if product sync fails
    }
    
    const newInventoryItem = await getInventoryById(docRef.id);
    
    if (!newInventoryItem) {
      throw new Error('Failed to create inventory item');
    }
    
    return newInventoryItem;
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
};

// Update inventory item
export const updateInventoryItem = async (id: string, updateData: Partial<CreateInventoryData>): Promise<InventoryItem> => {
  try {
    const inventoryRef = doc(db, 'inventory', id);
    const updatedData = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(inventoryRef, updatedData);
    
    // Get the updated inventory item to get the productId
    const updatedInventoryItem = await getInventoryById(id);
    
    if (!updatedInventoryItem) {
      throw new Error('Failed to update inventory item');
    }
    
    // Sync with products collection if quantity was updated
    if (updateData.quantity !== undefined) {
      try {
        await updateProductStockOnly(updatedInventoryItem.productId, updateData.quantity);
      } catch (error) {
        console.warn('Warning: Could not sync with product stock:', error);
        // Continue even if product sync fails
      }
    }
    
    return updatedInventoryItem;
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
};

// Update inventory quantity
export const updateInventoryQuantity = async (id: string, newQuantity: number): Promise<InventoryItem> => {
  try {
    const inventoryRef = doc(db, 'inventory', id);
    
    // Get current inventory item to get productId
    const currentItem = await getInventoryById(id);
    if (!currentItem) {
      throw new Error('Inventory item not found');
    }
    
    const updateData = {
      quantity: newQuantity,
      lastRestocked: newQuantity > 0 ? serverTimestamp() : undefined,
      updatedAt: serverTimestamp()
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });
    
    await updateDoc(inventoryRef, updateData);
    
    // Sync with products collection
    try {
      await updateProductStockOnly(currentItem.productId, newQuantity);
    } catch (error) {
      console.warn('Warning: Could not sync with product stock:', error);
      // Continue even if product sync fails
    }
    
    const updatedInventoryItem = await getInventoryById(id);
    
    if (!updatedInventoryItem) {
      throw new Error('Failed to update inventory quantity');
    }
    
    return updatedInventoryItem;
  } catch (error) {
    console.error('Error updating inventory quantity:', error);
    throw error;
  }
};

// Delete inventory item
export const deleteInventoryItem = async (id: string): Promise<void> => {
  try {
    // Get current inventory item to get productId before deletion
    const currentItem = await getInventoryById(id);
    
    const inventoryRef = doc(db, 'inventory', id);
    await deleteDoc(inventoryRef);
    
    // Sync with products collection - set stock to 0 when inventory is deleted
    if (currentItem) {
      try {
        await updateProductStockOnly(currentItem.productId, 0);
      } catch (error) {
        console.warn('Warning: Could not sync with product stock:', error);
        // Continue even if product sync fails
      }
    }
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

// Get low stock items
export const getLowStockItems = async (threshold?: number): Promise<InventoryItem[]> => {
  try {
    const inventory = await getAllInventory();
    
    // Filter items where quantity is less than or equal to minStock (or custom threshold)
    const lowStockItems = inventory.filter(item => {
      const stockThreshold = threshold !== undefined ? threshold : item.minStock;
      return item.quantity <= stockThreshold;
    });
    
    return lowStockItems;
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    throw error;
  }
};

// Get out of stock items
export const getOutOfStockItems = async (): Promise<InventoryItem[]> => {
  try {
    const inventory = await getAllInventory();
    return inventory.filter(item => item.quantity === 0);
  } catch (error) {
    console.error('Error fetching out of stock items:', error);
    throw error;
  }
};

// Search inventory items
export const searchInventory = async (searchTerm: string): Promise<InventoryItem[]> => {
  try {
    const inventory = await getAllInventory();
    
    // Client-side filtering for better flexibility
    const filteredInventory = inventory.filter(item => 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productCategory.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredInventory;
  } catch (error) {
    console.error('Error searching inventory:', error);
    throw error;
  }
};

// Get inventory statistics
export const getInventoryStats = async () => {
  try {
    const inventory = await getAllInventory();
    
    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = await getLowStockItems();
    const outOfStockItems = await getOutOfStockItems();
    const categories = [...new Set(inventory.map(item => item.productCategory))];
    
    return {
      totalItems,
      totalQuantity,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      categoriesCount: categories.length,
      categories
    };
  } catch (error) {
    console.error('Error getting inventory statistics:', error);
    throw error;
  }
};
