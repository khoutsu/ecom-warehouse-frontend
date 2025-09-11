'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAllProducts, getActiveProducts, searchProducts, deleteProduct, Product } from '../../lib/productService';
import { createOrder, CreateOrderData } from '../../lib/orderService';

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
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    paymentMethod: 'transfer',
    notes: ''
  });

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

  const handleCheckout = async () => {
    if (!user || Object.keys(cart).length === 0) return;

    // Validation
    if (!checkoutForm.name.trim() || !checkoutForm.address.trim() || 
        !checkoutForm.city.trim() || !checkoutForm.postalCode.trim() || 
        !checkoutForm.phone.trim()) {
      setError('กรุณากรอกข้อมูลที่อยู่จัดส่งให้ครบถ้วน');
      return;
    }

    try {
      setCheckoutLoading(true);
      setError('');

      // Prepare order items
      const orderItems = Object.entries(cart).map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        if (!product) throw new Error('ไม่พบข้อมูลสินค้า');
        
        // Only store image URL or a placeholder, not base64 data
        let imageUrl = '';
        if (product.imageUrl) {
          // If it's a base64 image (starts with data:), use placeholder instead
          if (product.imageUrl.startsWith('data:')) {
            imageUrl = ''; // Use empty string to trigger CSS placeholder
          } else {
            imageUrl = product.imageUrl; // Use original URL
          }
        }
        
        return {
          productId,
          productName: product.name,
          quantity,
          price: product.price,
          imageUrl
        };
      });

      // Create order data
      const orderData: CreateOrderData = {
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        items: orderItems,
        totalAmount: getCartTotal(),
        shippingAddress: {
          name: checkoutForm.name,
          address: checkoutForm.address,
          city: checkoutForm.city,
          postalCode: checkoutForm.postalCode,
          phone: checkoutForm.phone
        },
        paymentMethod: checkoutForm.paymentMethod,
        notes: checkoutForm.notes
      };

      // Create the order
      const orderId = await createOrder(orderData);
      
      // Clear cart and close checkout
      setCart({});
      setShowCheckout(false);
      setShowCart(false);
      
      // Reset form
      setCheckoutForm({
        name: '',
        address: '',
        city: '',
        postalCode: '',
        phone: '',
        paymentMethod: 'transfer',
        notes: ''
      });

      // Show success message and redirect to orders
      alert(`สั่งซื้อสำเร็จ! หมายเลขคำสั่งซื้อ: ${orderId.slice(-8)}`);
      router.push('/orders');
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      setError(error.message || 'ไม่สามารถสั่งซื้อสินค้าได้');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCheckoutFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Restrict phone number to numbers only
    if (name === 'phone') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      setCheckoutForm(prev => ({
        ...prev,
        [name]: numbersOnly
      }));
      return;
    }
    
    // Restrict postal code to numbers only
    if (name === 'postalCode') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      setCheckoutForm(prev => ({
        ...prev,
        [name]: numbersOnly
      }));
      return;
    }
    
    // For other fields, use normal handling
    setCheckoutForm(prev => ({
      ...prev,
      [name]: value
    }));
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
        <h1>{user.role === 'admin' ? 'จัดการสินค้า' : 'ร้านค้า ผลิตภัณฑ์จานใบไม้'}</h1>
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
                    <div className="product-image">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <div className="product-placeholder">
                          <span>📦</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                      <div className="product-details">
                        <span className="product-price">
                          ฿{product.price > 0 ? product.price.toLocaleString() : 'ไม่ระบุราคา'}
                        </span>
                        <span className="product-category">{product.category || 'ไม่ระบุหมวดหมู่'}</span>
                      </div>
                      <div className="product-stock">
                        <span className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                          คงเหลือ: {product.stock > 0 ? product.stock : 'หมด'}
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
                            ฿{product.price > 0 ? product.price.toLocaleString() : 'ไม่ระบุราคา'} x {count} = ฿{product.price > 0 ? (product.price * count).toLocaleString() : 'ไม่ระบุราคา'}
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
                        if (Object.keys(cart).length === 0) {
                          alert('กรุณาเลือกสินค้าก่อนสั่งซื้อ');
                          return;
                        }
                        setShowCheckout(true);
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

      {/* Checkout Modal */}
      {user && user.role === 'customer' && showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal-content checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ position: 'relative', paddingRight: '50px' }}>
              <h2>ข้อมูลการสั่งซื้อ</h2>
              <button 
                onClick={() => setShowCheckout(false)}
                className="close-button"
                style={{
                  position: 'absolute',
                  top: '0px',
                  right: '0px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px',
                  lineHeight: '1',
                  zIndex: 1,
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.color = '#333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#666';
                }}
              >
                ✕
              </button>
            </div>

            <div className="checkout-content">
              {/* Order Summary */}
              <div className="order-summary-section">
                <h3>สรุปคำสั่งซื้อ</h3>
                <div className="checkout-items">
                  {Object.entries(cart).map(([productId, count]) => {
                    const product = products.find(p => p.id === productId);
                    if (!product) return null;
                    return (
                      <div key={productId} className="checkout-item">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} />
                        ) : (
                          <div className="product-placeholder">
                            <span>📦</span>
                          </div>
                        )}
                        <div className="item-info">
                          <span className="item-name">{product.name}</span>
                          <span className="item-details">
                            ฿{product.price.toLocaleString()} × {count} = ฿{(product.price * count).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="total-section">
                  <strong>ยอดรวมทั้งหมด: ฿{getCartTotal().toLocaleString()}</strong>
                </div>
              </div>

              {/* Shipping Form */}
              <div className="shipping-form-section">
                <h3>ข้อมูลที่อยู่จัดส่ง</h3>
                <form className="checkout-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>ชื่อผู้รับ *</label>
                      <input
                        type="text"
                        name="name"
                        value={checkoutForm.name}
                        onChange={handleCheckoutFormChange}
                        required
                        placeholder="กรอกชื่อผู้รับสินค้า"
                      />
                    </div>
                    <div className="form-group">
                      <label>เบอร์โทรศัพท์ *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={checkoutForm.phone}
                        onChange={handleCheckoutFormChange}
                        required
                        placeholder="กรอกเบอร์โทรศัพท์ (ตัวเลขเท่านั้น)"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>ที่อยู่ *</label>
                    <input
                      type="text"
                      name="address"
                      value={checkoutForm.address}
                      onChange={handleCheckoutFormChange}
                      required
                      placeholder="กรอกที่อยู่จัดส่ง"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>เมือง/อำเภอ *</label>
                      <input
                        type="text"
                        name="city"
                        value={checkoutForm.city}
                        onChange={handleCheckoutFormChange}
                        required
                        placeholder="กรอกเมือง/อำเภอ"
                      />
                    </div>
                    <div className="form-group">
                      <label>รหัสไปรษณีย์ *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={checkoutForm.postalCode}
                        onChange={handleCheckoutFormChange}
                        required
                        placeholder="กรอกรหัสไปรษณีย์ (5 หลัก)"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={5}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>วิธีการชำระเงิน</label>
                    <div className="payment-methods">
                      <div className="payment-option">
                        <input
                          type="radio"
                          id="transfer"
                          name="paymentMethod"
                          value="transfer"
                          checked={checkoutForm.paymentMethod === 'transfer'}
                          onChange={handleCheckoutFormChange}
                        />
                        <label htmlFor="transfer" className="payment-option-label">
                          <div className="payment-info">
                            <strong>โอนเงินผ่านธนาคาร</strong>
                            <span>โอนเงินเข้าบัญชีธนาคาร</span>
                          </div>
                        </label>
                      </div>

                      <div className="payment-option">
                        <input
                          type="radio"
                          id="promptpay"
                          name="paymentMethod"
                          value="promptpay"
                          checked={checkoutForm.paymentMethod === 'promptpay'}
                          onChange={handleCheckoutFormChange}
                        />
                        <label htmlFor="promptpay" className="payment-option-label">
                          <div className="payment-info">
                            <strong>พร้อมเพย์ (PromptPay)</strong>
                            <span>สแกน QR Code หรือโอนผ่านเบอร์โทร</span>
                          </div>
                        </label>
                      </div>

                      <div className="payment-option">
                        <input
                          type="radio"
                          id="cod"
                          name="paymentMethod"
                          value="cod"
                          checked={checkoutForm.paymentMethod === 'cod'}
                          onChange={handleCheckoutFormChange}
                        />
                        <label htmlFor="cod" className="payment-option-label">
                          <div className="payment-info">
                            <strong>ชำระเงินปลายทาง (COD)</strong>
                            <span>ชำระเงินเมื่อได้รับสินค้า</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {checkoutForm.paymentMethod === 'transfer' && (
                      <div className="payment-details">
                        <div className="bank-info">
                          <p><strong>ธนาคาร ธ.ก.ส</strong></p>
                          <p>เลขที่บัญชี: <strong>020-04401-729</strong></p>
                          <p>ชื่อบัญชี: <strong>ธ.ก.ส วิสาหกิจชุมชนป่าต้นผึ้ง </strong></p>
                          <p className="note"> กรุณาโอนเงินตามจำนวนที่แสดงและเก็บหลักฐานการโอนเงิน</p>
                        </div>
                      </div>
                    )}

                    {checkoutForm.paymentMethod === 'promptpay' && (
                      <div className="payment-details">
                        <h4> รายละเอียด PromptPay</h4>
                        <div className="promptpay-info">
                          <p><strong>ชื่อบัญชี:</strong> นาง สายสวาท ไทยกรณ์</p>
                          <div className="qr-placeholder">
                            <p> QR Code สำหรับชำระเงิน</p>
                            <div className="qr-box">
                              <img 
                                src="/thai-qr-payment.jpg" 
                                alt="Thai QR Payment Code" 
                                style={{
                                  maxWidth: '250px',
                                  width: '100%',
                                  height: 'auto',
                                  border: '2px solid #ddd',
                                  borderRadius: '8px',
                                  marginTop: '10px'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {checkoutForm.paymentMethod === 'cod' && (
                      <div className="payment-details">
                        <h4>ชำระเงินปลายทาง (COD)</h4>
                        <div className="cod-info">
                          <p>✅ ชำระเงินเมื่อได้รับสินค้า</p>
                          <p>✅ รับชำระเงินสด</p>
                          <p className="note"> กรุณาเตรียมเงินสดให้พอดีจำนวน และ ส่งเฉพาะในเชียงใหม่เท่่านั้น</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>หมายเหตุ</label>
                    <textarea
                      name="notes"
                      value={checkoutForm.notes}
                      onChange={handleCheckoutFormChange}
                      placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                      rows={3}
                    />
                  </div>
                </form>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="checkout-actions">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="cancel-button"
                  disabled={checkoutLoading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleCheckout}
                  className="confirm-button"
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'กำลังสั่งซื้อ...' : 'ยืนยันการสั่งซื้อ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add CSS styles for enhanced payment methods
const paymentStyles = `
  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .payment-option {
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 0;
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .payment-option:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
  }

  .payment-option input[type="radio"] {
    display: none;
  }

  .payment-option input[type="radio"]:checked + .payment-option-label {
    background: #f8f9ff;
    border-color: #007bff;
  }

  .payment-option-label {
    display: flex;
    align-items: center;
    padding: 1rem;
    cursor: pointer;
    margin: 0;
    width: 100%;
    transition: all 0.2s ease;
  }

  .payment-option-label:hover {
    background: #f8f9fa;
  }

  .payment-icon {
    font-size: 2rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background: #f8f9fa;
    border-radius: 50%;
  }

  .payment-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .payment-info strong {
    color: #495057;
    font-size: 1rem;
  }

  .payment-info span {
    color: #6c757d;
    font-size: 0.9rem;
  }

  .payment-details {
    margin-top: 1rem;
    padding: 1.5rem;
    background: #f8f9ff;
    border: 1px solid #e3e8ff;
    border-radius: 8px;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .payment-details h4 {
    margin: 0 0 1rem 0;
    color: #495057;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .bank-info,
  .promptpay-info,
  .wallet-info,
  .cod-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .bank-info p,
  .promptpay-info p,
  .wallet-info p,
  .cod-info p {
    margin: 0;
    color: #495057;
  }

  .bank-info strong,
  .promptpay-info strong,
  .wallet-info strong,
  .cod-info strong {
    color: #007bff;
  }

  .note {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    padding: 0.75rem;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #856404;
  }

  .qr-placeholder {
    margin-top: 1rem;
    text-align: center;
  }

  .qr-box {
    background: #f8f9fa;
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    padding: 2rem;
    margin-top: 0.5rem;
    color: #6c757d;
    font-style: italic;
  }

  .cod-info p {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cod-info .note {
    background: #f8d7da;
    border-color: #f5c6cb;
    color: #721c24;
  }

  @media (max-width: 768px) {
    .payment-methods {
      gap: 0.75rem;
    }

    .payment-option-label {
      padding: 0.75rem;
    }

    .payment-icon {
      width: 50px;
      height: 50px;
      font-size: 1.5rem;
      margin-right: 0.75rem;
    }

    .payment-info strong {
      font-size: 0.9rem;
    }

    .payment-info span {
      font-size: 0.8rem;
    }

    .payment-details {
      padding: 1rem;
    }
  }
`;

// Inject payment styles
if (typeof window !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = paymentStyles;
  if (!document.head.querySelector('style[data-payment-method-styles]')) {
    styleElement.setAttribute('data-payment-method-styles', 'true');
    document.head.appendChild(styleElement);
  }
}
