'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAllProducts, getActiveProducts, searchProducts, deleteProduct, Product } from '../../lib/productService';

export default function ProductsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(product => product.category))];

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (user) {
        try {
          setLoading(true);
          // Admin can see all products, customers see only active products
          const allProducts = user.role === 'admin' 
            ? await getAllProducts() 
            : await getActiveProducts();
          setProducts(allProducts);
          setError('');
        } catch (error: any) {
          console.error('Error fetching products:', error);
          setError('ไม่สามารถโหลดข้อมูลสินค้าได้');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProducts();
  }, [user]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // If search is empty, reload all products
      const allProducts = user?.role === 'admin' 
        ? await getAllProducts() 
        : await getActiveProducts();
      setProducts(allProducts);
      return;
    }

    try {
      setLoading(true);
      const searchResults = await searchProducts(searchTerm);
      // Filter by user role
      const filteredResults = user?.role === 'admin' 
        ? searchResults 
        : searchResults.filter(product => product.isActive);
      setProducts(filteredResults);
      setError('');
    } catch (error: any) {
      console.error('Error searching products:', error);
      setError('ไม่สามารถค้นหาสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      setDeletingProduct(productId);
      await deleteProduct(productId);
      
      // Update the local state by removing the deleted product
      setProducts(products.filter(product => product.id !== productId));
      
      setError('');
      setShowDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setError(error.message || 'ไม่สามารถลบสินค้าได้');
    } finally {
      setDeletingProduct(null);
    }
  };

  const confirmDelete = (productId: string) => {
    setShowDeleteConfirm(productId);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  // Filter products by category
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">กำลังโหลด...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>จัดการสินค้า</h1>
        <p>ดูและจัดการสินค้าในระบบ</p>
      </div>

      {/* Search and Filter Section */}
      <div className="products-controls">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input"
            />
            <button onClick={handleSearch} className="search-button">
              ค้นหา
            </button>
          </div>
          
          <div className="filter-section">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              <option value="all">หมวดหมู่ทั้งหมด</option>
              {categories.filter(cat => cat !== 'all').map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {user.role === 'admin' && (
          <button 
            onClick={() => router.push('/products/add')}
            className="add-product-button"
          >
            เพิ่มสินค้าใหม่
          </button>
        )}
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">กำลังโหลดสินค้า...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="products-container">
            <h2>สินค้าทั้งหมด ({filteredProducts.length})</h2>
            
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <p>ไม่พบสินค้าในระบบ</p>
                {user.role === 'admin' && (
                  <button 
                    onClick={() => router.push('/products/add')}
                    className="add-product-button"
                  >
                    เพิ่มสินค้าแรก
                  </button>
                )}
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className={`product-card ${!product.isActive ? 'inactive' : ''}`}>
                    {product.imageUrl && (
                      <div className="product-image">
                        <img src={product.imageUrl} alt={product.name} />
                      </div>
                    )}
                    
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                      <div className="product-details">
                        <span className="product-price">฿{product.price.toLocaleString()}</span>
                        <span className="product-category">{product.category}</span>
                      </div>
                      <div className="product-stock">
                        <span className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                          คงเหลือ: {product.stock}
                        </span>
                        {!product.isActive && (
                          <span className="inactive-badge">ไม่ใช้งาน</span>
                        )}
                      </div>
                    </div>

                    {user.role === 'admin' && (
                      <div className="product-actions">
                        <button 
                          onClick={() => router.push(`/products/${product.id}/edit`)}
                          className="edit-button"
                        >
                          แก้ไข
                        </button>
                        <button 
                          onClick={() => confirmDelete(product.id)}
                          disabled={deletingProduct === product.id}
                          className="delete-button"
                        >
                          {deletingProduct === product.id ? 'กำลังลบ...' : 'ลบ'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>ยืนยันการลบสินค้า</h3>
            <p>
              คุณแน่ใจหรือไม่ที่จะลบสินค้า "
              {products.find(p => p.id === showDeleteConfirm)?.name}" ?
            </p>
            <p className="warning-text">
              การดำเนินการนี้ไม่สามารถยกเลิกได้
            </p>
            <div className="modal-buttons">
              <button 
                onClick={cancelDelete}
                className="cancel-button"
                disabled={deletingProduct === showDeleteConfirm}
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
                className="confirm-delete-button"
                disabled={deletingProduct === showDeleteConfirm}
              >
                {deletingProduct === showDeleteConfirm ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-footer">
        <button onClick={() => router.push('/dashboard')} className="action-button">
          กลับไปยังแดชบอร์ด
        </button>
      </div>
    </div>
  );
}
