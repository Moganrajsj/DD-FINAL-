import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUpload, FiX, FiPlus, FiRotateCw, FiArrowLeft, FiArrowUp, FiCrop, FiCheck, FiXCircle } from 'react-icons/fi';

function PostProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category_id: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [originalImageSrc, setOriginalImageSrc] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageTransform, setImageTransform] = useState({
    scaleX: 1,
    scaleY: 1,
    rotation: 0
  });

  useEffect(() => {
    // Check if user is logged in and has verified company
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (!parsedUser.has_company) {
      // Redirect to register company
      navigate('/register-company');
      return;
    }

    if (!parsedUser.company_verified) {
      setError('Your company is pending verification. Please register your company and wait for admin approval. Once approved, you will be able to post products and access the Seller Dashboard.');
    }

    const fetchData = async () => {
      try {
        const catRes = await axios.get('/api/categories');
        setCategories(catRes.data);
      } catch (err) {
        console.error('Error loading form data', err);
      }
    };
    fetchData();
  }, [navigate]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setImageFile(file);
    
    // Create preview and store original
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImageSrc(reader.result);
      setImagePreview(reader.result);
      setShowImageEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const getTransformedImage = (imageSrc, transform) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions based on rotation
        const isRotated = transform.rotation % 180 !== 0;
        canvas.width = isRotated ? img.height : img.width;
        canvas.height = isRotated ? img.width : img.height;
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((transform.rotation * Math.PI) / 180);
        ctx.scale(transform.scaleX, transform.scaleY);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            resolve(imageSrc);
          }
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  const handleFlipHorizontal = () => {
    setImageTransform(prev => ({ ...prev, scaleX: prev.scaleX * -1 }));
  };

  const handleFlipVertical = () => {
    setImageTransform(prev => ({ ...prev, scaleY: prev.scaleY * -1 }));
  };

  const handleRotate = () => {
    setImageTransform(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  };

  const handleSaveEditedImage = async () => {
    if (!originalImageSrc) return;

    setUploadingImage(true);
    try {
      // Apply all transformations to original image
      const transformedUrl = await getTransformedImage(originalImageSrc, imageTransform);
      
      // Convert to blob for upload
      const response = await fetch(transformedUrl);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'edited-image.jpg');
      formData.append('type', 'product');

      const uploadResponse = await axios.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setForm(prev => ({
        ...prev,
        image_url: uploadResponse.data.url
      }));
      
      setImagePreview(transformedUrl);
      setShowImageEditor(false);
      setImageTransform({ scaleX: 1, scaleY: 1, rotation: 0 });
    } catch (error) {
      console.error('Error uploading edited image:', error);
      alert('Failed to upload edited image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original image
    if (originalImageSrc) {
      setImagePreview(originalImageSrc);
    }
    setShowImageEditor(false);
    setImageTransform({ scaleX: 1, scaleY: 1, rotation: 0 });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    setCreatingCategory(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/categories', {
        name: newCategoryName.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add new category to the list
      setCategories(prev => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Select the new category
      setForm(prev => ({
        ...prev,
        category_id: response.data.id.toString()
      }));
      
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error creating category:', error);
      alert(error.response?.data?.error || 'Failed to create category. Please try again.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleRemoveImage = () => {
      setImageFile(null);
      setImagePreview(null);
      setOriginalImageSrc(null);
      setForm(prev => ({
        ...prev,
        image_url: ''
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      const payload = {
        ...form,
        price: form.price ? Number(form.price) : null,
        user_id: user.id
      };
      
      await axios.post('/api/post-product', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('Product posted successfully!');
      setForm({
        name: '',
        description: '',
        price: '',
        image_url: '',
        category_id: '',
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-dark-text">Post a Product</h1>
          <p className="text-dark-muted">Reach thousands of buyers on DealsDouble.ai</p>
        </div>

        <div className="glass-effect rounded-xl p-8">
          {message && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500 text-green-400">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-400">
              {error}
              {!user?.has_company && (
                <button
                  onClick={() => navigate('/register-company')}
                  className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:opacity-90 transition-opacity"
                >
                  Register Your Company Now
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold text-dark-text">Product Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter product name"
                className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-dark-text">Description *</label>
              <textarea
                required
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe your product..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none resize-y"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-dark-text">Price (₹)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="Enter price"
                className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-dark-text">Product Image</label>
              {imagePreview ? (
                <div className="relative">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border border-dark-border">
                    <img
                      ref={imageRef}
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                      style={{
                        transform: `scaleX(${imageTransform.scaleX}) scaleY(${imageTransform.scaleY}) rotate(${imageTransform.rotation}deg)`
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowImageEditor(true)}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        title="Edit Image"
                      >
                        <FiCrop size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        disabled={uploadingImage}
                        title="Remove Image"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  </div>
                  {uploadingImage && (
                    <p className="text-sm text-dark-muted mt-2">Uploading image...</p>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-dark-border rounded-lg cursor-pointer hover:border-accent-purple transition-colors bg-dark-card">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUpload className="text-4xl text-dark-muted mb-2" />
                    <p className="mb-2 text-sm text-dark-text">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-dark-muted">PNG, JPG, GIF or WEBP (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-semibold text-dark-text">Category *</label>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="text-sm text-accent-purple hover:text-accent-pink flex items-center gap-1 font-semibold transition-colors"
                >
                  <FiPlus size={16} />
                  Add New Category
                </button>
              </div>
              <select
                required
                value={form.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text focus:border-accent-purple focus:outline-none"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !!error}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Posting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-dark-text mb-4">Add New Category</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCategory();
                }
              }}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creatingCategory ? 'Creating...' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {showImageEditor && imagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-dark-text mb-4">Edit Image</h3>
            
            <div className="mb-4 border border-dark-border rounded-lg overflow-hidden bg-gray-100">
              <div className="relative w-full h-96 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Edit"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `scaleX(${imageTransform.scaleX}) scaleY(${imageTransform.scaleY}) rotate(${imageTransform.rotation}deg)`
                  }}
                />
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex flex-wrap gap-3 mb-4">
              <button
                type="button"
                onClick={handleFlipHorizontal}
                className="px-4 py-2 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors flex items-center gap-2"
              >
                <FiArrowLeft size={18} />
                Flip Horizontal
              </button>
              <button
                type="button"
                onClick={handleFlipVertical}
                className="px-4 py-2 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors flex items-center gap-2"
              >
                <FiArrowUp size={18} />
                Flip Vertical
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="px-4 py-2 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors flex items-center gap-2"
              >
                <FiRotateCw size={18} />
                Rotate 90°
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveEditedImage}
                disabled={uploadingImage}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiCheck size={18} />
                {uploadingImage ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={uploadingImage}
                className="px-4 py-2 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors flex items-center gap-2"
              >
                <FiXCircle size={18} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostProduct;
