'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { getProductById } from '../../../lib/productService';
import { createOrder, CreateOrderData } from '../../../lib/orderService';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return;
      
      try {
        const productData = await getProductById(params.id as string);
        setProduct(productData);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  const handleAddToOrder = async () => {
    if (!product || !user) {
      alert('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ');
      router.push('/login');
      return;
    }

    // Navigate to orders page with product data as URL params
    const params = new URLSearchParams({
      productId: product.id,
      productName: product.name,
      price: product.price.toString(),
      quantity: quantity.toString(),
      imageUrl: product.imageUrl || ''
    });
    
    router.push(`/orders?${params.toString()}`);
  };

  const handleBuyNow = async () => {
    if (!product || !user) {
      alert('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ');
      router.push('/login');
      return;
    }

    // Navigate to orders page with product data as URL params
    const params = new URLSearchParams({
      productId: product.id,
      productName: product.name,
      price: product.price.toString(),
      quantity: quantity.toString(),
      imageUrl: product.imageUrl || '',
      buyNow: 'true'
    });
    
    router.push(`/orders?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <p>กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>❌</div>
          <h2>ไม่พบสินค้า</h2>
          <p>ขออภัย ไม่พบสินค้าที่คุณต้องการ</p>
          <button
            onClick={() => router.push('/products')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            กลับไปหน้าสินค้า
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px'
    }}>
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        style={{
          marginBottom: '20px',
          padding: '10px 16px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        ← กลับ
      </button>

      <div 
        className="product-detail-grid"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '40px'
        }}
      >
        {/* Product Image */}
        <div style={{ 
          position: 'relative',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          overflow: 'hidden',
          aspectRatio: '1/1'
        }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                if (placeholder) {
                  placeholder.style.display = 'flex';
                }
              }}
            />
          ) : null}
          
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f8f9fa',
            display: product.imageUrl ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '64px',
            color: '#dee2e6'
          }}>
            📦
          </div>
        </div>

        {/* Product Info */}
        <div style={{ padding: '20px 0' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            marginBottom: '16px',
            color: '#333',
            lineHeight: '1.3'
          }}>
            {product.name}
          </h1>

          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#007bff',
            marginBottom: '16px'
          }}>
            {formatPrice(product.price)}
          </div>

          <div style={{ 
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>หมวดหมู่:</strong> {product.category}
            </div>
            <div style={{ 
              color: product.stock > 0 ? '#28a745' : '#dc3545',
              fontWeight: '500'
            }}>
              <strong>สถานะ:</strong> {product.stock > 0 ? `มีสินค้า ${product.stock} ชิ้น` : 'สินค้าหมด'}
            </div>
          </div>

          {product.description && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                color: '#333'
              }}>
                รายละเอียดสินค้า
              </h3>
              <p style={{ 
                color: '#666', 
                lineHeight: '1.6',
                whiteSpace: 'pre-line'
              }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500' 
              }}>
                จำนวน:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1 && value <= product.stock) {
                      setQuantity(value);
                    }
                  }}
                  min={1}
                  max={product.stock}
                  style={{
                    width: '80px',
                    height: '40px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '16px'
                  }}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #dee2e6',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {product.stock > 0 ? (
              <>
                <button
                  onClick={handleAddToOrder}
                  disabled={isProcessing}
                  style={{
                    flex: '1',
                    minWidth: '150px',
                    padding: '16px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    opacity: isProcessing ? 0.7 : 1,
                    minHeight: '44px'
                  }}
                >
                  {isProcessing ? 'กำลังดำเนินการ...' : '🛒 สั่งซื้อสินค้า'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isProcessing}
                  style={{
                    flex: '1',
                    minWidth: '150px',
                    padding: '16px 24px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    opacity: isProcessing ? 0.7 : 1,
                    minHeight: '44px'
                  }}
                >
                  🛍️ ซื้อเลย
                </button>
              </>
            ) : (
              <button
                disabled
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'not-allowed',
                  fontSize: '16px',
                  fontWeight: '500',
                  minHeight: '44px'
                }}
              >
                สินค้าหมด
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}