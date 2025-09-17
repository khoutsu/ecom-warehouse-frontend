'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../app/contexts/AuthContext';
import { getPopularProducts, getRecommendedProducts, getNewProducts, PopularProduct } from '../lib/analyticsService';

interface PopularProductsProps {
  showRecommendations?: boolean;
  limitCount?: number;
}

export default function PopularProducts({ 
  showRecommendations = true, 
  limitCount = 8 
}: PopularProductsProps) {
  const { user } = useAuth();
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<PopularProduct[]>([]);
  const [newProducts, setNewProducts] = useState<PopularProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'popular' | 'recommended' | 'new'>('popular');

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const [popular, newItems] = await Promise.all([
          getPopularProducts(limitCount),
          getNewProducts(Math.min(limitCount, 6))
        ]);
        
        setPopularProducts(popular);
        setNewProducts(newItems);
        
        // Get recommendations only for logged-in users
        if (user && showRecommendations) {
          const recommended = await getRecommendedProducts(user.id, limitCount);
          setRecommendedProducts(recommended);
          setActiveTab('recommended');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user, limitCount, showRecommendations]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  const getDisplayProducts = () => {
    switch (activeTab) {
      case 'recommended':
        return recommendedProducts;
      case 'new':
        return newProducts;
      default:
        return popularProducts;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'recommended':
        return ' แนะนำสำหรับคุณ';
      case 'new':
        return ' สินค้าใหม่';
      default:
        return ' สินค้ายอดนิยม';
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '12px',
        margin: '20px 0'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
        <p>กำลังโหลดสินค้า...</p>
      </div>
    );
  }

  return (
    <div style={{ margin: '30px 0' }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('popular')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'popular' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'popular' ? 'white' : '#666',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
        >
          🔥 สินค้ายอดนิยม
        </button>
        
        {user && showRecommendations && recommendedProducts.length > 0 && (
          <button
            onClick={() => setActiveTab('recommended')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'recommended' ? '#28a745' : '#f8f9fa',
              color: activeTab === 'recommended' ? 'white' : '#666',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
             แนะนำสำหรับคุณ
          </button>
        )}
        
        {newProducts.length > 0 && (
          <button
            onClick={() => setActiveTab('new')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'new' ? '#ffc107' : '#f8f9fa',
              color: activeTab === 'new' ? '#212529' : '#666',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
             สินค้าใหม่
          </button>
        )}
      </div>

      {/* Section Header */}
      <h2 style={{ 
        fontSize: '1.8rem', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        color: '#333',
        textAlign: 'center'
      }}>
        {getTabTitle()}
      </h2>

      {/* Products Grid */}
      {getDisplayProducts().length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📦</div>
          <p>ไม่มีสินค้าในหมวดนี้</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '20px' 
        }}>
          {getDisplayProducts().map((product) => (
            <div
              key={product.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
            >
              {/* Product Image */}
              <div style={{ 
                position: 'relative',
                paddingBottom: '75%', // 4:3 aspect ratio
                overflow: 'hidden'
              }}>
                {product.imageUrl && product.imageUrl.trim() !== '' ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      // Hide the broken image and show placeholder
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                      if (placeholder) {
                        placeholder.style.display = 'flex';
                      }
                    }}
                    onLoad={(e) => {
                      // Ensure image is visible when loaded successfully
                      e.currentTarget.style.display = 'block';
                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                      if (placeholder) {
                        placeholder.style.display = 'none';
                      }
                    }}
                  />
                ) : null}
                
                {/* Fallback placeholder - always present but hidden when image loads */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f8f9fa',
                  display: product.imageUrl && product.imageUrl.trim() !== '' ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  color: '#dee2e6'
                }}>
                  📦
                </div>
                
                {/* Popularity Badge */}
                {activeTab === 'popular' && product.totalSold > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ขายแล้ว {product.totalSold}
                  </div>
                )}
                
                {/* New Badge */}
                {activeTab === 'new' && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ใหม่
                  </div>
                )}
                
                {/* Recommended Badge */}
                {activeTab === 'recommended' && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    แนะนำ
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div style={{ padding: '15px' }}>
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: '#333',
                  lineHeight: '1.3',
                  height: '2.6em',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {product.name}
                </h3>
                
                <p style={{ 
                  color: '#666', 
                  fontSize: '0.9rem', 
                  marginBottom: '10px' 
                }}>
                  หมวด: {product.category}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold', 
                    color: '#007bff' 
                  }}>
                    {formatPrice(product.price)}
                  </span>
                  
                  <span style={{ 
                    fontSize: '0.9rem', 
                    color: product.stock > 0 ? '#28a745' : '#dc3545',
                    fontWeight: '500'
                  }}>
                    {product.stock > 0 ? `คงเหลือ ${product.stock}` : 'หมด'}
                  </span>
                </div>

                {/* Additional Stats for Popular/Recommended */}
                {(activeTab === 'popular' || activeTab === 'recommended') && product.totalSold > 0 && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#999',
                    borderTop: '1px solid #eee',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}