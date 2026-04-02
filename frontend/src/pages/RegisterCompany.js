import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiBriefcase, FiMapPin, FiGlobe, FiPhone, FiFileText, FiUpload, FiX, FiImage, FiZap, FiRotateCw } from 'react-icons/fi';

function RegisterCompany() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    website: '',
    phone: '',
    gst_number: '',
    logo_url: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingDescription, setGeneratingDescription] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo size should be less than 5MB');
      return;
    }

    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload logo immediately
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'company');

      const uploadResponse = await axios.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        logo_url: uploadResponse.data.url
      }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
      setLogoFile(null);
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({
      ...prev,
      logo_url: ''
    }));
  };

  const handleGenerateDescription = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a prompt to generate description');
      return;
    }

    setGeneratingDescription(true);
    try {
      const response = await axios.post('/api/ai/generate-description', {
        prompt: aiPrompt,
        entity_type: 'company',
        additional_info: {
          name: formData.name,
          location: formData.location
        }
      });

      setFormData(prev => ({
        ...prev,
        description: response.data.description
      }));
      setShowAIGenerator(false);
      setAiPrompt('');
    } catch (error) {
      console.error('Error generating description:', error);
      alert(error.response?.data?.error || 'Failed to generate description. Please try again.');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      const response = await axios.post('/api/companies/register', {
        ...formData,
        user_id: user.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update user data with company info
      const updatedUser = { ...user, company_id: response.data.company_id, has_company: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-8">
        <div className="glass-effect rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-400 text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-dark-text mb-2">Company Registered!</h2>
          <p className="text-dark-muted mb-4">
            Your company has been registered successfully. Our admin team will verify your business and you'll be able to start selling soon.
          </p>
          <p className="text-sm text-dark-muted">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-dark-text">Register Your Company</h1>
          <p className="text-dark-muted">Add your business details to start selling on DealsDouble.ai</p>
        </div>

        <div className="glass-effect rounded-xl p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                <FiBriefcase className="text-accent-purple" />
                Company Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your company name"
                className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                <FiImage className="text-accent-purple" />
                Company Logo
              </label>
              {logoPreview ? (
                <div className="relative">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-dark-border">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      disabled={uploadingLogo}
                      title="Remove Logo"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                  {uploadingLogo && (
                    <p className="text-sm text-dark-muted mt-2">Uploading logo...</p>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-dark-border rounded-lg cursor-pointer hover:border-accent-purple transition-colors bg-dark-card">
                  <div className="flex flex-col items-center justify-center pt-3 pb-3">
                    <FiUpload className="text-2xl text-dark-muted mb-2" />
                    <p className="mb-1 text-sm text-dark-text">
                      <span className="font-semibold">Click to upload</span> logo
                    </p>
                    <p className="text-xs text-dark-muted">PNG, JPG, GIF or WEBP (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={uploadingLogo}
                  />
                </label>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-semibold text-dark-text flex items-center gap-2">
                  <FiFileText className="text-accent-purple" />
                  Description *
                </label>
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
                    placeholder="Enter a prompt, e.g., 'Manufacturing company specializing in industrial equipment and machinery'"
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
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
                    AI will generate a professional company description based on your prompt.
                  </p>
                </div>
              ) : (
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your business, products, and services..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                />
              )}
            </div>

            <div>
              <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                <FiMapPin className="text-accent-purple" />
                Location *
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Mumbai, India"
                className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                  <FiGlobe className="text-accent-purple" />
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourcompany.com"
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                  <FiPhone className="text-accent-purple" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                  <FiFileText className="text-accent-purple" />
                  GST Number *
                </label>
                <input
                  type="text"
                  name="gst_number"
                  required
                  value={formData.gst_number}
                  onChange={handleChange}
                  placeholder="Enter your GSTIN (e.g., 22AAAAA0000A1Z5)"
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none uppercase tracking-wide"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Company'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterCompany;



