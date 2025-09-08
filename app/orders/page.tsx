'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getAllOrders, 
  getUserOrders, 
  updateOrderStatus, 
  updatePaymentStatus, 
  confirmPayment, 
  uploadPaymentSlip,
  deleteOrder, 
  Order 
} from '../../lib/orderService';
import { savePaymentSlipInfo, saveThaiPaymentSlip } from '../../lib/paymentSlipService';

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    transactionId: '',
    bankAccount: '',
    notes: ''
  });
  const [showUploadModal, setShowUploadModal] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === 'admin';

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError('');
        
        let fetchedOrders: Order[];
        if (isAdmin) {
          fetchedOrders = await getAllOrders();
        } else {
          fetchedOrders = await getUserOrders(user.id);
        }
        
        setOrders(fetchedOrders);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError('ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, isAdmin]);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    if (!isAdmin) return;
    
    try {
      setUpdatingStatus(orderId);
      await updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
    } catch (error: any) {
      console.error('Error updating order status:', error);
      setError('ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!isAdmin) return;
    
    // Find the order to check its payment status
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    let confirmMessage = 'คุณแน่ใจหรือไม่ที่จะลบคำสั่งซื้อนี้?';
    
    if (order.paymentStatus === 'paid') {
      confirmMessage = '⚠️ คำเตือน: คำสั่งซื้อนี้ชำระเงินแล้ว การลบจะไม่คืนสินค้าเข้าสต็อก เพราะถือว่าขายแล้ว\n\nคุณแน่ใจหรือไม่ที่จะลบคำสั่งซื้อนี้?';
    } else if (order.status === 'cancelled') {
      confirmMessage = 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว การลบจะไม่มีผลต่อสต็อกสินค้า\n\nคุณแน่ใจหรือไม่ที่จะลบคำสั่งซื้อนี้?';
    } else {
      confirmMessage = 'การลบคำสั่งซื้อนี้จะคืนสินค้าเข้าสต็อกอัตโนมัติ\n\nคุณแน่ใจหรือไม่ที่จะลบคำสั่งซื้อนี้?';
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      await deleteOrder(orderId);
      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (error: any) {
      console.error('Error deleting order:', error);
      setError('ไม่สามารถลบคำสั่งซื้อได้');
    }
  };

  const handlePaymentConfirm = async (orderId: string) => {
    if (!isAdmin || !user) return;
    
    try {
      setUpdatingStatus(orderId);
      await confirmPayment(orderId, {
        confirmedBy: user.id,
        transactionId: paymentForm.transactionId,
        bankAccount: paymentForm.bankAccount,
        notes: paymentForm.notes
      });
      
      // Update local state
      setOrders(prev => prev.map(order => order.id === orderId ? 
        { ...order, 
              paymentStatus: 'paid' as const,
              status: 'confirmed' as const,
              paymentDetails: {
                method: order.paymentDetails?.method || order.paymentMethod || 'transfer',
                ...order.paymentDetails,
                paidAt: { seconds: Date.now() / 1000 } as any,
                confirmedBy: user.id,
                transactionId: paymentForm.transactionId,
                bankAccount: paymentForm.bankAccount,
                notes: paymentForm.notes
              }
            }
          : order
      ));
      
      setShowPaymentModal(null);
      setPaymentForm({ transactionId: '', bankAccount: '', notes: '' });
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      setError('ไม่สามารถยืนยันการชำระเงินได้');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handlePaymentStatusUpdate = async (orderId: string, paymentStatus: Order['paymentStatus']) => {
    if (!isAdmin || !user) return;
    
    try {
      setUpdatingStatus(orderId);
      await updatePaymentStatus(orderId, paymentStatus, user.id);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              paymentStatus,
              status: paymentStatus === 'paid' ? 'confirmed' as const : order.status
            }
          : order
      ));
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      setError('ไม่สามารถอัปเดตสถานะการชำระเงินได้');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handlePaymentSlipUpload = async (orderId: string) => {
    if (!selectedFile || !user) return;

    try {
      setUploadingSlip(true);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const transactionId = `slip_${Date.now()}`;
          
          // Upload payment slip with enhanced details
          await uploadPaymentSlip(orderId, base64, transactionId, {
            amount: undefined, // Could be extracted from form
            transferDate: new Date().toLocaleDateString('th-TH'),
            transferTime: new Date().toLocaleTimeString('th-TH'),
            bankName: 'ธนาคารที่โอน', // Could be from form
            referenceNumber: transactionId,
            notes: 'อัปโหลดผ่านระบบ'
          });

          // Save detailed payment slip record
          if (user) {
            try {
              const order = orders.find(o => o.id === orderId);
              await savePaymentSlipInfo({
                orderId,
                customerId: user.id,
                customerEmail: user.email || '',
                customerName: (user as any).displayName || user.email || 'ลูกค้า',
                slipImageUrl: base64,
                amount: order?.totalAmount || 0,
                transferDate: new Date().toLocaleDateString('th-TH'),
                transferTime: new Date().toLocaleTimeString('th-TH'),
                referenceNumber: transactionId,
                bankName: 'ธนาคารที่โอน',
                transactionId: transactionId,
                notes: `อัปโหลดไฟล์: ${selectedFile.name}`
              });
              
              console.log('Payment slip record saved successfully');
            } catch (slipError) {
              console.warn('Error saving payment slip record:', slipError);
              // Continue even if slip record saving fails
            }
          }

          // Update local state
          setOrders(prev => prev.map(order => 
            order.id === orderId 
              ? { 
                  ...order, 
                  paymentDetails: {
                    ...order.paymentDetails,
                    method: order.paymentDetails?.method || order.paymentMethod || 'transfer',
                    slipImageUrl: 'uploaded',
                    transactionId: transactionId,
                    uploadedAt: { seconds: Date.now() / 1000 } as any
                  }
                }
              : order
          ));

          setShowUploadModal(null);
          setSelectedFile(null);
        } catch (error: any) {
          console.error('Error uploading payment slip:', error);
          setError('ไม่สามารถอัปโหลดหลักฐานการชำระเงินได้');
        } finally {
          setUploadingSlip(false);
        }
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      console.error('Error processing file:', error);
      setError('ไม่สามารถอัปโหลดไฟล์ได้');
      setUploadingSlip(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'confirmed': return '#17a2b8';
      case 'processing': return '#6f42c1';
      case 'shipped': return '#fd7e14';
      case 'delivered': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'processing': return 'กำลังเตรียม';
      case 'shipped': return 'จัดส่งแล้ว';
      case 'delivered': return 'ส่งสำเร็จ';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  const getPaymentStatusColor = (paymentStatus: Order['paymentStatus']) => {
    switch (paymentStatus) {
      case 'unpaid': return '#dc3545';
      case 'paid': return '#28a745';
      case 'refunded': return '#6f42c1';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPaymentStatusText = (paymentStatus: Order['paymentStatus']) => {
    switch (paymentStatus) {
      case 'unpaid': return 'ยังไม่ชำระ';
      case 'paid': return 'ชำระแล้ว';
      case 'refunded': return 'คืนเงินแล้ว';
      case 'failed': return 'ชำระไม่สำเร็จ';
      default: return paymentStatus;
    }
  };

  const getPaymentMethodText = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'transfer': return 'โอนเงินผ่านธนาคาร';
      case 'promptpay': return 'พร้อมเพย์ (PromptPay)';
      case 'truewallet': return 'TrueMoney Wallet';
      case 'cod': return 'ชำระเงินปลายทาง (COD)';
      default: return paymentMethod;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (isLoading || loading) {
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
        <h1> {isAdmin ? 'จัดการคำสั่งซื้อ' : 'คำสั่งซื้อของฉัน'}</h1>
        <p>{isAdmin ? 'จัดการและติดตามคำสั่งซื้อทั้งหมด' : 'ติดตามสถานะคำสั่งซื้อของคุณ'}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters and Search */}
      <div className="dashboard-actions">
        <div className="filters">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="processing">กำลังเตรียม</option>
            <option value="shipped">จัดส่งแล้ว</option>
            <option value="delivered">ส่งสำเร็จ</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
          
          {isAdmin && (
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, อีเมล หรือรหัสคำสั่งซื้อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="dashboard-content">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <h3>ไม่พบคำสั่งซื้อ</h3>
            <p>{isAdmin ? 'ยังไม่มีคำสั่งซื้อในระบบ' : 'คุณยังไม่มีคำสั่งซื้อ'}</p>
            {!isAdmin && (
              <button 
                onClick={() => router.push('/products')}
                className="action-button"
              >
                เลือกซื้อสินค้า
              </button>
            )}
          </div>
        ) : (
          <div className="orders-accordion">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              return (
                <div key={order.id} className={`order-accordion-item ${isExpanded ? 'expanded' : ''}`}>
                  {/* Horizontal Bar - Always Visible */}
                  <div 
                    className="order-bar"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <div className="order-bar-left">
                      <div className="order-number">
                        <strong>#{order.id.slice(-8)}</strong>
                        <span className="order-date">
                          {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('th-TH') : 'ไม่ระบุวันที่'}
                        </span>
                      </div>
                      {isAdmin && (
                        <div className="customer-summary">
                          <span>{order.userName}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="order-bar-center">
                      <div className="order-amount">
                        ฿{order.totalAmount?.toLocaleString() || 'ไม่ระบุ'}
                      </div>
                      <div className="order-items-count">
                        {order.items?.length || 0} รายการ
                      </div>
                    </div>
                    
                    <div className="order-bar-right">
                      <div className="status-badges-compact">
                        <div 
                          className="order-status-compact"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {getStatusText(order.status)}
                        </div>
                        <div 
                          className="payment-status-compact"
                          style={{ backgroundColor: getPaymentStatusColor(order.paymentStatus || 'unpaid') }}
                        >
                          {getPaymentStatusText(order.paymentStatus || 'unpaid')}
                        </div>
                      </div>
                      <div className="expand-icon">
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="order-details">
                      {isAdmin && (
                        <div className="customer-info">
                          <h4>ข้อมูลลูกค้า:</h4>
                          <p><strong>ชื่อ:</strong> {order.userName}</p>
                          <p><strong>อีเมล:</strong> {order.userEmail}</p>
                        </div>
                      )}

                      <div className="order-items">
                        <h4>รายการสินค้า:</h4>
                        {order.items.map((item, index) => (
                          <div key={index} className="order-item">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.productName} 
                                className="item-image"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="item-placeholder">
                                📦
                              </div>
                            )}
                            <div className="item-details">
                              <span className="item-name">{item.productName}</span>
                              <span className="item-quantity">จำนวน: {item.quantity}</span>
                              <span className="item-price">฿{item.price.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="shipping-info">
                        <h4>ที่อยู่จัดส่ง:</h4>
                        <p>{order.shippingAddress.name}</p>
                        <p>{order.shippingAddress.address}</p>
                        <p>{order.shippingAddress.city} {order.shippingAddress.postalCode}</p>
                        <p>โทร: {order.shippingAddress.phone}</p>
                      </div>

                      <div className="order-summary">
                        <div className="total-amount">
                          <strong>ยอดรวม: ฿{order.totalAmount.toLocaleString()}</strong>
                        </div>
                        <div className="payment-method">
                          <strong>วิธีการชำระเงิน:</strong> {getPaymentMethodText(order.paymentMethod)}
                        </div>
                      </div>

                      {/* Payment Details */}
                      {order.paymentDetails && (
                        <div className="payment-details">
                          <h4>รายละเอียดการชำระเงิน</h4>
                          {order.paymentDetails.paidAt && (
                            <p><strong>วันที่ชำระ:</strong> {new Date(order.paymentDetails.paidAt.seconds * 1000).toLocaleDateString('th-TH')}</p>
                          )}
                          {order.paymentDetails.transactionId && (
                            <p><strong>รหัสธุรกรรม:</strong> {order.paymentDetails.transactionId}</p>
                          )}
                          {order.paymentDetails.bankAccount && (
                            <p><strong>บัญชีธนาคาร:</strong> {order.paymentDetails.bankAccount}</p>
                          )}
                          {order.paymentDetails.notes && (
                            <p><strong>หมายเหตุ:</strong> {order.paymentDetails.notes}</p>
                          )}
                          {order.paymentDetails.slipImageUrl && (
                            <div className="payment-slip">
                              <p><strong>หลักฐานการโอนเงิน:</strong></p>
                              <img 
                                src={order.paymentDetails.slipImageUrl} 
                                alt="หลักฐานการโอนเงิน"
                                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admin Actions */}
                      {isAdmin && (
                        <div className="admin-actions">
                          <h4>จัดการคำสั่งซื้อ</h4>
                          <div className="status-controls">
                            <label>สถานะคำสั่งซื้อ:</label>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                              disabled={updatingStatus === order.id}
                            >
                              <option value="pending">รอดำเนินการ</option>
                              <option value="confirmed">ยืนยันแล้ว</option>
                              <option value="processing">กำลังเตรียม</option>
                              <option value="shipped">จัดส่งแล้ว</option>
                              <option value="delivered">ส่งสำเร็จ</option>
                              <option value="cancelled">ยกเลิก</option>
                            </select>
                          </div>
                          
                          <div className="payment-controls">
                            {order.paymentStatus === 'unpaid' && (
                              <button
                                onClick={() => setShowPaymentModal(order.id)}
                                className="action-button confirm-payment"
                              >
                                ยืนยันการชำระเงิน
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="action-button delete-order"
                            >
                              ลบคำสั่งซื้อ
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Customer Actions */}
                      {!isAdmin && (
                        <div className="customer-actions">
                          {order.paymentStatus === 'unpaid' && order.paymentMethod !== 'cod' && (
                            <div className="customer-payment-controls">
                              <h4>การชำระเงิน</h4>
                              <p>กรุณาอัปโหลดหลักฐานการโอนเงิน</p>
                              <button
                                onClick={() => setShowUploadModal(order.id)}
                                className="action-button upload-slip"
                              >
                                อัปโหลดสลิป
                              </button>
                            </div>
                          )}
                          
                          {order.paymentStatus === 'unpaid' && (
                            <div className="slip-uploaded">
                              <span className="status-text">อัปโหลดหลักฐานให้เรียบร้อย</span>
                              <span className="waiting-text">แล้วรอการตรวจสอบจากแอดมิน</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Confirmation Modal */}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(null)}>
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ยืนยันการชำระเงิน</h2>
              <button 
                onClick={() => setShowPaymentModal(null)}
                className="close-button"
              >
                ✕
              </button>
            </div>

            <div className="payment-form">
              <div className="form-group">
                <label>รหัสธุรกรรม</label>
                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm(prev => ({...prev, transactionId: e.target.value}))}
                  placeholder="กรอกรหัสธุรกรรม (ถ้ามี)"
                />
              </div>

              <div className="form-group">
                <label>บัญชีที่โอนเข้า</label>
                <input
                  type="text"
                  value={paymentForm.bankAccount}
                  onChange={(e) => setPaymentForm(prev => ({...prev, bankAccount: e.target.value}))}
                  placeholder="เช่น กสิกรไทย xxx-x-xxxxx-x"
                />
              </div>

              <div className="form-group">
                <label>หมายเหตุ</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({...prev, notes: e.target.value}))}
                  placeholder="หมายเหตุเพิ่มเติม"
                  rows={3}
                />
              </div>

              <div className="payment-actions">
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="cancel-button"
                  disabled={updatingStatus === showPaymentModal}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handlePaymentConfirm(showPaymentModal)}
                  className="confirm-button"
                  disabled={updatingStatus === showPaymentModal}
                >
                  {updatingStatus === showPaymentModal ? 'กำลังยืนยัน...' : 'ยืนยันการชำระเงิน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Slip Upload Modal */}
      {showUploadModal && !isAdmin && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(null)}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>อัปโหลดหลักฐานการชำระเงิน</h2>
              <button 
                onClick={() => setShowUploadModal(null)}
                className="close-button"
              >
                ✕
              </button>
            </div>

            <div className="upload-form">
              <div className="upload-instructions">
                <h4> คำแนะนำ</h4>
                <ul>
                  <li>อัปโหลดไฟล์รูปภาพ (JPG, PNG) เท่านั้น</li>
                  <li>ขนาดไฟล์ไม่เกิน 5MB</li>
                  <li>ภาพต้องชัดเจน อ่านได้ง่าย</li>
                  <li>ต้องมีจำนวนเงินและรายละเอียดครบถ้วน</li>
                </ul>
              </div>

              <div className="file-upload-section">
                <label htmlFor="payment-slip" className="file-upload-label">
                  📎 เลือกไฟล์หลักฐานการโอน
                </label>
                <input
                  id="payment-slip"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="file-input"
                />
                {selectedFile && (
                  <div className="file-preview">
                    <p>ไฟล์ที่เลือก: <strong>{selectedFile.name}</strong></p>
                    <p>ขนาด: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>

              <div className="upload-actions">
                <button
                  onClick={() => {
                    setShowUploadModal(null);
                    setSelectedFile(null);
                  }}
                  className="cancel-button"
                  disabled={uploadingSlip}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handlePaymentSlipUpload(showUploadModal)}
                  className="upload-button"
                  disabled={!selectedFile || uploadingSlip}
                >
                  {uploadingSlip ? 'กำลังอัปโหลด...' : 'อัปโหลดหลักฐาน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add CSS styles
const styles = `
  /* Order Items Styles */
  .order-items {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
  }

  .order-items h4 {
    margin: 0 0 1rem 0;
    color: #495057;
    font-size: 1.1rem;
  }

  .order-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    margin-bottom: 0.75rem;
  }

  .order-item:last-child {
    margin-bottom: 0;
  }

  .item-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #dee2e6;
    flex-shrink: 0;
  }

  .item-placeholder {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .item-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .item-name {
    font-weight: 600;
    color: #495057;
    font-size: 1rem;
  }

  .item-quantity {
    color: #6c757d;
    font-size: 0.9rem;
  }

  .item-price {
    color: #007bff;
    font-weight: 600;
    font-size: 1rem;
  }

  /* Payment Status Styles */
  .payment-status-paid {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .payment-status-unpaid {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .payment-status-refunded {
    background: #ffeeba;
    color: #856404;
    border: 1px solid #ffeaa7;
  }

  .payment-status-failed {
    background: #f5c6cb;
    color: #721c24;
    border: 1px solid #f1b0b7;
  }

  .payment-controls {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .payment-controls button {
    padding: 0.25rem 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .confirm-payment-btn {
    background: #28a745;
    color: white;
  }

  .confirm-payment-btn:hover {
    background: #218838;
  }

  .refund-btn {
    background: #ffc107;
    color: #212529;
  }

  .refund-btn:hover {
    background: #e0a800;
  }

  .payment-details {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 6px;
    margin-top: 0.5rem;
  }

  .payment-details h4 {
    margin: 0 0 0.5rem 0;
    color: #495057;
    font-size: 0.9rem;
  }

  .payment-details p {
    margin: 0.25rem 0;
    font-size: 0.8rem;
    color: #6c757d;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .payment-modal {
    padding: 0;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #dee2e6;
  }

  .modal-header h2 {
    margin: 0;
    color: #495057;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .close-button:hover {
    background: #e9ecef;
  }

  .payment-form {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #495057;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.15s;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  .payment-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }

  .payment-actions button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .cancel-button {
    background: #6c757d;
    color: white;
  }

  .cancel-button:hover {
    background: #5a6268;
  }

  .confirm-button {
    background: #28a745;
    color: white;
  }

  .confirm-button:hover {
    background: #218838;
  }

  .confirm-button:disabled,
  .cancel-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Customer Payment Controls */
  .customer-payment-controls {
    background: #f8f9ff;
    border: 1px solid #e3e8ff;
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 1rem;
  }

  .upload-section h4 {
    margin: 0 0 0.5rem 0;
    color: #495057;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .upload-note {
    color: #6c757d;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .upload-slip-button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .upload-slip-button:hover {
    background: #0056b3;
    transform: translateY(-1px);
  }

  .slip-uploaded {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 6px;
    color: #155724;
  }

  .success-icon {
    font-size: 1.2rem;
  }

  .reupload-button {
    background: #6c757d;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .reupload-button:hover {
    background: #5a6268;
  }

  /* Upload Modal */
  .upload-modal {
    max-width: 600px;
    padding: 0;
  }

  .upload-form {
    padding: 1.5rem;
  }

  .upload-instructions {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .upload-instructions h4 {
    margin: 0 0 0.75rem 0;
    color: #856404;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .upload-instructions ul {
    margin: 0;
    padding-left: 1.25rem;
    color: #856404;
  }

  .upload-instructions li {
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
  }

  .file-upload-section {
    margin-bottom: 1.5rem;
  }

  .file-upload-label {
    display: inline-block;
    background: #007bff;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .file-upload-label:hover {
    background: #0056b3;
  }

  .file-input {
    display: none;
  }

  .file-preview {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 1rem;
    margin-top: 0.5rem;
  }

  .file-preview p {
    margin: 0.25rem 0;
    color: #495057;
  }

  .upload-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .upload-button {
    background: #28a745;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .upload-button:hover {
    background: #218838;
  }

  .upload-button:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .order-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      text-align: center;
    }

    .item-image {
      width: 80px;
      height: 80px;
      align-self: center;
    }

    .item-placeholder {
      width: 80px;
      height: 80px;
      align-self: center;
      font-size: 2rem;
    }

    .item-details {
      align-items: center;
      text-align: center;
      width: 100%;
    }

    .customer-payment-controls {
      padding: 1rem;
    }

    .slip-uploaded {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .upload-modal {
      max-width: 95%;
    }

    .upload-actions {
      flex-direction: column;
    }

    .upload-actions button {
      width: 100%;
    }
  }
`;

// Inject styles
if (typeof window !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  if (!document.head.querySelector('style[data-payment-styles]')) {
    styleElement.setAttribute('data-payment-styles', 'true');
    document.head.appendChild(styleElement);
  }
}
