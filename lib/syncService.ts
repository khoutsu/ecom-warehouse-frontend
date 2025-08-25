import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

// Update product stock only (for inventory system)
export const updateProductStockOnly = async (productId: string, newStock: number): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId);
    const updatedData = {
      stock: newStock,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(productRef, updatedData);
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
};

// Update inventory quantity only (for product system)
export const updateInventoryQuantityOnly = async (inventoryId: string, newQuantity: number): Promise<void> => {
  try {
    const inventoryRef = doc(db, 'inventory', inventoryId);
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
  } catch (error) {
    console.error('Error updating inventory quantity:', error);
    throw error;
  }
};

// Create or update inventory when product is modified (called from product system)
export const syncInventoryFromProduct = async (
  productId: string,
  productName: string,
  productCategory: string,
  newStock: number
): Promise<void> => {
  try {
    // Check if inventory exists for this product
    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, where('productId', '==', productId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Update existing inventory
      const inventoryDoc = querySnapshot.docs[0];
      const inventoryRef = doc(db, 'inventory', inventoryDoc.id);
      await updateDoc(inventoryRef, {
        productName,
        productCategory,
        quantity: newStock,
        updatedAt: serverTimestamp()
      });
    } else if (newStock > 0) {
      // Create new inventory item only if stock > 0
      const inventoryRef = collection(db, 'inventory');
      await addDoc(inventoryRef, {
        productId,
        productName,
        productCategory,
        quantity: newStock,
        minStock: 10, // Default values
        maxStock: 1000,
        lastRestocked: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error syncing inventory from product:', error);
    throw error;
  }
};

// Delete inventory when product is deleted (called from product system)
export const deleteInventoryForProduct = async (productId: string): Promise<void> => {
  try {
    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, where('productId', '==', productId));
    const querySnapshot = await getDocs(q);
    
    // Delete all inventory items for this product
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting inventory for product:', error);
    throw error;
  }
};
