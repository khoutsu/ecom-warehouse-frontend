'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createProduct, CreateProductData } from '../../../lib/productService';

// Form state interface that allows string inputs for numbers
interface FormState {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  imageUrl: string;
  isActive: boolean;
}

export default function AddProductPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<FormState>({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    imageUrl: '',
    isActive: true
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Redirect if not admin
  if (!isLoading && (!user || user.role !== 'admin')) {
    router.push('/products');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }

      // Validate file size (max 2MB for processing)
      if (file.size > 2 * 1024 * 1024) {
        setError('ขนาดไฟล์ต้องไม่เกิน 2MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(''); // Clear any previous errors
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  // Convert and compress file to base64 with size limit
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 400x400)
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to keep under size limit
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality if still too large (target: under 100KB base64)
        while (result.length > 100000 && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(result);
      };
      
      img.onerror = reject;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Convert string values to numbers for validation
    const price = parseFloat(formData.price) || 0;
    const stock = parseInt(formData.stock) || 0;

    // Validation
    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อสินค้า');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('กรุณากรอกรายละเอียดสินค้า');
      setLoading(false);
      return;
    }

    if (price <= 0) {
      setError('กรุณากรอกราคาที่ถูกต้อง');
      setLoading(false);
      return;
    }

    if (!formData.category.trim()) {
      setError('กรุณากรอกหมวดหมู่สินค้า');
      setLoading(false);
      return;
    }

    if (stock < 0) {
      setError('จำนวนคงเหลือต้องไม่น้อยกว่า 0');
      setLoading(false);
      return;
    }

    try {
      // Create product data with converted numbers
      const productData: CreateProductData = {
        name: formData.name,
        description: formData.description,
        price: price,
        category: formData.category,
        stock: stock,
        imageUrl: formData.imageUrl,
        isActive: formData.isActive
      };

      // If there's an image file, convert it to base64
      if (imageFile) {
        const base64Image = await convertFileToBase64(imageFile);
        productData.imageUrl = base64Image;
      }

      await createProduct(productData);
      setSuccess('เพิ่มสินค้าสำเร็จ และซิงค์คลังสินค้าแล้ว!');
      setTimeout(() => {
        router.push('/products');
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'ไม่สามารถเพิ่มสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 10px 0',
          color: '#333',
          fontSize: '1.8rem',
          fontWeight: 'bold'
        }}>
          เพิ่มสินค้าใหม่
        </h1>
        <p style={{ 
          margin: 0,
          color: '#666',
          fontSize: '1rem'
        }}>
          สร้างสินค้าใหม่ในระบบ
        </p>
      </div>

      {/* Form */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Row 1: Product Name and Category */}
          <div 
            className="form-grid-row"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}
          >
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                ชื่อสินค้า *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="กรอกชื่อสินค้า"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#fff'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                หมวดหมู่ *
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="เช่น จาน, ใบไม้, ช้อน/ส้อม"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#fff'
                }}
              />
            </div>
          </div>

          {/* Product Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              รายละเอียดสินค้า *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="กรอกรายละเอียดสินค้า"
              required
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#fff',
                resize: 'vertical',
                minHeight: '100px'
              }}
            />
          </div>

          {/* Row 2: Price and Stock */}
          <div 
            className="form-grid-row"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}
          >
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                ราคา (บาท) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="กรอกราคาสินค้า"
                min="0"
                step="0.01"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#fff'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                จำนวนคงเหลือ *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="กรอกจำนวนสินค้า"
                min="0"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#fff'
                }}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              รูปภาพสินค้า
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#fff'
              }}
            />
            <small style={{ 
              color: '#666',
              fontSize: '14px',
              display: 'block',
              marginTop: '5px'
            }}>
              รองรับไฟล์: JPG, PNG, GIF (ขนาดไม่เกิน 5MB)
            </small>
            
            {imagePreview && (
              <div style={{ 
                marginTop: '15px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <img 
                  src={imagePreview} 
                  alt="Preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '8px',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
                <button 
                  type="button" 
                  onClick={removeImage}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'block',
                    margin: '10px auto 0'
                  }}
                >
                  ลบรูปภาพ
                </button>
              </div>
            )}
          </div>

          {/* Active Status */}
          <div style={{ 
            marginBottom: '30px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#333'
            }}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                style={{
                  marginRight: '10px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              เปิดใช้งานสินค้า
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              color: '#721c24',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              color: '#155724',
              fontSize: '14px'
            }}>
              {success}
            </div>
          )}

          {/* Form Actions */}
          <div style={{ 
            display: 'flex',
            gap: '15px',
            justifyContent: 'flex-end',
            paddingTop: '20px',
            borderTop: '1px solid #dee2e6'
          }}>
            <button 
              type="button"
              onClick={() => router.push('/products')}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                minWidth: '120px',
                opacity: loading ? 0.7 : 1
              }}
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                minWidth: '120px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'กำลังเพิ่มสินค้า...' : 'เพิ่มสินค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
