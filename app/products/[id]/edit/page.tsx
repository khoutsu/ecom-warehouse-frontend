'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { getProductById, updateProduct, CreateProductData } from '../../../../lib/productService';

export default function EditProductPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock: 0,
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

  useEffect(() => {
    const fetchProduct = async () => {
      if (productId) {
        try {
          setProductLoading(true);
          const product = await getProductById(productId);
          
          if (!product) {
            setError('ไม่พบสินค้าที่ต้องการแก้ไข');
            return;
          }
          
          setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stock: product.stock,
            imageUrl: product.imageUrl || '',
            isActive: product.isActive
          });

          // Set image preview if there's an existing image
          if (product.imageUrl) {
            setImagePreview(product.imageUrl);
          }
          
          setError('');
        } catch (error: any) {
          console.error('Error fetching product:', error);
          setError('ไม่สามารถโหลดข้อมูลสินค้าได้');
        } finally {
          setProductLoading(false);
        }
      }
    };

    fetchProduct();
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value
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

    if (formData.price <= 0) {
      setError('กรุณากรอกราคาที่ถูกต้อง');
      setLoading(false);
      return;
    }

    if (!formData.category.trim()) {
      setError('กรุณากรอกหมวดหมู่สินค้า');
      setLoading(false);
      return;
    }

    if (formData.stock < 0) {
      setError('จำนวนคงเหลือต้องไม่น้อยกว่า 0');
      setLoading(false);
      return;
    }

    try {
      // If there's an image file, convert it to base64
      if (imageFile) {
        const base64Image = await convertFileToBase64(imageFile);
        formData.imageUrl = base64Image;
      }

      await updateProduct(productId, formData);
      router.push('/products');
    } catch (error: any) {
      setError(error.message || 'ไม่สามารถอัปเดตสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || productLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">กำลังโหลด...</div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>แก้ไขสินค้า</h1>
        </div>
        <div className="dashboard-content">
          <div className="error-message">{error}</div>
          <button onClick={() => router.push('/products')} className="action-button">
            กลับไปยังรายการสินค้า
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>แก้ไขสินค้า</h1>
        <p>แก้ไขข้อมูลสินค้าในระบบ</p>
      </div>

      <div className="dashboard-content">
        <div className="form-container">
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">ชื่อสินค้า *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="กรอกชื่อสินค้า"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">หมวดหมู่ *</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="เช่น จาน, ช้อน, ส้อม, ใบไม้"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">รายละเอียดสินค้า *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="กรอกรายละเอียดสินค้า"
                className="form-textarea"
                rows={4}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">ราคา (บาท) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">จำนวนคงเหลือ *</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="image">รูปภาพสินค้า</label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="form-input file-input"
              />
              <small className="form-help">
                รองรับไฟล์: JPG, PNG, GIF (ขนาดไม่เกิน 5MB)
              </small>
              
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button" 
                    onClick={removeImage}
                    className="remove-image-btn"
                  >
                    ลบรูปภาพ
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                เปิดใช้งานสินค้า
              </label>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button 
                type="button"
                onClick={() => router.push('/products')}
                className="cancel-button"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button 
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'กำลังอัปเดต...' : 'อัปเดตสินค้า'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
