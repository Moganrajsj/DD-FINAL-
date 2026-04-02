import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUpload, FiX, FiPlus, FiRotateCw, FiArrowLeft, FiArrowUp, FiCrop, FiCheck, FiXCircle, FiPackage, FiZap } from 'react-icons/fi';

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
  const [images, setImages] = useState([]); // Array of { file, preview, url, id }
  const [editingImageIndex, setEditingImageIndex] = useState(null);
  const [originalImageSrc, setOriginalImageSrc] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [postMode, setPostMode] = useState('single'); // 'single' or 'multiple'
  const [multipleProducts, setMultipleProducts] = useState([{
    name: '',
    description: '',
    price: '',
    category_id: '',
    images: []
  }]);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageTransform, setImageTransform] = useState({
    scaleX: 1,
    scaleY: 1,
    rotation: 0
  });
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [showAIGeneratorMultiple, setShowAIGeneratorMultiple] = useState({}); // For multiple products

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

    // If user is admin, redirect to admin portal instead
    if (parsedUser.is_admin) {
      navigate('/admin');
      return;
    }

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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file. Skipping.`);
        continue;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB). Skipping.`);
        continue;
      }

      validFiles.push(file);
    }

    // Create previews for all valid files
    const newImages = await Promise.all(
      validFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              file,
              preview: reader.result,
              url: null,
              id: Date.now() + Math.random() // Temporary ID
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setImages((prev) => [...prev, ...newImages]);
    
    // Reset file input
    e.target.value = '';
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
    if (!originalImageSrc || editingImageIndex === null) return;

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

      // Update the specific image in the array
      setImages((prev) => {
        const updated = [...prev];
        updated[editingImageIndex] = {
          ...updated[editingImageIndex],
          preview: transformedUrl,
          url: uploadResponse.data.url
        };
        return updated;
      });
      
      setShowImageEditor(false);
      setEditingImageIndex(null);
      setImageTransform({ scaleX: 1, scaleY: 1, rotation: 0 });
      setOriginalImageSrc(null);
    } catch (error) {
      console.error('Error uploading edited image:', error);
      alert('Failed to upload edited image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original image
    if (originalImageSrc && editingImageIndex !== null) {
      setImages((prev) => {
        const updated = [...prev];
        updated[editingImageIndex] = {
          ...updated[editingImageIndex],
          preview: originalImageSrc
        };
        return updated;
      });
    }
    setShowImageEditor(false);
    setEditingImageIndex(null);
    setImageTransform({ scaleX: 1, scaleY: 1, rotation: 0 });
    setOriginalImageSrc(null);
  };

  const handleEditImage = (index) => {
    setEditingImageIndex(index);
    setOriginalImageSrc(images[index].preview);
    setShowImageEditor(true);
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Multiple products handlers
  const addProductForm = () => {
    setMultipleProducts((prev) => [...prev, {
      name: '',
      description: '',
      price: '',
      category_id: '',
      images: []
    }]);
  };

  const removeProductForm = (index) => {
    if (multipleProducts.length > 1) {
      setMultipleProducts((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateMultipleProduct = (index, key, value) => {
    setMultipleProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleMultipleProductImageChange = async (e, productIndex) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file. Skipping.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB). Skipping.`);
        continue;
      }

      validFiles.push(file);
    }

    const newImages = await Promise.all(
      validFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              file,
              preview: reader.result,
              url: null,
              id: Date.now() + Math.random()
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setMultipleProducts((prev) => {
      const updated = [...prev];
      updated[productIndex] = {
        ...updated[productIndex],
        images: [...updated[productIndex].images, ...newImages]
      };
      return updated;
    });

    e.target.value = '';
  };

  const removeMultipleProductImage = (productIndex, imageIndex) => {
    setMultipleProducts((prev) => {
      const updated = [...prev];
      updated[productIndex] = {
        ...updated[productIndex],
        images: updated[productIndex].images.filter((_, i) => i !== imageIndex)
      };
      return updated;
    });
  };

  const handleGenerateDescription = async (productIndex = null) => {
    if (!aiPrompt.trim()) {
      alert('Please enter a prompt to generate description');
      return;
    }

    setGeneratingDescription(true);
    try {
      const productName = productIndex !== null 
        ? multipleProducts[productIndex].name 
        : form.name;
      const categoryId = productIndex !== null 
        ? multipleProducts[productIndex].category_id 
        : form.category_id;
      const category = categories.find(c => c.id.toString() === categoryId);
      const categoryName = category ? category.name : '';

      const response = await axios.post('/api/ai/generate-description', {
        prompt: aiPrompt,
        entity_type: 'product',
        additional_info: {
          name: productName,
          category: categoryName
        }
      });

      if (productIndex !== null) {
        // Update multiple product
        updateMultipleProduct(productIndex, 'description', response.data.description);
        setShowAIGeneratorMultiple(prev => ({ ...prev, [productIndex]: false }));
      } else {
        // Update single product
        handleChange('description', response.data.description);
        setShowAIGenerator(false);
      }
      setAiPrompt('');
    } catch (error) {
      console.error('Error generating description:', error);
      alert(error.response?.data?.error || 'Failed to generate description. Please try again.');
    } finally {
      setGeneratingDescription(false);
    }
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


  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'product');

    const uploadResponse = await axios.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return uploadResponse.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (postMode === 'single') {
        // Single product submission (existing logic)
        const firstImageUrl = images.length > 0 && images[0].url ? images[0].url : '';
        
        const payload = {
          ...form,
          price: form.price ? Number(form.price) : null,
          image_url: firstImageUrl,
          user_id: user.id
        };
        
        const productResponse = await axios.post('/api/post-product', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const productId = productResponse.data.id;
        
        if (images.length > 0) {
          setUploadingImage(true);
          try {
            for (let i = 0; i < images.length; i++) {
              const image = images[i];
              let imageUrl = image.url;
              
              if (!imageUrl && image.file) {
                imageUrl = await uploadImageFile(image.file);
              }
              
              await axios.post(`/api/products/${productId}/images`, {
                image_url: imageUrl,
                is_primary: i === 0
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            }
          } catch (imgError) {
            console.error('Error uploading images:', imgError);
          } finally {
            setUploadingImage(false);
          }
        }
        
        // Use the message from the backend response (which mentions admin approval)
        setMessage(productResponse.data.message || 'Product posted successfully! Waiting for admin approval.');
        setForm({
          name: '',
          description: '',
          price: '',
          image_url: '',
          category_id: '',
        });
        setImages([]);
      } else {
        // Multiple products submission
        let successCount = 0;
        let errorCount = 0;

        for (let idx = 0; idx < multipleProducts.length; idx++) {
          const product = multipleProducts[idx];
          
          if (!product.name || !product.category_id) {
            errorCount++;
            continue; // Skip invalid products
          }

          try {
            const firstImageUrl = product.images.length > 0 && product.images[0].url 
              ? product.images[0].url : '';
            
            const payload = {
              name: product.name,
              description: product.description || '',
              price: product.price ? Number(product.price) : null,
              image_url: firstImageUrl,
              category_id: product.category_id,
              user_id: user.id
            };
            
            const productResponse = await axios.post('/api/post-product', payload, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const productId = productResponse.data.id;
            
            // Upload images for this product
            if (product.images.length > 0) {
              for (let i = 0; i < product.images.length; i++) {
                const image = product.images[i];
                let imageUrl = image.url;
                
                if (!imageUrl && image.file) {
                  imageUrl = await uploadImageFile(image.file);
                }
                
                await axios.post(`/api/products/${productId}/images`, {
                  image_url: imageUrl,
                  is_primary: i === 0
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              }
            }
            
            successCount++;
          } catch (err) {
            console.error(`Error posting product ${idx + 1}:`, err);
            errorCount++;
          }
        }

        if (successCount > 0) {
          setMessage(`Successfully posted ${successCount} product(s). All products are pending admin approval before appearing in the marketplace.${errorCount > 0 ? ` ${errorCount} product(s) failed.` : ''}`);
          setMultipleProducts([{
            name: '',
            description: '',
            price: '',
            category_id: '',
            images: []
          }]);
        } else {
          setError(`Failed to post products. ${errorCount} product(s) had errors.`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post product(s)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-dark-text">Post a Product</h1>
              <p className="text-dark-muted">Reach thousands of buyers on DealsDouble.ai</p>
            </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-semibold text-dark-text">Post Mode:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPostMode('single')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  postMode === 'single'
                    ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white'
                    : 'bg-gray-100 text-dark-text hover:bg-gray-200'
                }`}
              >
                Single Product
              </button>
              <button
                type="button"
                onClick={() => setPostMode('multiple')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  postMode === 'multiple'
                    ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white'
                    : 'bg-gray-100 text-dark-text hover:bg-gray-200'
                }`}
              >
                Multiple Products
              </button>
            </div>
          </div>
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
            {postMode === 'single' ? (
              // Single Product Form
              <>
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-semibold text-dark-text">Description *</label>
                    <button
                      type="button"
                      onClick={() => setShowAIGenerator(!showAIGenerator)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <FiZap />
                      {showAIGenerator ? 'Manual Entry' : 'AI Generate'}
                    </button>
                  </div>
                  {showAIGenerator ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Enter a prompt, e.g., 'High-quality organic skincare product with anti-aging properties'"
                        className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleGenerateDescription()}
                          disabled={generatingDescription || !aiPrompt.trim()}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                        >
                          {generatingDescription ? (
                            <>
                              <FiRotateCw className="animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FiZap />
                              Generate Description
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAIGenerator(false);
                            setAiPrompt('');
                          }}
                          className="px-4 py-2 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs text-dark-muted">
                        AI will generate a professional product description based on your prompt.
                      </p>
                    </div>
                  ) : (
                    <textarea
                      required
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Describe your product..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none resize-y"
                    />
                  )}
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
                  <label className="block mb-2 font-semibold text-dark-text">Product Images</label>
                  
                  {/* Display uploaded images */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {images.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-dark-border">
                            <img
                              src={image.preview}
                              alt={`Product preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleEditImage(index)}
                                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                                title="Edit Image"
                              >
                                <FiCrop size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                disabled={uploadingImage}
                                title="Remove Image"
                              >
                                <FiX size={16} />
                              </button>
                            </div>
                            {index === 0 && (
                              <div className="absolute bottom-2 left-2 px-2 py-1 bg-accent-purple text-white text-xs font-semibold rounded">
                                Primary
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-dark-border rounded-lg cursor-pointer hover:border-accent-purple transition-colors bg-dark-card">
                    <div className="flex flex-col items-center justify-center pt-3 pb-3">
                      <FiUpload className="text-3xl text-dark-muted mb-2" />
                      <p className="mb-1 text-sm text-dark-text">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-dark-muted">PNG, JPG, GIF or WEBP (MAX. 5MB each)</p>
                      {images.length > 0 && (
                        <p className="text-xs text-accent-purple mt-1">{images.length} image(s) added</p>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      disabled={uploadingImage}
                    />
                  </label>
                  {uploadingImage && (
                    <p className="text-sm text-dark-muted mt-2">Uploading images...</p>
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
                    {loading ? 'Posting...' : 'Submit Product'}
                  </button>
                </div>
              </>
            ) : (
              // Multiple Products Form
              <div className="space-y-6">
                {multipleProducts.map((product, productIndex) => (
                  <div key={productIndex} className="border border-dark-border rounded-xl p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
                        <FiPackage className="text-accent-purple" />
                        Product {productIndex + 1}
                      </h3>
                      {multipleProducts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductForm(productIndex)}
                          className="px-3 py-1 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 text-sm font-semibold transition-colors flex items-center gap-1"
                        >
                          <FiX size={14} />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 font-semibold text-dark-text text-sm">Product Name *</label>
                        <input
                          type="text"
                          required
                          value={product.name}
                          onChange={(e) => updateMultipleProduct(productIndex, 'name', e.target.value)}
                          placeholder="Enter product name"
                          className="w-full px-4 py-2 rounded-lg bg-white border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block font-semibold text-dark-text text-sm">Description *</label>
                          <button
                            type="button"
                            onClick={() => setShowAIGeneratorMultiple(prev => ({ ...prev, [productIndex]: !prev[productIndex] }))}
                            className="px-2 py-1 text-xs rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
                          >
                            <FiZap size={12} />
                            {showAIGeneratorMultiple[productIndex] ? 'Manual' : 'AI'}
                          </button>
                        </div>
                        {showAIGeneratorMultiple[productIndex] ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder="Enter prompt for description..."
                              className="w-full px-3 py-2 rounded-lg bg-white border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleGenerateDescription(productIndex)}
                                disabled={generatingDescription || !aiPrompt.trim()}
                                className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                              >
                                {generatingDescription ? (
                                  <>
                                    <FiRotateCw className="animate-spin" size={12} />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <FiZap size={12} />
                                    Generate
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAIGeneratorMultiple(prev => ({ ...prev, [productIndex]: false }));
                                  setAiPrompt('');
                                }}
                                className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 border border-dark-border hover:border-accent-purple transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <textarea
                            required
                            value={product.description}
                            onChange={(e) => updateMultipleProduct(productIndex, 'description', e.target.value)}
                            placeholder="Describe your product..."
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg bg-white border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none resize-y"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 font-semibold text-dark-text text-sm">Price (₹)</label>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => updateMultipleProduct(productIndex, 'price', e.target.value)}
                            placeholder="Enter price"
                            className="w-full px-4 py-2 rounded-lg bg-white border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block mb-2 font-semibold text-dark-text text-sm">Category *</label>
                          <select
                            required
                            value={product.category_id}
                            onChange={(e) => updateMultipleProduct(productIndex, 'category_id', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white border border-dark-border text-dark-text focus:border-accent-purple focus:outline-none"
                          >
                            <option value="">Select category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block mb-2 font-semibold text-dark-text text-sm">Product Images</label>
                        
                        {product.images.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {product.images.map((image, imgIndex) => (
                              <div key={image.id} className="relative">
                                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-dark-border">
                                  <img
                                    src={image.preview}
                                    alt={`Preview ${imgIndex + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeMultipleProductImage(productIndex, imgIndex)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                  >
                                    <FiX size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-dark-border rounded-lg cursor-pointer hover:border-accent-purple transition-colors bg-white">
                          <div className="flex flex-col items-center justify-center">
                            <FiUpload className="text-xl text-dark-muted mb-1" />
                            <p className="text-xs text-dark-text">Add Images</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleMultipleProductImageChange(e, productIndex)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={addProductForm}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-dark-text hover:bg-gray-300 font-semibold transition-colors flex items-center gap-2"
                  >
                    <FiPlus size={18} />
                    Add Another Product
                  </button>
                </div>

                <div className="pt-4 border-t border-dark-border">
                  <button
                    type="submit"
                    disabled={loading || !!error}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? `Posting ${multipleProducts.length} Product(s)...` : `Post ${multipleProducts.length} Product(s)`}
                  </button>
                </div>
              </div>
            )}
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
      {showImageEditor && editingImageIndex !== null && images[editingImageIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-dark-text mb-4">Edit Image</h3>
            
            <div className="mb-4 border border-dark-border rounded-lg overflow-hidden bg-gray-100">
              <div className="relative w-full h-96 flex items-center justify-center">
                <img
                  ref={imageRef}
                  src={images[editingImageIndex].preview}
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
