import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiX, FiUpload } from 'react-icons/fi';

function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    avatar_url: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    fetchProfile(parsedUser.id);
  }, [navigate]);

  const fetchProfile = async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}/profile`);
      setUser(response.data);
      setFormData({
        name: response.data.name,
        phone: response.data.phone || '',
        bio: response.data.bio || '',
        avatar_url: response.data.avatar_url || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const response = await axios.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        avatar_url: response.data.url
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const response = await axios.put(`/api/users/${userData.id}/profile`, formData);
      
      // Update local storage
      const updatedUser = { ...userData, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setUser(response.data.user);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 animate-pulse">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">My Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        <div className="glass-effect rounded-xl p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{formData.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {editing && (
                  <label className="absolute bottom-0 right-0 bg-accent-purple text-white p-2 rounded-full cursor-pointer hover:bg-accent-pink transition-colors">
                    <FiUpload />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              {uploading && (
                <p className="text-sm text-gray-600 mt-2">Uploading...</p>
              )}
            </div>

            {/* Profile Information */}
            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiUser className="inline mr-2" />
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                ) : (
                  <p className="text-gray-800 text-lg">{user.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiMail className="inline mr-2" />
                  Email
                </label>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiPhone className="inline mr-2" />
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="text-gray-800">{user.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio
                </label>
                {editing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-800">{user.bio || 'No bio provided'}</p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <FiSave />
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: user.name,
                          phone: user.phone || '',
                          bio: user.bio || '',
                          avatar_url: user.avatar_url || ''
                        });
                      }}
                      className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <FiX />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <FiEdit2 />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/order-history')}
            className="glass-effect rounded-xl p-6 text-left hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Order History</h3>
            <p className="text-gray-600 text-sm">View all your past orders</p>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="glass-effect rounded-xl p-6 text-left hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Dashboard</h3>
            <p className="text-gray-600 text-sm">Manage your business</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;

