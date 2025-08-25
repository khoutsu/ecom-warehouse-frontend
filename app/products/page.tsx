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
  const [cart, setCart] = useState<{[productId: string]: number}>({});
  const [showCart, setShowCart] = useState(false);

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

  // Customer cart functions
  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, count) => total + count, 0);
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [productId, count]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * count : 0);
    }, 0);
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
        <h1>{user.role === 'admin' ? 'จัดการสินค้า' : '🛍️ ร้านค้าออนไลน์'}</h1>
        <p>{user.role === 'admin' ? 'ดูและจัดการสินค้าในระบบ' : 'เลือกซื้อสินค้าคุณภาพดี ราคาเป็นมิตร'}</p>
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

        {user.role === 'customer' && (
          <button 
            onClick={() => setShowCart(!showCart)}
            className="cart-button"
            style={{
              position: 'relative',
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🛒 ตรวจสอบตะกร้า
            {getCartItemCount() > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#dc3545',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '12px',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {getCartItemCount()}
              </span>
            )}
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

                    {user.role === 'admin' ? (
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
                    ) : (
                      <div className="customer-actions" style={{ padding: '15px' }}>
                        {product.stock > 0 ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                              <button
                                onClick={() => removeFromCart(product.id)}
                                disabled={!cart[product.id]}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  border: '1px solid #ddd',
                                  backgroundColor: cart[product.id] ? '#dc3545' : '#f8f9fa',
                                  color: cart[product.id] ? 'white' : '#666',
                                  borderRadius: '5px',
                                  cursor: cart[product.id] ? 'pointer' : 'not-allowed'
                                }}
                              >
                                −
                              </button>
                              <span style={{ 
                                minWidth: '40px', 
                                textAlign: 'center',
                                fontWeight: 'bold'
                              }}>
                                {cart[product.id] || 0}
                              </span>
                              <button
                                onClick={() => addToCart(product.id)}
                                disabled={cart[product.id] >= product.stock}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  border: '1px solid #ddd',
                                  backgroundColor: cart[product.id] < product.stock ? '#28a745' : '#f8f9fa',
                                  color: cart[product.id] < product.stock ? 'white' : '#666',
                                  borderRadius: '5px',
                                  cursor: cart[product.id] < product.stock ? 'pointer' : 'not-allowed'
                                }}
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => addToCart(product.id)}
                              disabled={cart[product.id] >= product.stock}
                              style={{
                                width: '100%',
                                padding: '8px 16px',
                                backgroundColor: cart[product.id] >= product.stock ? '#6c757d' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: cart[product.id] >= product.stock ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              {cart[product.id] >= product.stock ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
                            </button>
                          </>
                        ) : (
                          <button
                            disabled
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'not-allowed',
                              fontSize: '14px'
                            }}
                          >
                            สินค้าหมด
                          </button>
                        )}
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

      {/* Cart Modal for Customers */}
      {user.role === 'customer' && showCart && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>🛒 ตะกร้าสินค้าของคุณ</h3>
              <button 
                onClick={() => setShowCart(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            
            {getCartItemCount() === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>ตะกร้าของคุณว่างเปล่า</p>
                <button 
                  onClick={() => setShowCart(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  เลือกซื้อสินค้า
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  {Object.entries(cart).map(([productId, count]) => {
                    const product = products.find(p => p.id === productId);
                    if (!product) return null;
                    
                    return (
                      <div key={productId} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        marginBottom: '10px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 5px 0' }}>{product.name}</h4>
                          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            ฿{product.price.toLocaleString()} x {count} = ฿{(product.price * count).toLocaleString()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            onClick={() => removeFromCart(productId)}
                            style={{
                              width: '30px',
                              height: '30px',
                              border: '1px solid #ddd',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            −
                          </button>
                          <span style={{ minWidth: '30px', textAlign: 'center' }}>{count}</span>
                          <button
                            onClick={() => addToCart(productId)}
                            disabled={count >= product.stock}
                            style={{
                              width: '30px',
                              height: '30px',
                              border: '1px solid #ddd',
                              backgroundColor: count >= product.stock ? '#6c757d' : '#28a745',
                              color: 'white',
                              borderRadius: '5px',
                              cursor: count >= product.stock ? 'not-allowed' : 'pointer'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div style={{
                  borderTop: '2px solid #dee2e6',
                  paddingTop: '15px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 15px 0' }}>
                    รวมทั้งหมด: ฿{getCartTotal().toLocaleString()}
                  </h3>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      onClick={() => setCart({})}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      ล้างตะกร้า
                    </button>
                    <button
                      onClick={() => {
                        alert('ขณะนี้ระบบการสั่งซื้อยังไม่พร้อมใช้งาน');
                        // TODO: Implement order functionality
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      สั่งซื้อสินค้า
                    </button>
                  </div>
                </div>
              </>
            )}
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
